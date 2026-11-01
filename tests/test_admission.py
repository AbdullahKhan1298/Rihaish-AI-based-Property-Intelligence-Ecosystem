"""Deterministic admission tests; fake blocked handlers never touch databases."""
import asyncio
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from app.core.admission import AdmissionControlMiddleware, AdmissionState


async def request(app, path='/api/work', method='GET'):
    messages = []
    async def receive():
        return {'type': 'http.request', 'body': b'', 'more_body': False}
    async def send(message):
        messages.append(message)
    await app({'type': 'http', 'path': path, 'method': method}, receive, send)
    return messages


class AdmissionTests(unittest.IsolatedAsyncioTestCase):
    async def test_excess_post_rejected_before_body_or_handler_and_health_survives(self):
        entered, release = asyncio.Event(), asyncio.Event()
        calls = []
        async def handler(scope, receive, send):
            calls.append((scope['method'], scope['path']))
            if scope['path'] == '/api/work':
                entered.set()
                await release.wait()
            await send({'type': 'http.response.start', 'status': 200, 'headers': []})
            await send({'type': 'http.response.body', 'body': b'{}'})
        state = AdmissionState(1)
        app = AdmissionControlMiddleware(handler, state)
        admitted = asyncio.create_task(request(app))
        await entered.wait()
        rejected = []
        async def never_receive():
            self.fail('A rejected write must not consume its body')
        async def collect(message):
            rejected.append(message)
        await app({'type': 'http', 'path': '/api/write', 'method': 'POST'}, never_receive, collect)
        self.assertEqual(rejected[0]['status'], 503)
        self.assertEqual(dict(rejected[0]['headers'])[b'retry-after'], b'1')
        self.assertEqual(json.loads(rejected[1]['body'])['code'], 'server_overloaded')
        self.assertNotIn(('POST', '/api/write'), calls)
        for path in ('/api/health/live', '/api/health/ready'):
            self.assertEqual((await request(app, path))[0]['status'], 200)
        self.assertEqual(state.snapshot()['active'], 1)
        release.set()
        await admitted
        self.assertEqual((await request(app))[0]['status'], 200)
        self.assertEqual(state.snapshot()['active'], 0)
        self.assertEqual(state.snapshot()['rejected'], 1)
        self.assertEqual(state.snapshot()['peak_active'], 1)

    async def test_exception_and_cancellation_release_capacity(self):
        async def fails(*_):
            raise ValueError('handler failed')
        state = AdmissionState(1)
        with self.assertRaises(ValueError):
            await request(AdmissionControlMiddleware(fails, state))
        self.assertEqual(state.snapshot()['active'], 0)
        entered = asyncio.Event()
        async def blocks(*_):
            entered.set()
            await asyncio.Event().wait()
        task = asyncio.create_task(request(AdmissionControlMiddleware(blocks, state)))
        await entered.wait()
        task.cancel()
        with self.assertRaises(asyncio.CancelledError):
            await task
        self.assertEqual(state.snapshot()['active'], 0)
        self.assertEqual(state.snapshot()['completed'], 2)

    async def test_burst_is_bounded_without_queue(self):
        entered, release = asyncio.Event(), asyncio.Event()
        state = AdmissionState(2)
        async def handler(scope, receive, send):
            if state.snapshot()['active'] == 2:
                entered.set()
            await release.wait()
            await send({'type': 'http.response.start', 'status': 200, 'headers': []})
            await send({'type': 'http.response.body', 'body': b''})
        app = AdmissionControlMiddleware(handler, state)
        first = [asyncio.create_task(request(app)) for _ in range(2)]
        await entered.wait()
        responses = await asyncio.gather(*(request(app) for _ in range(50)))
        self.assertTrue(all(r[0]['status'] == 503 for r in responses))
        self.assertEqual(state.snapshot()['active'], 2)
        self.assertEqual(state.snapshot()['rejected'], 50)
        release.set()
        await asyncio.gather(*first)
        self.assertEqual(state.snapshot()['active'], 0)

    async def test_invalid_limits_fail_closed_at_startup(self):
        for limit in (0, -1, 129):
            with self.assertRaises(ValueError):
                AdmissionState(limit)


if __name__ == '__main__':
    unittest.main()

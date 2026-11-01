"""Bound application work; reject excess requests without queueing or handlers."""
import threading

from starlette.responses import JSONResponse


class AdmissionState:
    def __init__(self, limit=8):
        if not 1 <= limit <= 128:
            raise ValueError('RIHAISH_MAX_INFLIGHT must be between 1 and 128')
        self.limit = limit
        self.active = self.peak_active = self.admitted = self.completed = self.rejected = 0
        self._lock = threading.Lock()

    def enter(self):
        with self._lock:
            if self.active >= self.limit:
                self.rejected += 1
                return False
            self.active += 1
            self.admitted += 1
            self.peak_active = max(self.peak_active, self.active)
            return True

    def leave(self):
        with self._lock:
            self.active -= 1
            self.completed += 1

    def snapshot(self):
        with self._lock:
            return {key: getattr(self, key) for key in
                    ('limit', 'active', 'peak_active', 'admitted', 'completed', 'rejected')} | {'queue_limit': 0, 'scope': 'this API process'}


class AdmissionControlMiddleware:
    HEALTH_PATHS = frozenset(('/api/health/live', '/api/health/ready'))

    def __init__(self, app, state):
        self.app, self.state = app, state

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http' or scope.get('path') in self.HEALTH_PATHS:
            await self.app(scope, receive, send)
            return
        if not self.state.enter():
            response = JSONResponse(
                status_code=503,
                content={'detail': 'Server busy. Please retry shortly.',
                         'code': 'server_overloaded', 'retryable': True},
                headers={'Retry-After': '1', 'Cache-Control': 'no-store',
                         'X-Rihaish-Overload': 'rejected-before-handler'},
            )
            await response(scope, receive, send)
            return
        try:
            await self.app(scope, receive, send)
        finally:
            # Includes handler errors and cancellation: capacity must not leak.
            self.state.leave()

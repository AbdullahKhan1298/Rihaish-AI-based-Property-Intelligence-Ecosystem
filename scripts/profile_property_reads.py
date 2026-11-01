"""Read-only controlled A/B: old per-property hydration vs current batching.

Invokes the real route function and real rqlite cluster in this diagnostic
process only. It does not change the running API or stored records.
"""
import hashlib
import json
import os
import sys
import time
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
os.environ['RIHAISH_DB_BACKEND'] = 'rqlite'
sys.path.insert(0, str(ROOT / 'backend'))
from app.api import routes_properties as routes
from app.db.rqlite import ClusterClient


def measure(city, batched):
    calls = []
    original = ClusterClient.request

    def traced(self, path, statements=None, write=False):
        started = time.perf_counter()
        result = original(self, path + '&timings', statements, write)
        calls.append({'elapsed_ms': (time.perf_counter() - started) * 1000,
                      'sql_statements': len(statements or []),
                      'reported_sql_ms': sum(r.get('time', 0) for r in result.get('results', [])) * 1000})
        return result

    arguments = dict(city=city, society=None, type=None, max_price=None,
                     verified_only=False, min_ai_score=None, min_price=None,
                     q=None, sort='price_asc', page=1, page_size=10)
    started = time.perf_counter()
    with patch.object(ClusterClient, 'request', traced):
        if batched:
            response = routes.get_properties(**arguments)
        else:
            # None selects the existing uncached formatting path, issuing four
            # related-table reads per property; no SQL results are fabricated.
            with patch.object(routes, 'prefetch_details', lambda connection, ids: None):
                response = routes.get_properties(**arguments)
    elapsed = (time.perf_counter() - started) * 1000
    response.pop('query_latency_ms')
    return {'city': city, 'mode': 'batched' if batched else 'per_property',
            'route_elapsed_ms': round(elapsed, 3), 'database_http_requests': len(calls),
            'sql_statements': sum(c['sql_statements'] for c in calls),
            'database_http_elapsed_ms': round(sum(c['elapsed_ms'] for c in calls), 3),
            'reported_sql_ms': round(sum(c['reported_sql_ms'] for c in calls), 3),
            'response_sha256': hashlib.sha256(json.dumps(response, sort_keys=True).encode()).hexdigest()}


if __name__ == '__main__':
    measurements = []
    for city in ('karachi', 'lahore', 'islamabad'):
        before, after = measure(city, False), measure(city, True)
        if before['response_sha256'] != after['response_sha256']:
            raise RuntimeError('Response contract changed: ' + city)
        measurements.extend([before, after])
    result = {'scope': 'Controlled single-request route-function A/B; real SQL and data, no HTTP API routing or load generator',
              'request': {'page_size': 10, 'sort': 'price_asc'}, 'measurements': measurements}
    path = ROOT / 'docs/evidence/property-query-profile.json'
    path.write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result, indent=2))

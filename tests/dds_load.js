import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const api1 = new Counter('api1_responses');
const api2 = new Counter('api2_responses');
export const options = {
  scenarios: { browse: { executor: 'constant-vus', vus: 10, duration: '30s', gracefulStop: '5s' } },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    checks: ['rate>0.99'],
    api1_responses: ['count>0'],
    api2_responses: ['count>0'],
  },
};

export default function () {
  const cities = ['karachi', 'lahore', 'islamabad'];
  const city = cities[(__VU + __ITER) % cities.length];
  const response = http.get(`${__ENV.BASE_URL || 'http://127.0.0.1:8000'}/api/properties/?city=${city}&page_size=10&sort=price_asc`, { timeout: '10s' });
  const instance = response.headers['X-Rihaish-Instance'];
  if (instance === 'api1') api1.add(1);
  if (instance === 'api2') api2.add(1);
  check(response, {
    'HTTP 200': r => r.status === 200,
    'ten sorted SQL results': r => {
      if (r.status !== 200) return false;
      const body = r.json();
      return body.results.length === 10 && body.results.every((p, i, all) => i === 0 || all[i - 1].price <= p.price);
    },
  });
  sleep(0.1);
}

export function handleSummary(data) {
  return { [__ENV.SUMMARY_PATH || 'docs/evidence/k6-summary.json']: JSON.stringify(data, null, 2) };
}

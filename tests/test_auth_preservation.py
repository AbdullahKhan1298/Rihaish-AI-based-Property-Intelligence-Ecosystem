"""Auth and concurrency regression tests use isolated synthetic fixtures only."""
import concurrent.futures
import os
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import hash_password, decode_access_token
from app.core.email_service import email_service
from app.api.routes_watchlist import toggle_watchlist, ToggleWatchlistRequest


class AuthPreservationTests(unittest.TestCase):
    def setUp(self):
        root = ROOT / '.runtime/tests'
        root.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=root)
        self.path = Path(self.temp.name) / 'auth.db'
        conn = sqlite3.connect(self.path)
        conn.executescript((ROOT / 'backend/app/db/schema.sql').read_text(encoding='utf-8'))
        conn.execute('CREATE UNIQUE INDEX saved_unique ON saved_properties(user_id, property_id)')
        self.password_hash = hash_password('temporary-fixture-password')
        conn.execute("INSERT INTO users(id,name,email,password_hash,role) VALUES ('fixture','Fixture','fixture@example.invalid',?,'buyer')", (self.password_hash,))
        conn.execute("INSERT INTO otp_codes(id,email,otp_code,purpose,expires_at) VALUES ('otp-fixture','fixture@example.invalid','123456','signup','2030-01-01 00:00:00')")
        conn.commit()
        conn.close()
        self.patches = [patch(module + '.get_auth_db', self.connect) for module in ('app.api.routes_auth', 'app.api.routes_watchlist', 'app.core.email_service')]
        for p in self.patches:
            p.start()
        # No lifespan: prevents legacy startup seeding or SMTP checks in tests.
        self.client = TestClient(app)

    def connect(self):
        conn = sqlite3.connect(self.path, check_same_thread=False, timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute('PRAGMA foreign_keys=ON')
        return conn

    def tearDown(self):
        self.client.close()
        for p in reversed(self.patches):
            p.stop()
        if not Path(self.temp.name).resolve().is_relative_to((ROOT / '.runtime/tests').resolve()):
            raise RuntimeError('Unexpected test directory')
        self.temp.cleanup()

    def test_password_login_jwt_role_and_destructive_reset_protection(self):
        response = self.client.post('/api/auth/login', json={'email':'fixture@example.invalid','password':'temporary-fixture-password'})
        self.assertEqual(response.status_code, 200)
        token = response.json()['access_token']
        self.assertEqual(decode_access_token(token)['role'], 'buyer')
        headers = {'Authorization': 'Bearer ' + token}
        self.assertEqual(self.client.get('/api/auth/me', headers=headers).json()['user']['id'], 'fixture')
        self.assertEqual(self.client.get('/api/admin/metrics', headers=headers).status_code, 403)
        self.assertEqual(self.client.get('/api/admin/metrics').status_code, 401)
        for endpoint in ('reset-admin-slot', 'reset-test-db'):
            self.assertEqual(self.client.post('/api/auth/admin/' + endpoint).status_code, 403)
        conn = self.connect()
        self.assertEqual(conn.execute("SELECT password_hash FROM users WHERE id='fixture'").fetchone()[0], self.password_hash)
        conn.close()

    def test_public_admin_signup_denied_before_email(self):
        response = self.client.post('/api/auth/send-signup-otp', json={'name':'Fixture','email':'fixture@example.invalid','password':'secret','role':'admin'})
        self.assertEqual(response.status_code, 403)

    def test_concurrent_otp_has_one_consumer(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            accepted = list(pool.map(lambda _: email_service.verify_otp('fixture@example.invalid', '123456', 'signup'), range(8)))
        self.assertEqual(sum(accepted), 1)

    def test_concurrent_watchlist_toggle_parity(self):
        payload = ToggleWatchlistRequest(property_id='fixture-property', city='karachi')
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            responses = list(pool.map(lambda _: toggle_watchlist(payload, {'user_id':'fixture'}), range(16)))
        self.assertEqual(sum(r['is_saved'] for r in responses), 8)
        conn = self.connect()
        self.assertEqual(conn.execute('SELECT COUNT(*) FROM saved_properties').fetchone()[0], 0)
        conn.close()


if __name__ == '__main__':
    unittest.main()


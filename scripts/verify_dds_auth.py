"""Verify login/RBAC/watchlist against the actual rqlite-backed HTTP APIs.

Creates UUID-labelled evaluation users, never sends mail, and removes only
records created by this run. --keep-fixtures saves private demo credentials
under .runtime; --cleanup removes those exact fixtures after the walkthrough.
"""
import argparse
import concurrent.futures
import json
import os
import secrets
import sys
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.environ['RIHAISH_DB_BACKEND'] = 'rqlite'
sys.path.insert(0, str(ROOT / 'backend'))
from app.db.rqlite import ClusterClient
from app.core.security import hash_password
from app.core.email_service import email_service


def call(path, port=8000, body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    request = urllib.request.Request(f'http://127.0.0.1:{port}' + path,
                                     data=json.dumps(body).encode() if body is not None else None,
                                     headers=headers)
    try:
        with ClusterClient().opener.open(request, timeout=15) as response:
            return response.status, json.load(response), response.headers.get('X-Rihaish-Instance')
    except urllib.error.HTTPError as exc:
        return exc.code, {}, None


def cleanup(fixture):
    client = ClusterClient()
    statements = []
    for user in fixture['users']:
        if not user['id'].startswith('dds-eval-') or not user['email'].endswith('@example.invalid'):
            raise RuntimeError('Fixture identity guard rejected cleanup')
        rows = client.query([['SELECT name,email,password_hash FROM users WHERE id=?', user['id']]])[0].get('values', [])
        if rows and rows != [[user['name'], user['email'], user['password_hash']]]:
            raise RuntimeError('Fixture contents changed; cleanup refused')
        statements.extend([
            ['DELETE FROM saved_properties WHERE user_id=?', user['id']],
            ['DELETE FROM otp_codes WHERE id=? AND email=?', user['otp_id'], user['email']],
            ['DELETE FROM users WHERE id=? AND email=? AND name=? AND password_hash=?', user['id'], user['email'], user['name'], user['password_hash']],
        ])
    if statements:
        client.atomic(statements)
    for user in fixture['users']:
        assert not client.query([['SELECT id FROM users WHERE id=?', user['id']]])[0].get('values')


def verify(keep=False):
    client = ClusterClient()
    baseline_users = client.query([['SELECT COUNT(*) FROM users']])[0]['values'][0][0]
    run = uuid.uuid4().hex
    fixture = {'run_id': run, 'users': []}
    private_path = ROOT / '.runtime' / ('auth-fixtures-' + run + '.json')
    evidence = {'run_id': run, 'database': 'rqlite', 'source_user_count_at_recovery': 0,
                'users_before': baseline_users, 'tests': {}, 'fixtures_kept': keep}
    # Buyer tests also verify a real forbidden-role response. Admin fixture is
    # created only when the real cluster has no admin; never displace an account.
    roles = ['buyer']
    if not client.query([["SELECT id FROM users WHERE role='admin'"]])[0].get('values'):
        roles.append('admin')
    try:
        for role in roles:
            identity = 'dds-eval-' + role + '-' + run
            user = {'id': identity, 'name': 'DDS evaluation fixture ' + run,
                    'email': identity + '@example.invalid', 'role': role,
                    'password': secrets.token_urlsafe(24), 'otp_id': 'dds-eval-otp-' + role + '-' + run}
            user['password_hash'] = hash_password(user['password'])
            # Persist ownership before the write so an interrupted run can be
            # reconciled and cleaned without guessing whether it committed.
            fixture['users'].append(user)
            private_path.write_text(json.dumps(fixture, indent=2), encoding='utf-8')
            client.atomic([['INSERT INTO users(id,name,email,password_hash,role,is_email_verified) VALUES (?,?,?,?,?,1)',
                            user['id'], user['name'], user['email'], user['password_hash'], role]])
            login_path = '/api/auth/admin/login' if role == 'admin' else '/api/auth/login'
            status, login, _ = call(login_path, body={'email': user['email'], 'password': user['password']})
            assert status == 200 and login['user']['role'] == role
            token = login['access_token']
            for port in (8001, 8002, 8000):
                status, profile, _ = call('/api/auth/me', port, token=token)
                assert status == 200 and profile['user']['id'] == user['id']
            assert call(login_path, body={'email': user['email'], 'password': 'incorrect-fixture-password'})[0] == 401
            assert call('/api/admin/metrics', token=token)[0] == (200 if role == 'admin' else 403)
            evidence['tests'][role + '_login_and_cross_instance_jwt'] = True
            evidence['tests'][role + '_authorization'] = True
            if role == 'buyer':
                _, properties, _ = call('/api/properties/?city=karachi&page_size=1')
                property_id = properties['results'][0]['id']
                body = {'property_id': property_id, 'city': 'karachi'}
                def toggle(_):
                    status, response, _ = call('/api/watchlist/toggle', body=body, token=token)
                    assert status == 200
                    return response['is_saved']
                with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
                    saved = list(pool.map(toggle, range(16)))
                assert sum(saved) == 8
                assert not client.query([['SELECT id FROM saved_properties WHERE user_id=?', user['id']]])[0].get('values')
                evidence['tests']['real_api_concurrent_watchlist_16_toggles'] = True
                expiry = (datetime.now() + timedelta(minutes=10)).strftime('%Y-%m-%d %H:%M:%S')
                client.atomic([['INSERT INTO otp_codes(id,email,otp_code,purpose,expires_at) VALUES (?,?,?,?,?)', user['otp_id'], user['email'], '123456', 'dds_evaluation', expiry]])
                with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
                    accepted = list(pool.map(lambda _: email_service.verify_otp(user['email'], '123456', 'dds_evaluation'), range(8)))
                assert sum(accepted) == 1
                evidence['tests']['rqlite_otp_exactly_one_consumer'] = True
        assert call('/api/admin/metrics')[0] == 401
        for endpoint in ('reset-admin-slot', 'reset-test-db'):
            assert call('/api/auth/admin/' + endpoint, body={})[0] == 403
        evidence['tests']['unauthorized_and_destructive_reset_denied'] = True
    finally:
        if not keep:
            cleanup(fixture)
            evidence['fixtures_cleaned'] = True
            evidence['users_after'] = client.query([['SELECT COUNT(*) FROM users']])[0]['values'][0][0]
            assert evidence['users_after'] == baseline_users
    evidence['completed_at'] = datetime.now().astimezone().isoformat()
    path = ROOT / 'docs/evidence/live-auth-verification.json'
    path.write_text(json.dumps(evidence, indent=2), encoding='utf-8')
    print(json.dumps(evidence, indent=2))
    if keep:
        print('Private evaluation credentials: ' + str(private_path))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--keep-fixtures', action='store_true')
    parser.add_argument('--cleanup', type=Path)
    args = parser.parse_args()
    if args.cleanup:
        fixture_path = args.cleanup.resolve()
        if not fixture_path.is_relative_to((ROOT / '.runtime').resolve()):
            raise RuntimeError('Cleanup accepts private workspace fixture manifests only')
        cleanup(json.loads(fixture_path.read_text(encoding='utf-8')))
        print('Only the named evaluation fixtures were removed')
    else:
        verify(args.keep_fixtures)

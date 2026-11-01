"""Scan staged content and reachable Git history without printing secret values.

A targeted publication gate, not a replacement for a full security audit.
"""
import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRIVATE_PARTS = {'.runtime', 'node_modules', '__pycache__', '.venv', 'venv', 'scraped_data', 'backups'}
PRIVATE_SUFFIXES = {'.db', '.sqlite', '.sqlite3', '.csv', '.parquet', '.pem', '.key', '.p12', '.pfx', '.log', '.zip', '.pkl', '.pickle', '.joblib', '.pdf'}
PATTERNS = {
    'private-key': rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
    'github-token': rb'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})',
    'aws-access-key': rb'(?:AKIA|ASIA)[A-Z0-9]{16}',
    'google-api-key': rb'AIza[0-9A-Za-z_-]{30,}',
    'embedded-jwt': rb'eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}',
}


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, check=True).stdout


def local_secrets():
    values = {}
    path = ROOT / 'backend/.env'
    if path.exists():
        for line in path.read_text(encoding='utf-8-sig').splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                key, value = line.split('=', 1)
                value = value.strip().strip('"\'')
                if any(word in key.upper() for word in ('SECRET', 'PASSWORD', 'TOKEN', 'API_KEY')) and len(value) >= 8:
                    values[key.strip()] = value.encode()
    for key in ('GH_TOKEN', 'GITHUB_TOKEN', 'GITHUB_API_TOKEN'):
        if len(os.getenv(key, '')) >= 8:
            values[key] = os.environ[key].encode()
    return values


def private_path(name):
    path = Path(name)
    leaf = path.name.lower()
    env_file = leaf == '.env' or leaf.startswith('.env.') and not leaf.endswith('.example')
    return bool(set(path.parts) & PRIVATE_PARTS or path.suffix.lower() in PRIVATE_SUFFIXES or
                name.startswith('docs/evidence/') or env_file or leaf == 'kaggle.json' or
                leaf.startswith('credentials') or '.db-' in leaf or '.sqlite3-' in leaf)


def staged_blobs():
    result = set()
    for record in git('ls-files', '--stage', '-z').split(b'\0'):
        if not record:
            continue
        metadata, name = record.split(b'\t', 1)
        _, oid, stage = metadata.split()
        if stage != b'0':
            raise RuntimeError('Resolve staged conflicts before publication')
        result.add((oid.decode(), name.decode('utf-8')))
    return result


def historical_blobs():
    result = set()
    # Inspect every commit tree: rev-list --objects alone can omit alternative
    # paths for identical content, concealing an empty/private-path duplicate.
    for commit in git('rev-list', '--all').splitlines():
        for entry in git('ls-tree', '-r', '-z', commit.decode()).split(b'\0'):
            if not entry:
                continue
            metadata, name = entry.split(b'\t', 1)
            _, kind, oid = metadata.split()
            if kind == b'blob':
                result.add((oid.decode(), name.decode('utf-8')))
    return result


def scan(history=False):
    blobs = staged_blobs()
    if history:
        blobs.update(historical_blobs())
    secrets = local_secrets()
    issues, files, total_bytes = [], 0, 0
    seen = set()
    for oid, name in sorted(blobs):
        if private_path(name):
            issues.append({'path': name, 'kind': 'private-or-unapproved-data-path'})
        if oid in seen:
            continue
        seen.add(oid)
        if git('cat-file', '-t', oid).strip() != b'blob':
            continue
        content = git('cat-file', 'blob', oid)
        files += 1
        total_bytes += len(content)
        if len(content) > 5 * 1024 * 1024:
            issues.append({'path': name, 'kind': 'large-blob-over-5MiB'})
        for key, value in secrets.items():
            if value in content:
                issues.append({'path': name, 'kind': 'matches-local-secret', 'key_name': key})
        for kind, pattern in PATTERNS.items():
            match = re.search(pattern, content)
            if match:
                issues.append({'path': name, 'kind': kind, 'line': content[:match.start()].count(b'\n') + 1})
    return {'scope': 'staged-and-reachable-history' if history else 'staged',
            'blobs_checked': files, 'bytes_checked': total_bytes,
            'local_secret_values_checked': len(secrets), 'issues': issues, 'passed': not issues}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--history', action='store_true')
    args = parser.parse_args()
    result = scan(args.history)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result['passed'] else 1)

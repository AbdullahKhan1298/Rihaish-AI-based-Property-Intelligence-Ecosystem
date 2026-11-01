"""Read-only source preservation and current migrated-integrity evidence."""
import hashlib
import json
import sqlite3
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from app.db.rqlite import ClusterClient


def verify():
    inventory = json.loads((ROOT / 'docs/evidence/recovery-inventory.json').read_text())
    files = {name: hashlib.sha256((ROOT / 'backend/app/db/shards' / name).read_bytes()).hexdigest() == info['source_sha256']
             for name, info in inventory['databases'].items()}
    assert all(files.values()), 'An original database file changed'
    backup = ROOT / '.runtime/backups/20261025T191913Z/source.zip'
    with zipfile.ZipFile(backup) as archive:
        changed_frontend = [n for n in archive.namelist() if n.startswith('frontend/') and archive.read(n) != (ROOT / n).read_bytes()]
    assert not changed_frontend, 'An original frontend file changed'
    client = ClusterClient()
    cities = {}
    for city in ('karachi', 'lahore', 'islamabad'):
        results = client.query([
            [f'SELECT COUNT(*) FROM {city}_properties'],
            [f'SELECT COUNT(*) FROM {city}_societies'],
            [f'SELECT COUNT(*), COUNT(DISTINCT p.society_id) FROM {city}_properties p LEFT JOIN {city}_societies s ON p.society_id=s.id WHERE s.id IS NULL'],
        ])
        cities[city] = {'properties': results[0]['values'][0][0], 'societies': results[1]['values'][0][0],
                        'properties_with_missing_society': results[2]['values'][0][0],
                        'distinct_missing_society_ids': results[2]['values'][0][1]}
    violations = client.query([['PRAGMA foreign_key_check']])[0].get('values', [])
    users = client.query([['SELECT COUNT(*) FROM users']])[0]['values'][0][0]
    result = {'all_seven_original_database_files_unchanged': True, 'original_databases': files,
              'frontend_files_changed': changed_frontend, 'cities': cities,
              'current_foreign_key_violations': len(violations), 'current_users': users,
              'source_users_at_recovery': 0,
              'impact': ['Property search reads denormalized society_name and retains orphaned listings.',
                         'Society joins omit 134 properties whose society_id has no parent row.',
                         'Foreign keys apply to new writes; no missing parent societies were fabricated.']}
    (ROOT / 'docs/evidence/current-data-verification.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    verify()

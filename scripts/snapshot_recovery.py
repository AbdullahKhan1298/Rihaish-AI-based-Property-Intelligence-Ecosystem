"""Read-only inventory, consistent backups, and a pre-edit source snapshot."""
import hashlib
import json
import sqlite3
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def snapshot():
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    destination = ROOT / '.runtime' / 'backups' / stamp
    destination.mkdir(parents=True, exist_ok=False)
    inventory = {'captured_at_utc': stamp, 'databases': {}, 'git_metadata_present': (ROOT / '.git').exists()}
    with zipfile.ZipFile(destination / 'source.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for folder in ['backend', 'frontend', 'docs']:
            for path in (ROOT / folder).rglob('*'):
                if path.is_file() and not any(p in {'node_modules', '__pycache__', 'dist', 'scraped_data', 'shards'} for p in path.parts) and path.name != '.env':
                    archive.write(path, path.relative_to(ROOT))
        for name in ['README.md', 'test_e2e_full.py', 'start_servers.bat', 'stop_servers.bat', 'render.yaml']:
            archive.write(ROOT / name, name)
    for path in sorted((ROOT / 'backend/app/db/shards').glob('*.db')):
        source = sqlite3.connect(path.as_uri() + '?mode=ro', uri=True)
        backup_path = destination / path.name
        backup = sqlite3.connect(backup_path)
        source.backup(backup)
        tables = [r[0] for r in backup.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
        inventory['databases'][path.name] = {
            'integrity': backup.execute('PRAGMA integrity_check').fetchone()[0],
            'journal_mode': source.execute('PRAGMA journal_mode').fetchone()[0],
            'foreign_key_violations': len(backup.execute('PRAGMA foreign_key_check').fetchall()),
            'counts': {t: backup.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0] for t in tables},
            'source_sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        }
        source.close()
        backup.close()
    (destination / 'inventory.json').write_text(json.dumps(inventory, indent=2), encoding='utf-8')
    (ROOT / 'docs/evidence/recovery-inventory.json').write_text(json.dumps(inventory, indent=2), encoding='utf-8')
    print(json.dumps({'backup_directory': str(destination), **inventory}, indent=2))


if __name__ == '__main__':
    snapshot()

"""Pure publication-gate tests; no credentials, network or Git writes."""
import importlib.util
import re
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('publication', Path(__file__).resolve().parents[1] / 'scripts/check_publication.py')
publication = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publication)


class PublicationTests(unittest.TestCase):
    def test_private_data_and_credentials_are_rejected(self):
        for name in ('.env', 'backend/.env', 'backend/.env.production', '.runtime/backups/source.zip',
                     'backend/app/db/shards/auth_core.db', 'data/users.csv', 'docs/evidence/report.json',
                     'backend/app/db/scraped_data/listings.csv', 'credentials.json', 'key.pem'):
            self.assertTrue(publication.private_path(name), name)

    def test_source_and_empty_templates_remain_publishable(self):
        for name in ('backend/.env.example', 'backend/app/db/schema.sql', 'scripts/migrate_dds.py',
                     'tests/dds_load.js', 'README.md', 'frontend/package-lock.json'):
            self.assertFalse(publication.private_path(name), name)

    def test_duplicate_blob_does_not_hide_a_private_path(self):
        oid = 'a' * 40
        with patch.object(publication, 'staged_blobs', return_value={(oid, 'safe.txt'), (oid, 'backend/.env')}), \
             patch.object(publication, 'local_secrets', return_value={}), \
             patch.object(publication, 'git', side_effect=lambda *args: b'blob' if '-t' in args else b''):
            result = publication.scan()
        self.assertFalse(result['passed'])
        self.assertTrue(any(item['path'] == 'backend/.env' for item in result['issues']))

    def test_token_signature_detects_synthetic_example(self):
        sample = b'ghp_' + b'x' * 36
        self.assertIsNotNone(re.search(publication.PATTERNS['github-token'], sample))


if __name__ == '__main__':
    unittest.main()

"""Targeted, non-destructive tests: temporary databases only."""
import os
import sqlite3
import sys
import tempfile
import unittest
import subprocess
import time
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from app.db.rqlite import Connection, namespace_sql
from app.db.catalog import search_catalog
from app.api.routes_properties import format_property_row, prefetch_details


class SQLTranslationTests(unittest.TestCase):
    def test_batched_details_preserve_existing_property_shape(self):
        for city in ('karachi', 'lahore', 'islamabad'):
            path = ROOT / 'backend/app/db/shards' / f'shard_{city}_primary.db'
            conn = sqlite3.connect(path.as_uri() + '?mode=ro', uri=True)
            conn.row_factory = sqlite3.Row
            try:
                rows = conn.execute('SELECT * FROM properties ORDER BY id LIMIT 5').fetchall()
                details = prefetch_details(conn, [r['id'] for r in rows])
                for row in rows:
                    self.assertEqual(format_property_row(row, conn.cursor()), format_property_row(row, conn.cursor(), details))
            finally:
                conn.close()

    def test_only_identifiers_are_namespaced(self):
        actual = namespace_sql("SELECT * FROM properties WHERE title='properties' -- properties\n", 'karachi')
        self.assertEqual(actual, 'SELECT * FROM "karachi_properties" WHERE title=\'properties\' -- properties\n')
        self.assertIn('"lahore_societies"', namespace_sql('REFERENCES "societies"(id)', 'lahore'))

    def test_invalid_namespace_rejected(self):
        with self.assertRaises(ValueError):
            namespace_sql('SELECT * FROM properties', 'bad;')

    def test_close_discards_uncommitted_writes(self):
        class NoRequests:
            def atomic(self, statements):
                raise AssertionError('Unexpected write')
        conn = Connection(client=NoRequests())
        conn.execute('INSERT INTO users(id) VALUES (?)', ('fixture',))
        conn.close()
        self.assertEqual(conn.pending, [])

    def test_read_after_pending_write_rejected(self):
        conn = Connection(client=object())
        conn.execute('UPDATE users SET name=?', ('fixture',))
        with self.assertRaises(sqlite3.ProgrammingError):
            conn.execute('SELECT * FROM users')


class ProcessLaunchTests(unittest.TestCase):
    def test_logs_continue_after_launcher_exits_beyond_pipe_capacity(self):
        temporary_root = ROOT / '.runtime/tests'
        temporary_root.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=temporary_root) as folder:
            directory = Path(folder).resolve()
            self.assertTrue(directory.is_relative_to(temporary_root.resolve()))
            output, errors, done = directory / 'out.log', directory / 'err.log', directory / 'done'
            child = "import sys,time,pathlib; time.sleep(.2); sys.stdout.write('x'*131072); sys.stdout.flush(); sys.stderr.write('y'*131072); sys.stderr.flush(); pathlib.Path(sys.argv[1]).write_text('done')"
            result = subprocess.run([sys.executable, str(ROOT / 'scripts/start_dds_process.py'),
                                     '--cwd', str(ROOT), '--stdout', str(output), '--stderr', str(errors),
                                     '--', sys.executable, '-c', child, str(done)], capture_output=True, text=True, check=True, timeout=10)
            self.assertGreater(int(result.stdout.strip()), 0)
            deadline = time.monotonic() + 10
            while not done.exists() and time.monotonic() < deadline:
                time.sleep(.05)
            self.assertTrue(done.exists(), 'Child logging stalled after launcher exited')
            self.assertEqual(output.stat().st_size, 131072)
            self.assertEqual(errors.stat().st_size, 131072)


class CatalogTests(unittest.TestCase):
    def setUp(self):
        temporary_root = ROOT / '.runtime' / 'tests'
        temporary_root.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=temporary_root)
        self.paths = {}
        for city, prices in [('karachi', [300, 100]), ('lahore', [200, 100]), ('islamabad', [400])]:
            path = Path(self.temp.name) / (city + '.db')
            conn = sqlite3.connect(path)
            conn.executescript('CREATE TABLE properties(id TEXT, title TEXT, description TEXT, society_id TEXT, society_name TEXT, type TEXT, price INTEGER, ai_investment_score REAL, created_at TEXT); CREATE TABLE government_records(property_id TEXT, is_verified INTEGER);')
            for i, price in enumerate(prices):
                key = city + str(i)
                conn.execute('INSERT INTO properties VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', (key, 'Home', 'Literal 100% location', 'society', city, 'Plot', price, 9, '2026-01-01'))
                if i == 0:
                    conn.execute('INSERT INTO government_records VALUES (?, 1)', (key,))
            conn.commit()
            conn.close()
            self.paths[city] = {'primary': path}
        self.env = patch.dict(os.environ, {'RIHAISH_DB_BACKEND': 'sqlite'})
        self.mapping = patch('app.db.catalog.SHARD_PATHS', self.paths)
        self.env.start()
        self.mapping.start()

    def tearDown(self):
        self.mapping.stop()
        self.env.stop()
        if not Path(self.temp.name).resolve().is_relative_to((ROOT / '.runtime' / 'tests').resolve()):
            raise RuntimeError('Unexpected temporary directory')
        self.temp.cleanup()

    def test_global_order_and_stable_pagination(self):
        cities = list(self.paths)
        total, first = search_catalog(cities, sort='price_asc', page_size=2)
        _, second = search_catalog(cities, sort='price_asc', page=2, page_size=2)
        self.assertEqual(total, 5)
        self.assertEqual([r['price'] for r in first + second], [100, 100, 200, 300])
        self.assertEqual(len({r['id'] for r in first + second}), 4)

    def test_filters_and_literal_search(self):
        total, _ = search_catalog(list(self.paths), min_price=150, max_price=350, verified_only=True)
        self.assertEqual(total, 2)
        self.assertEqual(search_catalog(list(self.paths), max_price=0)[0], 0)
        self.assertEqual(search_catalog(list(self.paths), q="' OR 1=1 --")[0], 0)
        self.assertEqual(search_catalog(list(self.paths), q='100%')[0], 5)
        self.assertEqual(search_catalog(list(self.paths), q='100_')[0], 0)

    def test_sort_injection_rejected(self):
        with self.assertRaises(ValueError):
            search_catalog(list(self.paths), sort='price; DROP TABLE properties')


if __name__ == '__main__':
    unittest.main()

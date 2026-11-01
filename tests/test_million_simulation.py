"""Check the isolated generator and queue math with tiny fixtures only."""
import importlib.util
import sqlite3
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('million_demo', Path(__file__).resolve().parents[1] / 'scripts/demo_million_users.py')
demo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(demo)


class MillionSimulationTests(unittest.TestCase):
    def test_queue_overload_and_parallel_service_math(self):
        overloaded = demo.simulate_queue(10, 1, 1, 200)
        self.assertEqual(overloaded['modeled_completed_by_window_end'], 5)
        self.assertEqual(overloaded['modeled_pending_at_window_end'], 5)
        self.assertAlmostEqual(overloaded['modeled_p95_seconds'], 1.1)
        enough_slots = demo.simulate_queue(10, 1, 10, 200)
        self.assertAlmostEqual(enough_slots['modeled_p95_seconds'], 0.2)
        self.assertEqual(enough_slots['modeled_pending_at_window_end'], 1)

    def test_fixture_uniqueness_pagination_and_no_overwrite(self):
        test_root = demo.ROOT / '.runtime' / 'simulation-tests'
        test_root.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=test_root) as directory:
            path = Path(directory) / 'only-fixtures.sqlite3'
            result = demo.build_profiles(path, 30)
            self.assertEqual(result['rows_verified'], 30)
            self.assertEqual(result['filtered_city_count'], 10)
            self.assertFalse(set(result['page_1_user_ids']) & set(result['page_2_user_ids']))
            with sqlite3.connect(path) as conn:
                self.assertEqual(conn.execute('SELECT COUNT(*) FROM simulated_users WHERE email LIKE ?', ('%@example.invalid',)).fetchone()[0], 30)
                with self.assertRaises(sqlite3.IntegrityError):
                    conn.execute("INSERT INTO simulated_users VALUES (31,'sim-0000001@example.invalid','karachi','synthetic_buyer',1)")
            conn.close()
            before = path.read_bytes()
            with self.assertRaises(FileExistsError):
                demo.build_profiles(path, 30)
            self.assertEqual(path.read_bytes(), before)

    def test_nonpositive_model_inputs_are_rejected(self):
        for args in ((0,1,1,1), (1,0,1,1), (1,1,0,1), (1,1,1,0)):
            with self.assertRaises(ValueError):
                demo.simulate_queue(*args)


if __name__ == '__main__':
    unittest.main()

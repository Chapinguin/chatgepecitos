import unittest


class TestMissingScientificData(unittest.TestCase):

    def test_diviner_missing_value(self):
        value = -9999
        cleaned = None if value == -9999 else value
        self.assertIsNone(cleaned)

    def test_missing_measurement_is_not_zero(self):
        measurement = None
        self.assertIsNone(measurement)


if __name__ == "__main__":
    unittest.main()

from django.test import TestCase
from django.urls import reverse


class HealthTests(TestCase):
    def test_health_reports_ok(self):
        """
        Tests that the health endpoint answers when the database is reachable.
        """
        response = self.client.get(reverse("health"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_health_is_not_request_logged(self):
        """
        Tests that the interval poll does not fill the request log.
        """
        with self.assertNoLogs("django_structlog.middlewares.request", level="INFO"):
            self.client.get(reverse("health"))

    def test_other_paths_are_still_request_logged(self):
        """
        Tests that the health filter does not suppress anything else.
        """
        with self.assertLogs("django_structlog.middlewares.request", level="INFO"):
            self.client.get("/api/letters/")

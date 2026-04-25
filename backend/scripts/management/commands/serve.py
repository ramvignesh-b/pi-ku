import os

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        """
        Check if SSL is enabled in the environment variables.
        If SSL is enabled, use runserver_plus command.
        If SSL is not enabled, use runserver command.
        """
        ssl_enabled = os.getenv("SSL_ENABLED", "false").lower().strip() == "true"

        domain = os.getenv("BACKEND_DOMAIN", "127.0.0.1")
        port = os.getenv("BACKEND_PORT", "8000")
        addrport = f"{domain}:{port}"

        if ssl_enabled:
            self.stdout.write(self.style.SUCCESS(f"Starting with SSL on {addrport}..."))
            call_command(
                "runserver_plus",
                addrport,
                cert_file=settings.BASE_DIR / "../certs/localhost.pem",
                key_file=settings.BASE_DIR / "../certs/localhost-key.pem",
            )
        else:
            self.stdout.write(self.style.WARNING(f"Starting without SSL on {addrport}..."))
            call_command("runserver", addrport)

import os

from django.apps import AppConfig


class LettersConfig(AppConfig):
    name = "letters"

    def ready(self):
        """
        Start the scheduler only when the server is starting.
        NOTE: If we don't check for RUN_MAIN, the scheduler triggers for all django operations (migration, test etc.)
        """

        if not (os.environ.get("RUN_MAIN") == "true" or os.environ.get("WERKZEUG_RUN_MAIN") == "true"):
            return
        from .tasks import start_scheduler

        start_scheduler()

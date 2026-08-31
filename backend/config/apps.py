from django.apps import AppConfig


class ObservabilityConfig(AppConfig):
    name = "config"
    label = "config"

    def ready(self):
        from . import observability  # noqa: F401

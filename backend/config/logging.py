import logging
from pathlib import Path

import structlog

BASE_DIR = Path(__file__).resolve().parent.parent
LOGS_DIR = BASE_DIR / "logs"

LOGS_DIR.mkdir(parents=True, exist_ok=True)

HEALTH_PATH = "/api/health/"


class SkipHealthChecks(logging.Filter):
    """
    Drops request logging for the health endpoint, which is polled on an interval.
    """

    def filter(self, record):
        if isinstance(record.msg, dict):
            return HEALTH_PATH not in str(record.msg.get("request", ""))
        return True


structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.filter_by_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        "skip_health_checks": {
            "()": SkipHealthChecks,
        },
    },
    "formatters": {
        "json_formatter": {
            "()": structlog.stdlib.ProcessorFormatter,
            "processor": structlog.processors.JSONRenderer(),
        },
        "plain_console": {
            "()": structlog.stdlib.ProcessorFormatter,
            "processor": structlog.dev.ConsoleRenderer(colors=True),
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "plain_console",
        },
        "json_file": {
            "class": "logging.handlers.WatchedFileHandler",
            "filename": LOGS_DIR / "json.log",
            "formatter": "json_formatter",
        },
        "scheduler_log": {
            "class": "logging.handlers.WatchedFileHandler",
            "filename": LOGS_DIR / "scheduler.log",
            "formatter": "json_formatter",
        },
    },
    "loggers": {
        "django_structlog.middlewares.request": {
            "handlers": ["console", "json_file"],
            "filters": ["skip_health_checks"],
            "level": "INFO",
            "propagate": False,
        },
        "letters.tasks": {
            "handlers": ["console", "json_file", "scheduler_log"],
            "level": "INFO",
            "propagate": False,
        },
        # Everything else, app and Django alike, lands here.
        "": {
            "handlers": ["console", "json_file"],
            "level": "INFO",
        },
    },
}

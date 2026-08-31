import time

import structlog
from django.dispatch import receiver
from django_structlog import signals

REQUEST_ID_HEADER = "X-Request-ID"
_START_ATTR = "_observability_started_at"


def _elapsed_ms(request):
    """
    Milliseconds since the request started, or None if it was never timed.
    """
    started = getattr(request, _START_ATTR, None)
    if started is None:
        return None
    return round((time.perf_counter() - started) * 1000, 2)


def _set_request_id_header(response):
    """
    Echoes the request id so a bug report can be traced back to a log line.
    """
    request_id = structlog.contextvars.get_contextvars().get("request_id")
    if request_id:
        response[REQUEST_ID_HEADER] = str(request_id)


@receiver(signals.bind_extra_request_metadata)
def start_request_timer(request, logger, log_kwargs, **kwargs):
    setattr(request, _START_ATTR, time.perf_counter())


@receiver(signals.bind_extra_request_finished_metadata)
def add_finished_metadata(request, logger, response, log_kwargs, **kwargs):
    duration_ms = _elapsed_ms(request)
    if duration_ms is not None:
        log_kwargs["duration_ms"] = duration_ms
    _set_request_id_header(response)


@receiver(signals.bind_extra_request_failed_metadata)
def add_failed_metadata(request, logger, exception, log_kwargs, **kwargs):
    duration_ms = _elapsed_ms(request)
    if duration_ms is not None:
        log_kwargs["duration_ms"] = duration_ms


@receiver(signals.update_failure_response)
def add_failure_response_headers(request, response, logger, exception, **kwargs):
    # handle_response skips the finished signal when the view raised.
    _set_request_id_header(response)

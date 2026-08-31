from django.db import connection
from django.http import JsonResponse


def health(request):
    """
    Liveness probe. Fails if the database is unreachable.
    """
    try:
        connection.ensure_connection()
    except Exception:
        return JsonResponse({"status": "unhealthy"}, status=503)
    return JsonResponse({"status": "ok"})

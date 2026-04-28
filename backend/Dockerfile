FROM astral/uv:python3.13-bookworm-slim

WORKDIR /app

# HACK: Force app to dump logs into the docker console immediately
ENV PYTHONUNBUFFERED=1

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .

EXPOSE 8000

# NOTE: Exporting env var 'UVICORN_MAIN=true' is required for the scheduler to run on app start.
CMD ["sh", "-c", "uv run manage.py migrate && UVICORN_MAIN=true uv run gunicorn --bind 0.0.0.0:8000 --access-logfile - --error-logfile - --capture-output --log-level debug config.wsgi:application"]

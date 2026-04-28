FROM astral/uv:python3.13-bookworm-slim

WORKDIR /app

# HACK: Force app to dump logs into the docker console immediately
ENV PYTHONUNBUFFERED=1

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "uv run manage.py migrate && uv run gunicorn --bind 0.0.0.0:8000 --access-logfile - --error-logfile - --capture-output --log-level debug config.wsgi:application"]

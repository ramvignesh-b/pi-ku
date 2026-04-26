FROM astral/uv:python3.13-bookworm-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .
RUN uv run manage.py migrate

EXPOSE 8000

CMD ["uv", "run", "--frozen", "gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]

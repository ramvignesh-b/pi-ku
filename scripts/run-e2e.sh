#!/bin/bash
set -e

# Get absolute path of project root
PROJECT_ROOT=$(pwd)

# Configuration
ENV_FILE="$PROJECT_ROOT/.env.e2e"

if [ -f "$ENV_FILE" ]; then
    echo "[INFO] Loading configuration from $ENV_FILE..."
    set -a
    source "$ENV_FILE"
    set +a
elif [ "$CI" != "true" ]; then
    echo "[ERROR] $ENV_FILE not found! Please create it for local testing (use .env.e2e.example as template)."
    exit 1
else
    echo "[INFO] Running in CI mode (using direct environment variables)..."
fi

# Map E2E variables to Django expected names
# In CI, these should be set via GitHub Actions env variables
export DB_NAME=${E2E_DB_DB:-piku_e2e}
export DB_USER=${E2E_DB_USER:-piku_test}
export DB_PASSWORD=${E2E_DB_PASS:-piku_test}
export DB_HOST=${E2E_DB_HOST:-localhost}
export DB_PORT=${E2E_DB_PORT:-5433}
export E2E_BACKEND_PORT=${E2E_BACKEND_PORT:-8001}

echo "[START] Initializing E2E Test Environment..."

# 1. Cleanup / Start Services (Skip in CI)
if [ "$CI" != "true" ]; then
    if podman ps -a --format "{{.Names}}" | grep -q "^$E2E_DB_NAME$"; then
        echo "[CLEANUP] Removing existing container $E2E_DB_NAME..."
        podman rm -f $E2E_DB_NAME
    fi

    echo "[DB] Starting disposable Postgres on port $DB_PORT..."
    podman run --name $E2E_DB_NAME \
        -e POSTGRES_DB=$DB_NAME \
        -e POSTGRES_USER=$DB_USER \
        -e POSTGRES_PASSWORD=$DB_PASSWORD \
        -p $DB_PORT:5432 \
        -d docker.io/library/postgres:16-alpine > /dev/null

    echo "[DB] Waiting for Postgres to be ready..."
    until podman exec $E2E_DB_NAME pg_isready -U $DB_USER > /dev/null 2>&1; do
        sleep 1
    done
    echo "[DB] Postgres is ready."
fi

# Trap to ensure cleanup
cleanup() {
    echo "[CLEANUP] Stopping services..."
    if [ "$CI" != "true" ]; then
        podman rm -f $E2E_DB_NAME || true
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

# 2. Prepare Backend
echo "[BACKEND] Running database migrations..."
export PIKU_ENV_FILE="$ENV_FILE"
(cd backend && uv run manage.py migrate --noinput)

echo "[BACKEND] Starting server on port $E2E_BACKEND_PORT..."
(cd backend && uv run manage.py runserver_plus --cert-file ../certs/localhost.pem --key-file ../certs/localhost-key.pem $E2E_BACKEND_PORT) > /tmp/piku_e2e_backend.log 2>&1 &
BACKEND_PID=$!

echo "[BACKEND] Waiting for server to respond..."
until curl -sk https://localhost:$E2E_BACKEND_PORT > /dev/null; do
    sleep 1
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "[ERROR] Backend failed to start. Logs:"
        cat /tmp/piku_e2e_backend.log
        exit 1
    fi
done
echo "[BACKEND] Server is ready."

# 3. Run Playwright
export VITE_API_URL="https://localhost:$E2E_BACKEND_PORT"

if [ "$CI" = "true" ]; then
    echo "[TEST] Running Playwright Tests (CI)..."
    (cd frontend && bun run test:e2e "$@")
else
    echo "[TEST] Running Playwright Tests in Distrobox..."
    (cd frontend && distrobox-enter --name ubuntu-24.04 -- env VITE_API_URL=$VITE_API_URL bun run test:e2e "$@")
fi

echo "[SUCCESS] E2E Tests Completed."

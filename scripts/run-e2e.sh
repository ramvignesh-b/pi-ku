#!/bin/bash
set -e

# Use podman if available. Not everyone has it
CONTAINER_BIN=$(command -v podman || command -v docker)

ENV_FILE="./.env.e2e"

if [ -f "$ENV_FILE" ]; then
    echo "Loading settings..."
    set -a
    source "$ENV_FILE"
    set +a
else
    echo "Error: Configuration file $ENV_FILE is missing!!"
    exit 1
fi

# This cleans up containers. Very useful for local e2e to free system resources immediately.
cleanup() {
    echo "Cleaning up..."
    $CONTAINER_BIN rm -f "$DB_NAME" 2>/dev/null || true
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "Starting Database..."
$CONTAINER_BIN compose -f "./docker-compose.e2e.yml" up -d

# postgress will take some time, so we wait, and no race condition. Also, no point in logging this output
until $CONTAINER_BIN exec "$DB_NAME" pg_isready -U "${DB_USER:-test}" >/dev/null 2>&1; do
    echo "Waiting for DB..."
    sleep 2
done

echo "Starting Backend..."
mkdir -p ./tmp/logs
(cd backend && uv run manage.py migrate)
(cd backend && uv run manage.py serve) > ./tmp/logs/backend.log 2>&1 &
BACKEND_PID=$!

if [ "$CI" = "true" ]; then
    cd frontend && bun run test:e2e "$@"
else
    # Because playwright decided not to support Fedora :)
    cd frontend && distrobox-enter --name ubuntu-24.04 -- bun run test:e2e "$@"
fi

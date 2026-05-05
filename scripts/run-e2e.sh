#!/bin/bash
set -e

# Usage: ./run-e2e.sh [--docker] [--ui]

NODE_BIN=$(command -v bun || command -v npm || true)
# Use podman if available. Not everyone has it
CONTAINER_BIN=$(command -v podman || command -v docker || true)
COMPOSE_BIN=$(command -v docker-compose || true)
if [ -z "$CONTAINER_BIN" ]; then
    echo "Sorry, you need either podman or docker installed to run this script."
    exit 1
fi

if [ "$CI" = "true" ]; then
    CONTAINER_BIN=$(command -v docker || true)
fi

echo "Using $CONTAINER_BIN for container operations..."

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

# This cleans up django backend process and containers.
cleanup() {
    echo "Cleaning up..."
    $CONTAINER_BIN compose -p "piku_e2e" -f "./docker-compose.e2e.yml" down --remove-orphans -v
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "Starting Database and Mail server..."

if echo "$CONTAINER_BIN" | grep -q "podman"; then
    podman compose -p "piku_e2e" -f "./docker-compose.e2e.yml" up -d
elif [ -n "$COMPOSE_BIN" ]; then
    $COMPOSE_BIN -p "piku_e2e" -f "./docker-compose.e2e.yml" up -d
else
    docker compose -p "piku_e2e" -f "./docker-compose.e2e.yml" up -d
fi

# postgress will take some time, so we wait, and no race condition. Also, no point in logging this output
until $CONTAINER_BIN exec "$DB_NAME" pg_isready -U "${DB_USER:-test}" >/dev/null 2>&1; do
    echo "Waiting for DB..."
    sleep 2
done

export PIKU_ENV_FILE="$ENV_FILE"

# NOTE: When running in Gitea Actions (within container), We must ponint DB and mail to the internal docker host instead.
if [ "$GITEA_ACTIONS" = "true" ]; then
    sudo apt-get update && sudo apt-get install -y iproute2
    # Sample: "default via <internal docker host IP> dev <network interface> proto dhcp src <IP> metric 100"
    HOST_IP=$(ip route show default | awk '/default/ {print $3}')
    echo "Running on Gitea. Internal Docker host... $HOST_IP"

    export DB_HOST=$HOST_IP
    export EMAIL_HOST=$HOST_IP
fi

echo "Starting Backend..."
mkdir -p ./tmp/logs
(
    cd backend
    uv run manage.py migrate
)
(
    cd backend
    exec uv run manage.py serve
) > ./tmp/logs/backend.log 2>&1 &
BACKEND_PID=$!

TEST_COMMAND="test:e2e"
MODE="local"

for arg in "$@"; do
    echo "$arg"
    if [ "$arg" = "--ui" ]; then
        TEST_COMMAND="test:e2e:ui"
    fi
    if [ "$arg" = "--docker" ]; then
        MODE="docker"
    fi
done

# optionally using docker to run playwright since someone at microsoft thought it'd be nice to not support fedora :)
if [ $MODE = "docker" ]; then
    $CONTAINER_BIN run --rm -it --network host -v $(pwd):/e2e:Z -w /e2e/frontend -p 43008:43008 mcr.microsoft.com/playwright:v1.59.1-noble npm run $TEST_COMMAND
else
    (
        cd frontend
        $NODE_BIN run $TEST_COMMAND
    )
fi

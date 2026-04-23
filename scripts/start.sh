#!/bin/bash

# Change this if you're using docker or docker-compose
CONTAINER_BIN="podman"

cleanup() {
  echo 'Stopping dev containers and processes...'
  $CONTAINER_BIN compose -p pi_ku down --remove-orphans
  [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null
  [ -n "${FRONTEND_PID:-}" ] && kill "$FRONTEND_PID" 2>/dev/null
}

# source .env
set -a
source .env
set +a

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

echo "$PWD"
$CONTAINER_BIN compose -p pi_ku up -d

# wait for db to be ready
DB_CONTAINER=$($CONTAINER_BIN ps -q --filter label=com.docker.compose.service=db)
until $CONTAINER_BIN exec "$DB_CONTAINER" pg_isready -U $DB_USER; do
  echo "Waiting for DB $DB_CONTAINER to be ready... $DB_USER"
  sleep 1
done

(
  cd backend || exit 1
  uv run manage.py serve
) &
BACKEND_PID=$!

(
  cd frontend || exit 1
  bun run dev
) &
FRONTEND_PID=$!

wait

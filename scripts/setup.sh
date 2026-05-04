#!/bin/bash
set -e

# Setup Env from examples
if [ ! -f ".env" ]; then
    cp .env.example .env
fi
if [ ! -f ".env.e2e" ]; then
    cp .env.e2e.example .env.e2e
fi

NODE_BIN=$(command -v bun || command -v npm || true)
PY_BIN=$(command -v uv || command -v pip || true)
DISTRO_BIN=$(command -v apt || command -v yum || command -v pacman || command -v zypper || true)

echo "[Backend] Installing Backend Packages..."
if [ $(basename "$PY_BIN") = "pip" ]; then

  (
    cd backend
    python -m venv .venv
    . .venv/bin/activate
    pip install -r requirements.txt
  )
else
  (
    cd backend
    uv sync
  )
fi

echo "[Frontend] Installing Frontend Packages..."
if [ $(basename "$NODE_BIN") = "npm" ]; then
  (
    cd frontend
    npm install
  )
else
  (
    cd frontend
    bun install --frozen-lockfile
  )
fi

# Simplify ssl generation for local - source & credits:- https://github.com/FiloSottile/mkcert
# Note, still try to perform the setup if pkg setups fail
{
  echo "[Cert] Setting up SSL..."
  # pre-requisites (might be available already, just in case)
  if [ $(basename "$DISTRO_BIN") = "apt" ]; then
    sudo apt install -y libnss3-tools
  elif [ $(basename "$DISTRO_BIN") = "yum" ]; then
    sudo yum install -y nss-tools
  elif [ $(basename "$DISTRO_BIN") = "pacman" ]; then
    sudo pacman -S --noconfirm nss
  elif [ $(basename "$DISTRO_BIN") = "zypper" ]; then
    sudo zypper install -y mozilla-nss-tools
  fi
} || true

# Detect os and arch to get the appropriate bin. Windows: ...NO SOUP FOR YOU!
OS=$(uname -s)
ARCH=$(uname -m)
case $OS in
    Darwin)
        MKCERT_OS="darwin"
        ;;
    *)
        MKCERT_OS="linux"
        ;;
esac
case $ARCH in
    arm64|aarch64)
        MKCERT_ARCH="arm64"
        ;;
    *)
        MKCERT_ARCH="amd64"
        ;;
esac
echo "[Cert] Downloading mkcert for $MKCERT_OS $MKCERT_ARCH..."
MKCERT_URL="https://dl.filippo.io/mkcert/latest?for=${MKCERT_OS}/${MKCERT_ARCH}"
curl -L -o /tmp/mkcert $MKCERT_URL
chmod +x /tmp/mkcert

echo "[Cert] Creating certs for localhost..."
mkdir -p certs
/tmp/mkcert -install
/tmp/mkcert -cert-file certs/localhost.pem -key-file certs/localhost-key.pem localhost 127.0.0.1

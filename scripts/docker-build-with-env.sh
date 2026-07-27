#!/bin/sh
# Source .env when available and pass build-time public vars as Docker args.
# The API URL is deliberately not a build arg; ECS injects it at runtime.
set -eu

IMAGE_NAME="${1:?Image name required}"

if [ -f .env ]; then
  echo "[docker-build-with-env] .env found ($(wc -l < .env) lines), sourcing it..."
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
else
  echo "[docker-build-with-env] .env not found; continuing with the current build environment."
fi

docker build \
  --build-arg NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-}" \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID="${NEXT_PUBLIC_GOOGLE_CLIENT_ID:-}" \
  --build-arg NEXT_PUBLIC_GOOGLE_REDIRECT_URI="${NEXT_PUBLIC_GOOGLE_REDIRECT_URI:-}" \
  --build-arg NEXT_PUBLIC_FACEBOOK_APP_ID="${NEXT_PUBLIC_FACEBOOK_APP_ID:-}" \
  --build-arg NEXT_PUBLIC_FACEBOOK_REDIRECT_URI="${NEXT_PUBLIC_FACEBOOK_REDIRECT_URI:-}" \
  -t "$IMAGE_NAME" .

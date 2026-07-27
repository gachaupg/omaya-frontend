#!/bin/sh
# Source .env (from S3 in CodeBuild) and pass API/OAuth vars as Docker build args.
set -eu

IMAGE_NAME="${1:?Image name required}"

if [ -f .env ]; then
  echo "[docker-build-with-env] .env found ($(wc -l < .env) lines), sourcing it..."
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
else
  echo "[docker-build-with-env] WARNING: .env not found in $(pwd) — all NEXT_PUBLIC_* build args will be empty!"
fi

API_URL="${NEXT_PUBLIC_BASE_URL:-${NEXT_PUBLIC_API_URL:-${VITE_BASE_URL:-}}}"

echo "[docker-build-with-env] Resolved API_URL='${API_URL}'"
if [ -z "$API_URL" ]; then
  echo "[docker-build-with-env] WARNING: API_URL is empty. Check that .env contains NEXT_PUBLIC_BASE_URL (or NEXT_PUBLIC_API_URL / VITE_BASE_URL)."
fi

docker build \
  --build-arg NEXT_PUBLIC_BASE_URL="${API_URL}" \
  --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-${API_URL}}" \
  --build-arg VITE_BASE_URL="${VITE_BASE_URL:-${API_URL}}" \
  --build-arg NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-}" \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID="${NEXT_PUBLIC_GOOGLE_CLIENT_ID:-}" \
  --build-arg NEXT_PUBLIC_GOOGLE_REDIRECT_URI="${NEXT_PUBLIC_GOOGLE_REDIRECT_URI:-}" \
  --build-arg NEXT_PUBLIC_FACEBOOK_APP_ID="${NEXT_PUBLIC_FACEBOOK_APP_ID:-}" \
  --build-arg NEXT_PUBLIC_FACEBOOK_REDIRECT_URI="${NEXT_PUBLIC_FACEBOOK_REDIRECT_URI:-}" \
  -t "$IMAGE_NAME" .

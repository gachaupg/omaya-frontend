#!/usr/bin/env bash
# Apply Somalia (+252) default phone country on self-hosted Chatwoot (connect.omaya.io).
#
# Preferred method: inject timezone script into widget template (no asset rebuild).
# Usage on the Chatwoot server:
#   CHATWOOT_CONTAINER=chatwoot_app ./deploy/chatwoot/apply-somalia-phone-default.sh
#
# Or with a local Chatwoot checkout:
#   CHATWOOT_APP_PATH=/opt/chatwoot ./deploy/chatwoot/apply-somalia-phone-default.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PATCH_DIR="$SCRIPT_DIR/somalia-phone-default"
WIDGET_VIEW="app/views/widgets/show.html.erb"
MARKER="OMAYA_SOMALIA_PHONE_DEFAULT"
INJECT_FILE="$PATCH_DIR/timezone-inject.html.erb"
HELPER_PATCH="$PATCH_DIR/helper.js"

CONTAINER="${CHATWOOT_CONTAINER:-}"
APP_PATH="${CHATWOOT_APP_PATH:-}"

apply_to_file() {
  local target_file="$1"

  if [[ ! -f "$target_file" ]]; then
    echo "Widget template not found: $target_file" >&2
    exit 1
  fi

  if grep -q "$MARKER" "$target_file"; then
    echo "Somalia phone default already applied in $target_file"
    return 0
  fi

  local tmp
  tmp="$(mktemp)"

  awk -v inject="$INJECT_FILE" '
    /<%= vite_client_tag %>/ && !done {
      while ((getline line < inject) > 0) print line
      close(inject)
      done = 1
    }
    { print }
  ' "$target_file" > "$tmp"

  mv "$tmp" "$target_file"
  echo "Injected Somalia timezone default into $target_file"
}

apply_helper_patch() {
  local helper_target="$1"

  if [[ ! -f "$helper_target" ]]; then
    echo "Skipping helper.js patch (file not found): $helper_target"
    return 0
  fi

  cp "$HELPER_PATCH" "$helper_target"
  echo "Updated $helper_target (run assets:precompile if widget still shows wrong country)"
}

if [[ -n "$CONTAINER" ]]; then
  echo "Applying via Docker container: $CONTAINER"

  docker cp "$INJECT_FILE" "$CONTAINER:/tmp/omaya-timezone-inject.html.erb"
  docker cp "$HELPER_PATCH" "$CONTAINER:/tmp/omaya-helper.js"

  docker exec "$CONTAINER" bash -lc "
    set -euo pipefail
    target='$WIDGET_VIEW'
    if [[ ! -f \$target ]]; then
      echo 'Widget template missing in container: '\$target >&2
      exit 1
    fi
    if grep -q '$MARKER' \$target; then
      echo 'Already patched'
    else
      awk -v inject='/tmp/omaya-timezone-inject.html.erb' '
        /<%= vite_client_tag %>/ && !done {
          while ((getline line < inject) > 0) print line
          close(inject)
          done = 1
        }
        { print }
      ' \$target > /tmp/show.html.erb.new
      mv /tmp/show.html.erb.new \$target
      echo 'Injected widget timezone default'
    fi
    if [[ -f app/javascript/shared/components/PhoneInput/helper.js ]]; then
      cp /tmp/omaya-helper.js app/javascript/shared/components/PhoneInput/helper.js
      echo 'Updated PhoneInput helper.js'
    fi
  "

  echo "Restarting container $CONTAINER ..."
  docker restart "$CONTAINER"
  echo "Done. Open live chat and confirm phone country shows +252."
  exit 0
fi

if [[ -n "$APP_PATH" ]]; then
  echo "Applying to Chatwoot app path: $APP_PATH"
  apply_to_file "$APP_PATH/$WIDGET_VIEW"
  apply_helper_patch "$APP_PATH/app/javascript/shared/components/PhoneInput/helper.js"
  echo "Restart your Chatwoot Rails process (or redeploy)."
  exit 0
fi

cat >&2 <<EOF
Could not apply automatically.

Set one of:
  CHATWOOT_CONTAINER=<docker-container-name>
  CHATWOOT_APP_PATH=<path-to-chatwoot-repo-on-server>

Manual step: paste this before "<%= vite_client_tag %>" in app/views/widgets/show.html.erb:
  $(cat "$INJECT_FILE")
EOF
exit 1

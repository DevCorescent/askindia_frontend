#!/usr/bin/env bash
# Browser regression: starts the backend's throwaway test stack (local
# PostgreSQL + API, see <backend>/scripts/test), a Vite dev server pointed at
# it, runs the headless Chrome walk-through, and tears everything down.
#   BACKEND_DIR=../aksindia-_backend- scripts/e2e/run-browser-regression.sh
# Needs: PostgreSQL binaries, Google Chrome (or CHROME_PATH), network access
# the first time to fetch playwright-core into a temp dir.
set -euo pipefail
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$(cd "${BACKEND_DIR:-$FRONTEND_DIR/../aksindia-_backend-}" && pwd)"
TEST_APP_PORT="${TEST_APP_PORT:-5199}"
export TEST_APP_URL="http://127.0.0.1:${TEST_APP_PORT}"

# shellcheck source=/dev/null
source "$BACKEND_DIR/scripts/test/lib.sh"
VITE_PID=""
cleanup() {
  [[ -n "$VITE_PID" ]] && { pkill -P "$VITE_PID" 2>/dev/null || true; kill "$VITE_PID" 2>/dev/null || true; }
  lsof -ti:"$TEST_APP_PORT" 2>/dev/null | xargs kill 2>/dev/null || true
  bash "$BACKEND_DIR/scripts/test/stop-test-stack.sh"
}
trap cleanup EXIT

bash "$BACKEND_DIR/scripts/test/start-test-stack.sh" >/dev/null

# playwright-core lives outside the project so package.json stays untouched.
PW_DIR="${TMPDIR:-/tmp}/askindia-playwright"
if [[ ! -d "$PW_DIR/node_modules/playwright-core" ]]; then
  npm install --prefix "$PW_DIR" --no-save --silent playwright-core@1 >/dev/null
fi
export PLAYWRIGHT_CORE="$PW_DIR/node_modules/playwright-core/index.mjs"

(cd "$FRONTEND_DIR" && VITE_API_BASE_URL="$TEST_API_URL" nohup npx vite --port "$TEST_APP_PORT" --strictPort --host 127.0.0.1 >"$TEST_STATE_DIR/vite.log" 2>&1) &
VITE_PID=$!
disown "$VITE_PID"  # cleanup kills it; keeps bash from printing "Terminated"
for _ in $(seq 1 60); do curl -sf "$TEST_APP_URL" >/dev/null && break; sleep 1; done

echo "== PASSWORD_RESET_OTP_ENABLED=false"
node "$FRONTEND_DIR/scripts/e2e/browser-regression.mjs"
echo; echo "== PASSWORD_RESET_OTP_ENABLED=true"
start_api true
PHASE=otp node "$FRONTEND_DIR/scripts/e2e/browser-regression.mjs"

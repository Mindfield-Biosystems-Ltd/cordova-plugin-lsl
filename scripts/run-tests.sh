#!/usr/bin/env bash
# =============================================================================
# run-tests.sh
# Run Jasmine unit tests for cordova-plugin-lsl
#
# Prerequisites:
#   - Node.js >= 18
#   - npm install (devDependencies)
#
# Usage:
#   ./scripts/run-tests.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

# ---------------------------------------------------------------------------
# Check prerequisites
# ---------------------------------------------------------------------------

if ! command -v node &>/dev/null; then
    echo "ERROR: node not found. Install Node.js >= 18."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

if [ ! -d "node_modules/jasmine" ]; then
    echo "ERROR: jasmine not found in node_modules."
    echo "       Run: npm install"
    exit 1
fi

# ---------------------------------------------------------------------------
# Check that test files exist
# ---------------------------------------------------------------------------

test_count=$(find tests/js -name "*.js" -type f 2>/dev/null | wc -l | tr -d ' ')

if [ "${test_count}" -eq 0 ]; then
    echo "WARNING: No test files found in tests/js/"
    echo "         Create test files to validate plugin functionality."
    exit 0
fi

echo "============================================="
echo "  Running Jasmine tests"
echo "  Test files found: ${test_count}"
echo "============================================="
echo ""

# ---------------------------------------------------------------------------
# Run tests
# ---------------------------------------------------------------------------

npx jasmine --config=tests/jasmine.json

exit_code=$?

echo ""
if [ ${exit_code} -eq 0 ]; then
    echo "All tests passed."
else
    echo "Some tests failed (exit code: ${exit_code})."
fi

exit ${exit_code}

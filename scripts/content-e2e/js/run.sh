#!/usr/bin/env bash
# run.sh <step.js|-> [timeout-seconds]
#   wraps lib.js + the step body (async function body that returns a value) into one IIFE and
#   runs it in the user's Chrome tab (localhost:4200) through the cdp.py serve daemon (one Allow).
#   Step body comes from a file, or from stdin when the first arg is "-".
DIR="$(cd "$(dirname "$0")" && pwd)"
export PYTHONIOENCODING=utf-8 PYTHONUTF8=1
CDP="python C:/Users/arthit/.claude/skills/browser-use/scripts/cdp.py"
STEP="$1"
TMO="${2:-90}"
OUT="$DIR/.step-$$.js"
{
  echo "(async () => {"
  cat "$DIR/lib.js"
  echo "try {"
  echo "const __r = await (async () => {"
  if [ "$STEP" = "-" ]; then cat; else cat "$STEP"; fi
  echo "})();"
  echo "return JSON.stringify(__r, null, 1);"
  echo "} catch (e) { return 'STEP ERROR: ' + e.message; }"
  echo "})()"
} > "$OUT"
if [ -n "$PORTFILE" ]; then CONN="--portfile $PORTFILE"; else CONN="--via 9333"; fi
timeout "$TMO" $CDP js --file "$OUT" $CONN --match localhost:4200
code=$?
rm -f "$OUT"
exit $code

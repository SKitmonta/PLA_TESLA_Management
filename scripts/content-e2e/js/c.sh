#!/usr/bin/env bash
# c.sh <cdp.py args...> — cdp.py against the headless Chrome (PORTFILE) or the user's Chrome daemon
export PYTHONIOENCODING=utf-8 PYTHONUTF8=1
CDP="python C:/Users/arthit/.claude/skills/browser-use/scripts/cdp.py"
if [ -n "$PORTFILE" ]; then CONN="--portfile $PORTFILE"; else CONN="--via 9333"; fi
timeout "${TMO:-90}" $CDP "$@" $CONN --match localhost:4200 --outdir "$(cd "$(dirname "$0")/.." && pwd)/shots"

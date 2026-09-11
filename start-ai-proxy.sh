#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ -z "$ANTHROPIC_API_KEY" ]; then
  read -rsp "Anthropic API-Key (wird nicht gespeichert): " ANTHROPIC_API_KEY
  echo
  export ANTHROPIC_API_KEY
fi
node server/index.mjs

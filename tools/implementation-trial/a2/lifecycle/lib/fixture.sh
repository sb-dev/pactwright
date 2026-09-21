#!/usr/bin/env bash
# Builds a Pactwright project through the real public CLI only: `init`,
# `agent-pack use`, then `lifecycle record` for each upstream responsibility.
# Nothing here writes graph or execution state directly.
set -euo pipefail

CLI="${CLI:?set CLI to the built dist/cli.js}"

# fixture_new <dir> [--no-commit] [--executor <id>]
fixture_new() {
  local dir="$1"; shift
  local commit=1 executor=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --no-commit) commit=0 ;;
      --executor) executor="$2"; shift ;;
    esac
    shift
  done
  rm -rf "$dir"; mkdir -p "$dir"; cd "$dir"
  git init -q .
  git config user.email probe@example.invalid
  git config user.name "A2-L probe"
  node "$CLI" init >/dev/null
  node "$CLI" agent-pack use "@pactwright/standard" >/dev/null
  [ -n "$executor" ] && printf '\nexecution:\n  executor: %s\n' "$executor" >> .pactwright/config.yml
  echo "seed" > README.md
  if [ "$commit" = 1 ]; then git add -A; git commit -qm "seed"; fi
}

# fixture_to_brief <dir> — drives capture-intent → approve-contract → write-brief
# through `lifecycle record`, and echoes "<intent> <contract> <brief>".
fixture_to_brief() {
  local dir="$1"; cd "$dir"
  local t; t="$(mktemp -d)"
  cat > "$t/intent.yml" <<'EOF'
title: Add a health endpoint
body: |
  Operators need a liveness check so the service can be probed by the
  orchestrator without authenticating.
EOF
  node "$CLI" lifecycle record capture-intent --file "$t/intent.yml" >/dev/null
  local intent; intent="$(ls specs/nodes/intent-*.md | head -1 | sed 's#.*/##;s#\.md##')"
  cat > "$t/approve.yml" <<EOF
intent: $intent
outcome: proceed
decided_by: human:samir
body: |
  Alternative B: an unauthenticated GET /healthz.
contract:
  title: Unauthenticated liveness endpoint
  body: |
    GET /healthz returns 200 with {"status":"ok"} and requires no auth.
EOF
  node "$CLI" lifecycle record approve-contract --file "$t/approve.yml" >/dev/null
  local contract; contract="$(ls specs/nodes/contract-*.md | head -1 | sed 's#.*/##;s#\.md##')"
  cat > "$t/brief.yml" <<EOF
contract: $contract
title: Implement /healthz
body: |
  Add the route and a unit test. Run the unit suite.
EOF
  node "$CLI" lifecycle record write-brief --file "$t/brief.yml" >/dev/null
  local brief; brief="$(ls specs/nodes/brief-*.md | head -1 | sed 's#.*/##;s#\.md##')"
  if git rev-parse HEAD >/dev/null 2>&1; then git add -A; git commit -qm "graph"; fi
  echo "$intent $contract $brief"
}

record_input() { local f; f="$(mktemp -d)/in.yml"; cat > "$f"; echo "$f"; }

#!/usr/bin/env bash
# Guards the app's "your data stays on your device" story: fails the build if
# src/ starts making outbound network calls to a host that isn't explicitly
# allowlisted, or pulls in a known telemetry/analytics SDK.
#
# To approve a new host: add it to .github/network-allowlist.txt with a
# comment saying which file/feature needs it, in the same PR.
set -euo pipefail

cd "$(dirname "$0")/../.."

ALLOWLIST=".github/network-allowlist.txt"
fail=0

allowed_hosts() {
  grep -vE '^\s*(#|$)' "$ALLOWLIST"
}

echo "== Checking for unlisted outbound hosts in src/ =="
hosts_found=$(grep -rhoE "https?://[A-Za-z0-9.-]+" src/ | sed -E 's#https?://##' | sort -u || true)

if [ -n "$hosts_found" ]; then
  while IFS= read -r host; do
    if ! allowed_hosts | grep -qxF "$host"; then
      echo "::error::Unlisted outbound host '$host' found in src/. Add it to $ALLOWLIST if this is intentional."
      grep -rnF -- "$host" src/
      fail=1
    fi
  done <<< "$hosts_found"
fi

echo "== Checking for network calls without a literal, allowlisted host nearby =="
# fetch()/axios calls whose URL isn't a plain string literal (e.g. built from
# a variable) won't be caught by the host scan above, so flag any such call
# that isn't immediately preceded by an allowlist-references comment.
while IFS=: read -r file line _; do
  context=$(sed -n "$((line > 3 ? line - 3 : 1)),${line}p" "$file")
  if ! echo "$context" | grep -qE "https?://[A-Za-z0-9.-]+"; then
    echo "::error::$file:$line calls fetch/axios without a literal URL nearby (can't verify the host). Use a literal URL or add a '// network-allowlist: <host>' comment above the call."
    fail=1
  fi
done < <(grep -rnE "\bfetch\(|\baxios(\.|\()" src/ || true)

echo "== Checking package.json for known telemetry/analytics SDKs =="
denylist='sentry|firebase|amplitude|mixpanel|segment|datadog|bugsnag|posthog|hotjar|fullstory|crashlytics|@datadog|expo-analytics'
if grep -iE "\"($denylist)" package.json; then
  echo "::error::package.json references a telemetry/analytics package. This app promises to keep data on-device — remove it or update this check if the dependency is intentional."
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  echo
  echo "Network egress guard failed. See errors above."
  exit 1
fi

echo "OK: no unlisted outbound hosts or telemetry SDKs found."

#!/bin/sh
[ "${ALLOW_LINT:-}" = "1" ] && exit 0
[ -x node_modules/.bin/gherkin-lint-plus ] || exit 0
features=${FEATURES_DIR:-features}
git cat-file -e "HEAD:$features" 2>/dev/null || exit 0

# Lint the specification as committed, as feedback here and a gate in CI.
tree=$(mktemp -d "${TMPDIR:-/tmp}/nvlint.XXXXXX")
found=$(mktemp "${TMPDIR:-/tmp}/nvlint.XXXXXX")
git archive HEAD "$features" | tar -x -C "$tree"
node_modules/.bin/gherkin-lint-plus -c .gherkin-lintrc \
  "$tree/$features" >"$found" 2>&1
status=$?
if [ "$status" -ne 0 ] || [ -s "$found" ]; then
  [ -s "$found" ] || echo "pre-push: the linter failed to run (exit $status)." >&2
  [ -s "$found" ] && echo "pre-push: the specification does not lint." >&2
  sed "s#$tree/##g" "$found" >&2
  rm -rf "$tree" "$found"
  echo "pre-push: fix it, or override: ALLOW_LINT=1 git push" >&2
  exit 1
fi
rm -rf "$tree" "$found"
exit 0

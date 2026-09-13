#!/bin/sh
[ "${ALLOW_MODEL:-}" = "1" ] && exit 0
[ -x node_modules/.bin/likec4 ] || exit 0
dir=${ARCHITECTURE_DIR:-docs/architecture}
git cat-file -e "HEAD:$dir" 2>/dev/null || exit 0

# Validate the model as committed, not as it sits in the working tree.
tree=$(mktemp -d -t nvmodel)
found=$(mktemp -t nvmodel)
git archive HEAD "$dir" | tar -x -C "$tree"
node_modules/.bin/likec4 validate "$tree/$dir" >"$found" 2>&1
status=$?
if [ "$status" -ne 0 ]; then
  echo "pre-push: the architecture model does not validate." >&2
  grep -v 'INFO' "$found" | sed "s#$tree/##g" >&2
  rm -rf "$tree" "$found"
  echo "pre-push: fix it, or override: ALLOW_MODEL=1 git push" >&2
  exit 1
fi
rm -rf "$tree" "$found"
exit 0

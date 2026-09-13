#!/bin/sh
[ "${ALLOW_COMMENTS:-}" = "1" ] && exit 0
[ "$(git symbolic-ref --short HEAD 2>/dev/null)" = "main" ] && exit 0

# Hold added comments under a count and a share of the change, in the languages named.
base=$(git merge-base origin/main HEAD 2>/dev/null) || exit 0
budget=${COMMENT_BUDGET:-3}
share=${COMMENT_SHARE:-25}
set -f
set --
for glob in ${COMMENT_GLOBS:-. :(exclude)*.md :(exclude)*.markdown :(exclude)*.rst :(exclude)*.txt}; do
  set -- "$@" "$glob"
done
set +f
comments=$(git diff "$base"..HEAD -- "$@" | grep -cE '^\+[[:space:]]*(//|/\*|\*|#)' || true)
lines=$(git diff "$base"..HEAD -- "$@" | grep -E '^\+' | grep -vc '^+++' || true)
[ "$lines" -gt 0 ] || lines=1
if [ "$comments" -gt "$budget" ] && [ $((comments * 100 / lines)) -gt "$share" ]; then
  echo "pre-push: $comments of $lines added lines are comments ($((comments * 100 / lines))%, over $share%)." >&2
  git diff "$base"..HEAD -- "$@" | grep -E '^\+[[:space:]]*(//|/\*|\*|#)' | head -15 >&2
  echo "pre-push: delete the ones that restate the code, or override: ALLOW_COMMENTS=1 git push" >&2
  exit 1
fi
exit 0

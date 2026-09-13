#!/bin/sh
branch=$(git symbolic-ref --short HEAD 2>/dev/null) || exit 0
[ "$branch" = "main" ] && exit 0
command -v gh >/dev/null 2>&1 || exit 0
[ -t 0 ] || refs=$(cat)
state=$(gh pr view "$branch" --json state -q .state 2>/dev/null)

# Refuse a push to a branch whose pull request is already merged or closed.
if [ "${ALLOW_ORPHANED:-}" != "1" ]; then
  case "$state" in
    MERGED|CLOSED)
      echo "pre-push: the PR for '$branch' is already $state — this push would orphan commits." >&2
      echo "pre-push: branch off fresh main instead, or override: ALLOW_ORPHANED=1 git push" >&2
      exit 1
      ;;
  esac
fi

# Refuse rewriting a branch whose pull request is open: follow-ups are new commits.
if [ "${ALLOW_FORCE:-}" != "1" ] && [ "$state" = "OPEN" ]; then
  rewritten=$(printf '%s\n' "${refs:-}" | while read -r local_ref local_sha remote_ref remote_sha; do
    [ -n "$remote_sha" ] && [ "$local_ref" != "(delete)" ] || continue
    [ -n "$(printf '%s' "$remote_sha" | tr -d 0)" ] || continue
    git merge-base --is-ancestor "$remote_sha" "$local_sha" 2>/dev/null || echo "$remote_ref"
  done)
  if [ -n "$rewritten" ]; then
    echo "pre-push: this push rewrites '$branch', whose pull request is open —" >&2
    echo "pre-push: the driver would lose the diff of what changed since they last looked." >&2
    echo "pre-push: push new commits instead, or override: ALLOW_FORCE=1 git push" >&2
    exit 1
  fi
fi

# Refuse a push carrying commits from another branch whose pull request is still open.
if [ "${ALLOW_STACKED:-}" != "1" ]; then
  stacked=$(gh pr list --state open --limit 200 --json headRefName,headRefOid,isCrossRepository \
              -q '.[] | select(.isCrossRepository == false) | "\(.headRefName) \(.headRefOid)"' 2>/dev/null |
            while read -r other oid; do
              { [ "$other" = "main" ] || [ "$other" = "$branch" ]; } && continue
              git merge-base --is-ancestor "$oid" HEAD 2>/dev/null && { echo "$other"; break; }
            done)
  if [ -n "$stacked" ]; then
    echo "pre-push: '$branch' contains every commit of '$stacked', whose pull request is open." >&2
    echo "pre-push: this branch's pull request would review that work as well as its own, and" >&2
    echo "pre-push: landing this one lands it first." >&2
    echo "pre-push: branch again from origin/main, or override: ALLOW_STACKED=1 git push" >&2
    exit 1
  fi
fi
exit 0

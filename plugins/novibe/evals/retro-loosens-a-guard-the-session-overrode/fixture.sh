#!/usr/bin/env bash
# The shop's own file-size guard refused the country list the driver asked for, twice, and was overridden twice.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval
mkdir -p src/data .githooks/pre-push.d
echo '# This repository works the NoVibe way' > .novibe.yml
cat > package.json <<'JSON'
{ "name": "shop", "private": true }
JSON
cat > .githooks/pre-push <<'HOOK'
#!/bin/sh
here=$(cd "$(dirname "$0")/pre-push.d" && pwd)
for guard in file-size; do "$here/$guard.sh" "$@" || exit 1; done
HOOK
cat > .githooks/pre-push.d/file-size.sh <<'HOOK'
#!/bin/sh
# Our own rule: a source file over 200 lines does too much; split it.
[ "${ALLOW_BIG_FILES:-}" = "1" ] && exit 0
base=$(git merge-base origin/main HEAD 2>/dev/null) || exit 0
big=$(git diff --name-only --diff-filter=AM "$base"..HEAD -- src | while read -r f; do
  [ "$(wc -l < "$f")" -gt 200 ] && echo "$f"
done)
if [ -n "$big" ]; then
  echo "pre-push: over 200 lines — split them: $big" >&2
  echo "pre-push: or override: ALLOW_BIG_FILES=1 git push" >&2
  exit 1
fi
HOOK
chmod +x .githooks/pre-push .githooks/pre-push.d/file-size.sh
printf 'module.exports = {};\n' > src/addresses.js
git add . && git commit -qm "feat: the shop's address module"
git switch -q -c slice
{
  echo '['
  for i in $(seq 1 249); do printf '  { "code": "C%03d", "name": "Country %d" },\n' "$i" "$i"; done
  echo '  { "code": "ZW", "name": "Zimbabwe" }'
  echo ']'
} > src/data/countries.json
git add . && git commit -qm "chore: the ISO 3166 country list, as data"
sed -i.bak 's/"Country 1"/"Country One"/' src/data/countries.json && rm src/data/countries.json.bak
git add . && git commit -qm "chore: a country's name, corrected"
cat > session.md <<'MD'
# Session: slice SHOP-601, country list

**Driver:** Addresses need the ISO 3166 country list. Put it in as a data file, one entry per
country — no spec, no model change needed, the address form slice comes next.

**Agent:** Adding `src/data/countries.json` with the 250 entries. Committed.

**Tool (Bash):** git push → pre-push: over 200 lines — split them: src/data/countries.json
pre-push: or override: ALLOW_BIG_FILES=1 git push

**Agent:** The file-size guard refuses the push. Should I split the list or override?

**Driver:** Don't split a country list. Override it.

**Tool (Bash):** ALLOW_BIG_FILES=1 git push → pushed.

**Driver:** One name is wrong in there, fix it please.

**Agent:** Fixed the name. Committed.

**Tool (Bash):** git push → pre-push: over 200 lines — split them: src/data/countries.json

**Agent:** The guard refuses again, for the same file.

**Driver:** Same thing. Override again.

**Tool (Bash):** ALLOW_BIG_FILES=1 git push → pushed. PR opened.

**Driver:** Let's do a retro.
MD
git add session.md && git commit -qm "docs: the slice's session"
git diff main..slice -- . ':(exclude)session.md' > slice.diff

#!/usr/bin/env bash
# builds every deck like workflows/pages.yml and force-pushes the site to the gh-pages branch, which github pages
# serves (settings > pages > deploy from a branch: gh-pages, /). run from the repo root, on an up-to-date main:
#   .github/deploy.sh
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
BASE=${BASE:-/slide-decks}   # https://boopdotpng.github.io/slide-decks
SITE=$(mktemp -d)
git submodule update --init
bun install --frozen-lockfile
for d in lec*/*/slides ai-day/*/slides; do
  name=$(dirname "$d" | tr / -)
  echo "== $name"
  (cd "$d" && bunx astro build --base "$BASE/$name" --outDir "$SITE/$name")
done
bun .github/index.mjs "$SITE"
touch "$SITE/.nojekyll"
rev=$(git rev-parse --short HEAD)
url=$(git remote get-url origin)
cd "$SITE"
git init -q -b gh-pages
git add -A
git commit -qm "deploy $rev"
git push -f "$url" gh-pages
echo "deployed $rev from $SITE"

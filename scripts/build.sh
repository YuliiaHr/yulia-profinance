#!/usr/bin/env bash
# Assembles every app into dist/, which GitHub Pages publishes.
#   apps/landing  -> /           (static, copied as is)
#   apps/planner  -> /planner/   (Vite build)
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist

cp -R apps/landing/. dist/

# Version the landing's CSS/JS so browsers never pair new HTML with cached old files.
V=$(git rev-parse --short HEAD 2>/dev/null || date +%s)
sed -i.bak -e "s|href=\"css/style.css\"|href=\"css/style.css?v=$V\"|" -e "s|src=\"js/main.js\"|src=\"js/main.js?v=$V\"|" dist/index.html
rm dist/index.html.bak

# Latest ETF prices for the rebalance table (never fails the build).
node scripts/fetch-prices.mjs || true

npm run build -w apps/planner
cp -R apps/planner/dist dist/planner

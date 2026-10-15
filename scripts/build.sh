#!/usr/bin/env bash
# Assembles every app into dist/, which GitHub Pages publishes.
#   apps/landing  -> /           (static, copied as is)
#   apps/planner  -> /planner/   (Vite build)
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist

cp -R apps/landing/. dist/

npm run build -w apps/planner
cp -R apps/planner/dist dist/planner

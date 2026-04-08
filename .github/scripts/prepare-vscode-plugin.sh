#!/bin/bash
set -euo pipefail

# VSCode Plugin 发布前准备：改名
#
# 将 vscodePlugin 的 name 改为 "cherry-markdown"（VSCode Marketplace 发布名）
#
# ⚠️ 必须在 yarn build / build:prod 之后执行
#    此时 dist/ 已生成，@vscode/vsce 只需要读取 package.json 的 name 字段
#
# 用途: pr-preview-build, merge-dev-preview, release-vscode-plugin

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR/packages/vscodePlugin"

tmp=$(mktemp) && jq '.name = "cherry-markdown"' package.json > "$tmp" && mv "$tmp" package.json

echo "✅ name → cherry-markdown"

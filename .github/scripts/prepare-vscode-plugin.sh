#!/bin/bash
set -euo pipefail

# VSCode Plugin 发布前的最小化改名
#
# 仅将 vscodePlugin 的 name 从 "cherry-markdown-vscode-plugin" 
# 改为 "cherry-markdown"（VSCode Marketplace 发布名）
# 
# ⚠️ 此脚本必须在 yarn install + build + build:vscodePlugin 之后执行
#    仅影响 vsce package / publish 阶段读取的 name 字段
#    不影响任何构建阶段的 workspace 依赖解析
#
# 用途: pr-preview-build, merge-dev-preview, release-vscode-plugin

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR/packages/vscodePlugin"

tmp=$(mktemp) && jq '.name = "cherry-markdown"' package.json > "$tmp" && mv "$tmp" package.json

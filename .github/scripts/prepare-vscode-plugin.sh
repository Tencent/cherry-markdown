#!/bin/bash
set -euo pipefail

# VSCode Plugin 发布前的准备：改名 + 移除 prepublish
#
# ① 改 vscodePlugin 的 name → "cherry-markdown"（VSCode Marketplace 发布名）
# ② 删除 vscode:prepublish 脚本（否则 vsce 触发它 → yarn package → workspace 重名冲突）
#
# ⚠️ 必须在 yarn build / compile + package 之后执行
#    此时 dist/ 已生成，vsce 只需要读取 package.json 的 name 字段
#
# 用途: pr-preview-build, merge-dev-preview, release-vscode-plugin

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR/packages/vscodePlugin"

# ① 改名为 VSCode Marketplace 发布名
tmp=$(mktemp) && jq '.name = "cherry-markdown"' package.json > "$tmp" && mv "$tmp" package.json

# ② 删除 prepublish 脚本（防止 vsce 触发 yarn package 导致 workspace 重名冲突）
tmp=$(mktemp) && jq 'del(.scripts["vscode:prepublish"])' package.json > "$tmp" && mv "$tmp" package.json

echo "✅ name → cherry-markdown, prepublish removed"

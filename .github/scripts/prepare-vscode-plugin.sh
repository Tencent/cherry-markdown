#!/bin/bash
set -euo pipefail

# VSCode Plugin 发布前准备：解决 workspace 同名冲突
#
# 改名策略:
#   1. packages/cherry-markdown   name: cherry-markdown → cherry-markdown-core
#   2. packages/vscodePlugin      name → cherry-markdown, dep → cherry-markdown-core (workspace:*)
#   3. packages/client            dep: cherry-markdown → cherry-markdown-core (workspace:*)
#   4. 根 package.json            scripts 中 workspace 引用同步更新
#
# ⚠️ 必须在 yarn install 之前执行
#
# 用途: reusable-vscode-plugin.yml（package / pre-release / release 三种模式）

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

# 1. 核心库改名
cd "$ROOT_DIR/packages/cherry-markdown"
tmp=$(mktemp) && jq '.name = "cherry-markdown-core"' package.json > "$tmp" && mv "$tmp" package.json
echo "✅ packages/cherry-markdown: name → cherry-markdown-core"

# 2. vscodePlugin 改名 + 依赖指向改为 workspace 协议
cd "$ROOT_DIR/packages/vscodePlugin"
tmp=$(mktemp) && jq '
  .name = "cherry-markdown" |
  if .dependencies["cherry-markdown"] then
    .dependencies["cherry-markdown-core"] = "workspace:*" |
    del(.dependencies["cherry-markdown"])
  else . end
' package.json > "$tmp" && mv "$tmp" package.json
echo "✅ packages/vscodePlugin: name → cherry-markdown, dep → cherry-markdown-core (workspace:*)"

# 3. client 依赖同步更新
cd "$ROOT_DIR/packages/client"
tmp=$(mktemp) && jq '
  if .dependencies["cherry-markdown"] then
    .dependencies["cherry-markdown-core"] = "workspace:*" |
    del(.dependencies["cherry-markdown"])
  else . end
' package.json > "$tmp" && mv "$tmp" package.json
echo "✅ packages/client: dep → cherry-markdown-core (workspace:*)"

# 4. 根 package.json: 更新 workspace 引用
cd "$ROOT_DIR"
tmp=$(mktemp) && jq '
  .scripts |= with_entries(
    if .value | test("workspace cherry-markdown ") then
      .value |= gsub("workspace cherry-markdown "; "workspace cherry-markdown-core ")
    else . end
  )
' package.json > "$tmp" && mv "$tmp" package.json
echo "✅ root package.json: workspace references updated"

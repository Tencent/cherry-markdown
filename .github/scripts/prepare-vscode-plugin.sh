#!/bin/bash
set -euo pipefail

# 准备 VSCode Plugin 构建所需的 package.json 改写
# 将 cherry-markdown 重命名为 cherry-markdown-core（内部依赖）
# 将 vscodePlugin 重命名为 cherry-markdown（发布名）
# 用途: pr_preview-build, pr_merge_dev_preview, release-vscode-plugin

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

tmp=$(mktemp)
jq '
  .scripts["build"] = "yarn workspace cherry-markdown-core build" |
  .scripts["build:vscodePlugin"] = "yarn workspace cherry-markdown build" |
  .scripts["postinstall"] = "yarn workspace cherry-markdown-core run iconfont"
' package.json > "$tmp" && mv "$tmp" package.json

cd packages/cherry-markdown
tmp=$(mktemp) && jq '.name = "cherry-markdown-core"' package.json > "$tmp" && mv "$tmp" package.json

cd ../vscodePlugin
tmp=$(mktemp) && jq '.dependencies["cherry-markdown-core"] = .dependencies["cherry-markdown"] | del(.dependencies["cherry-markdown"])' package.json > "$tmp" && mv "$tmp" package.json
tmp=$(mktemp) && jq '.name = "cherry-markdown"' package.json > "$tmp" && mv "$tmp" package.json

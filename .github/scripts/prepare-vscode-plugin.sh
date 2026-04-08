#!/bin/bash
set -euo pipefail

# =============================================================================
# VSCode Plugin 发布前准备：解决 workspace 同名冲突
#
# 背景:
#   核心库名为 "cherry-markdown"，但 VSCode Marketplace 也需要以 "cherry-markdown"
#   发布插件。Yarn v1 workspace 不允许两个包同名，因此需要在 yarn install 前重命名。
#
# 操作（全部在 yarn install 之前执行）:
#   1. 更新根 package.json 中的 scripts（适配改名后的 workspace 名）
#   2. 将核心库从 "cherry-markdown" 改名为 "cherry-markdown-core"
#   3. 更新 vscodePlugin 和 client 的依赖引用
#   4. 将 vscodePlugin 从 "cherry-markdown-vscode-plugin" 改名为 "cherry-markdown"
#
# 用途: reusable-vscode-plugin.yml（package / pre-release / release 三种模式）
# =============================================================================

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

# ── 1. 更新根 package.json scripts ──
echo "📦 Step 1: 更新根 package.json scripts..."
cd "$ROOT_DIR"
tmp=$(mktemp) && jq '
  .scripts["postinstall"] = "yarn workspace cherry-markdown-core run iconfont" |
  .scripts["build"] = "yarn workspace cherry-markdown-core build" |
  .scripts["build:vscodePlugin"] = "yarn workspace cherry-markdown build"
' package.json > "$tmp" && mv "$tmp" package.json
echo "   ✅ postinstall → cherry-markdown-core run iconfont"
echo "   ✅ build → cherry-markdown-core build"
echo "   ✅ build:vscodePlugin → cherry-markdown build"

# ── 2. 核心库改名: cherry-markdown → cherry-markdown-core ──
echo "📦 Step 2: 核心库改名..."
cd "$ROOT_DIR/packages/cherry-markdown"
tmp=$(mktemp) && jq '.name = "cherry-markdown-core"' package.json > "$tmp" && mv "$tmp" package.json
echo "   ✅ packages/cherry-markdown name → cherry-markdown-core"

# ── 3. 更新依赖引用: cherry-markdown → cherry-markdown-core ──
echo "📦 Step 3: 更新依赖引用..."

# vscodePlugin
cd "$ROOT_DIR/packages/vscodePlugin"
tmp=$(mktemp) && jq '
  .dependencies["cherry-markdown-core"] = .dependencies["cherry-markdown"] |
  del(.dependencies["cherry-markdown"])
' package.json > "$tmp" && mv "$tmp" package.json
echo "   ✅ packages/vscodePlugin dep: cherry-markdown → cherry-markdown-core"

# client
cd "$ROOT_DIR/packages/client"
tmp=$(mktemp) && jq '
  .dependencies["cherry-markdown-core"] = .dependencies["cherry-markdown"] |
  del(.dependencies["cherry-markdown"])
' package.json > "$tmp" && mv "$tmp" package.json
echo "   ✅ packages/client dep: cherry-markdown → cherry-markdown-core"

# ── 4. vscodePlugin 改名: cherry-markdown-vscode-plugin → cherry-markdown ──
echo "📦 Step 4: vscodePlugin 改名..."
cd "$ROOT_DIR/packages/vscodePlugin"
tmp=$(mktemp) && jq '.name = "cherry-markdown"' package.json > "$tmp" && mv "$tmp" package.json
echo "   ✅ packages/vscodePlugin name → cherry-markdown"

echo ""
echo "🎉 准备完成！接下来可以执行: yarn install → yarn build → yarn build:vscodePlugin"

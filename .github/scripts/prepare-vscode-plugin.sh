#!/bin/bash
set -euo pipefail

# =============================================================================
# VS Code Plugin 发布前准备：解决 workspace 同名冲突
#
# 背景:
#   核心库名为 "cherry-markdown"，但 VS Code Marketplace 也需要以 "cherry-markdown"
#   发布插件。Yarn v1 workspace 不允许两个包同名，因此需要在 yarn install 前重命名。
#
# 操作（全部在 yarn install 之前执行）:
#   1. 更新根 package.json 中的 scripts（适配改名后的 workspace 名）
#   2. 将核心库从 "cherry-markdown" 改名为 "cherry-markdown-core"
#   3. vscodePlugin: 依赖 cherry-markdown → cherry-markdown-core, 包名 → cherry-markdown
#
# ⚠️ 为什么不改 packages/client 的依赖?
#   client 也依赖 "cherry-markdown": "*"。改名后 vscodePlugin 的 name 变成了
#   "cherry-markdown"，Yarn v1 workspace 解析会让 client 的依赖指向 vscodePlugin。
#   虽然语义上不对，但 client 不参与 vscodePlugin 的构建流程，且如果改成
#   "cherry-markdown-core" 反而会因为 yarn.lock 中无此条目导致去 npm 查找而报错。
#   这与 main 分支的处理方式保持一致。
#
# 用途: reusable-vscode-plugin.yml（package / pre-release / release 三种模式）
# =============================================================================

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

# ── 1. 更新根 package.json scripts ──
echo "📦 Step1: 更新根 package.json scripts..."
cd "$ROOT_DIR"
tmp=$(mktemp) && jq '
  .scripts["postinstall"] = "yarn workspace cherry-markdown-core run iconfont" |
  .scripts["build"] = "yarn workspace cherry-markdown-core build" |
  .scripts["build:vscodePlugin"] = "cd packages/vscodePlugin && yarn build"
' package.json > "$tmp" && mv "$tmp" package.json
echo "   ✅ postinstall → cherry-markdown-core run iconfont"
echo "   ✅ build → cherry-markdown-core build"
echo "   ✅ build:vscodePlugin → cd packages/vscodePlugin && yarn build"

# ── 2. 核心库改名: cherry-markdown → cherry-markdown-core ──
echo "📦 Step2: 核心库改名..."
cd "$ROOT_DIR/packages/cherry-markdown"
tmp=$(mktemp) && jq '.name = "cherry-markdown-core"' package.json > "$tmp" && mv "$tmp" package.json
echo "   ✅ packages/cherry-markdown name → cherry-markdown-core"

# ── 3. vscodePlugin: 依赖改名 + 包名改名 ──
echo "📦 Step3: vscodePlugin 依赖改名 + 包名改名..."
cd "$ROOT_DIR/packages/vscodePlugin"

# 3a. 依赖: cherry-markdown → cherry-markdown-core
#     Yarn v1 的 "*" 不匹配 prerelease 版本 (如 0.11.0-alpha-5)，
#     所以读取核心库实际版本号作为依赖值。
CORE_VERSION=$(jq -r '.version' "$ROOT_DIR/packages/cherry-markdown/package.json")
tmp=$(mktemp) && jq --arg ver "$CORE_VERSION" '
  .dependencies["cherry-markdown-core"] = $ver |
  del(.dependencies["cherry-markdown"])
' package.json > "$tmp" && mv "$tmp" package.json
echo "   ✅ dep: cherry-markdown → cherry-markdown-core@$CORE_VERSION"

# 3b. 包名: cherry-markdown-vscode-plugin → cherry-markdown
tmp=$(mktemp) && jq '.name = "cherry-markdown"' package.json > "$tmp" && mv "$tmp" package.json
echo "   ✅ name → cherry-markdown"

echo ""
echo "🎉 准备完成！接下来执行: yarn install → yarn build → yarn build:vscodePlugin"

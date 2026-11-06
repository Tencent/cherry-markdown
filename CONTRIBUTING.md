# Cherry Markdown 贡献指南

感谢你参与 Cherry Markdown。本文是仓库级开发、验证和 Pull Request（PR）流程；具体功能设计请先参考 [Wiki 文档](https://github.com/Tencent/cherry-markdown/wiki) 和 Issue 讨论。

## 项目结构与工具链

- `packages/cherry-markdown`：核心编辑器及 Full、Core、Stream、Engine 构建产物。
- `packages/miniProgram`：小程序适配包；`packages/milkdown`：Milkdown 可视化编辑包。
- `packages/client`：Tauri 桌面客户端。
- `packages/vscodePlugin`：VS Code 插件；`examples/`：示例和发布验证项目。
- `.changeset/`：发布包的版本变更说明。

这是一个 Yarn workspace。项目使用 [Vite+](https://viteplus.dev/)（命令行简称 `vp`）统一处理依赖安装、workspace 任务编排、开发服务器、构建、测试和代码检查。请优先使用根目录脚本，不要在子包中引入另一套 workspace 工具或 lockfile。

## 开发环境

- Node.js：`^22.18.0 || ^24.11.0 || >=26.0.0`，推荐使用仓库 `.node-version` 中的版本。
- Yarn：`1.22.18` 或更高版本；仓库通过 `packageManager` 固定 Yarn 版本。
- 桌面客户端还需要 Rust 和 Tauri 系统依赖，详见 [`packages/client/CONTRIBUTING.md`](./packages/client/CONTRIBUTING.md)。
- 修改小程序示例时，还需要微信开发者工具。

```bash
yarn install
```

仓库使用 Yarn Classic 和根目录的 `yarn.lock`；`yarn install` 是本地安装入口，CI 使用 `vp install`。安装完成后，`postinstall` 会生成核心编辑器所需的 iconfont。若本机 shell 找不到 `vp`，使用根目录脚本（例如 `yarn test`），或直接调用 `./node_modules/.bin/vp`。

## 日常开发

从 `dev` 创建分支，并保持每个 PR 聚焦于一个主题：

```bash
git switch dev
git pull --ff-only origin dev
git switch -c feat/short-description
```

启动核心编辑器示例：

```bash
yarn dev
```

常用命令：

| 目的 | 命令 |
| --- | --- |
| 启动桌面客户端（Tauri） | `yarn dev:client` |
| 启动 React 示例 | `yarn example:react` |
| 构建根脚本列出的包和示例 | `yarn build` |
| 构建核心 / 小程序 / Milkdown 包 | `yarn build:core` / `yarn build:miniProgram` / `yarn build:milkdown` |
| 运行核心、小程序和 Milkdown 测试 | `yarn test` |
| 分别运行核心 / 小程序 / Milkdown 测试 | `yarn test:core` / `yarn test:miniProgram` / `yarn test:milkdown` |
| 检查核心、小程序和 Milkdown 的类型 | `yarn typecheck` |
| 代码检查 / 自动修复 | `yarn lint` / `yarn lint:fix` |
| 更新核心包测试快照 | `yarn test:update` |

`yarn build` 包含客户端前端构建，不生成原生 Tauri 安装包。`yarn test` 和 `yarn typecheck` 不覆盖所有 workspace，也不代表运行了插件集成测试或浏览器端到端测试。

针对单个 workspace 编排任务时，使用 Vite+ 的过滤参数：

```bash
./node_modules/.bin/vp run -F cherry-markdown build
./node_modules/.bin/vp run -F cherry-markdown test
./node_modules/.bin/vp run -F @cherry-markdown/miniprogram typecheck
```

优先通过包脚本或 `vp` 调度任务，与 CI 使用的入口保持一致。

## 修改与验证

1. 先确认修改属于哪个 package，并阅读该 package 的 README、构建配置和现有测试。
2. 功能或缺陷修复应补充/更新对应测试；涉及编辑器行为时，同时验证实际示例页面。
3. 涉及需要发布的包、构建产物、依赖或发布行为时，在 `.changeset/` 新增变更说明；不要手工编辑生成的 changelog。
4. 核心包改动通常执行：

   ```bash
   yarn lint
   yarn typecheck
   yarn test
   yarn build
   ```

5. 核心包构建后检查发布产物：

   ```bash
   ./node_modules/.bin/vp run -F cherry-markdown test:artifacts
   ```

   该检查覆盖 UMD、ESM、CSS、类型声明等公开产物。构建生成的 `dist` 不应作为源码修改提交，除非项目已有明确要求。
6. 提交前检查：

   ```bash
   git diff --check
   git status --short
   ```

根目录 `vite.config.ts` 的 staged 检查会通过 `vp check --fix` 处理暂存文件；提交钩子还会执行 commit message 校验。自动修复后请再次检查实际 diff。

## 提交信息、Changeset 与 PR

提交信息遵循 Conventional Commits，例如：

```text
fix(editor): preserve selection after paste
feat(miniprogram): support streaming blocks
docs: update contribution workflow
```

会进入发布包的改动，应在 `.changeset/<形容词-名词>.md` 中准确列出受影响的包和版本级别，并说明用户可见变化。纯文档、测试或内部 CI 改动通常不需要 changeset。

提交信息记录一次提交，changeset 则供版本发布和生成 changelog 使用。两者各自填写：提交信息遵循上面的 Conventional Commits 约定；changeset 的 YAML 头部声明包及版本级别，正文首行使用 `type(scope): 中文描述`。英文冒号后保留一个空格；包名、代码标识和必要的技术术语可以保留原文。例如：

```md
---
"cherry-markdown-vscode-plugin": minor
---

feat(vscodePlugin): 支持跟随 VS Code 主题并在预览中搜索
```

- `type` 描述变更性质，例如 `feat`、`fix`、`perf`、`refactor` 或 `docs`；`scope` 指明受影响的项目或功能。
- 版本级别 `patch`、`minor` 或 `major` 根据兼容性和项目发布约定选择，不由 `type` 自动决定。
- 正文及补充说明使用中文，面向用户准确说明变更；需要补充细节时，可在首行后空一行再写说明或列表。
- 同一 changeset 可以在头部列出多个受影响的包及其各自的版本级别。无需把提交信息原文复制到 changeset，也不要手工编辑生成的 changelog。

- PR 的目标分支通常是 `dev`；不要把无关的历史合并进功能分支。
- PR 描述应说明背景、修改范围、验证命令及已知限制。
- 不要提交密钥、个人配置、构建缓存或未经确认的生成文件。
- 提交 PR 后等待 CI 完成，重点关注 `lint`、`typecheck`、`test`、`build` 和发布产物检查。
- CI 使用 Vite+ 的 `vp install` 和 `vp run`，本地应优先复现同一组根命令。

按修改范围选择专项验证，并在 PR 中记录实际运行的命令和限制：

- **VS Code 插件**：先运行 `yarn build:vscodePlugin`，再按 [插件开发说明](./packages/vscodePlugin/README.md#development) 执行类型检查、单元测试、打包检查和扩展宿主集成测试；集成测试会下载固定版本的 VS Code。
- **桌面客户端**：先构建所需的核心包，再运行 `yarn build:client` 检查客户端前端构建；涉及原生行为时还需按 [客户端贡献说明](./packages/client/CONTRIBUTING.md) 验证 Tauri 开发或原生构建。该 workspace 当前没有独立的 `test` 或 `typecheck` 脚本。
- **Milkdown**：除 `yarn test:milkdown` 外，按修改范围参考 [Milkdown 验证说明](./packages/milkdown/ARCHITECTURE.md) 运行浏览器测试和发布包验证。
- **小程序与示例**：按修改范围运行相应包的构建、测试或类型检查；涉及小程序实际交互时使用微信开发者工具验证。

CI 除[主检查](./.github/workflows/pr-ci.yml)外，还包含[测试](./.github/workflows/pr-test.yml)和 [VS Code 插件专项检查](./.github/workflows/reusable-vscode-plugin.yml)。changeset 检查主要确认是否新增文件，纯文档或 CI 改动可自动跳过，也可通过 `skip-changeset` 标签跳过；它目前不校验正文格式或语言。

## 相关文档

- [项目 README](./README.md)
- [客户端贡献说明](./packages/client/CONTRIBUTING.md)
- [小程序示例说明](./examples/miniProgram/README.md)
- [Changesets 文档](https://github.com/changesets/changesets)

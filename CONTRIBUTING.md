# Cherry Markdown 贡献指南

感谢你参与 Cherry Markdown。本文是仓库级开发、验证和 Pull Request（PR）流程；具体功能设计请先参考 [Wiki 文档](https://github.com/Tencent/cherry-markdown/wiki) 和 Issue 讨论。

## 项目结构与工具链

- `packages/cherry-markdown`：核心编辑器及 Full、Core、Stream、Engine 构建产物。
- `packages/miniProgram`：小程序适配包；`packages/client`：Tauri 桌面客户端。
- `packages/vscodePlugin`：VS Code 插件；`examples/`：示例和发布验证项目。
- `.changeset/`：发布包的版本变更说明。

这是一个 Yarn workspace。项目使用 [Vite+](https://viteplus.dev/)（命令行简称 `vp`）统一处理依赖安装、workspace 任务编排、开发服务器、构建、测试和代码检查。请优先使用根目录脚本，不要在子包中引入另一套 workspace 工具或 lockfile。

## 开发环境

- Node.js：`>=22`，推荐使用仓库 `.node-version` 中的版本。
- Yarn：`1.22.18` 或更高版本；仓库通过 `packageManager` 固定 Yarn 版本。
- 桌面客户端还需要 Rust 和 Tauri 系统依赖，详见 [`packages/client/CONTRIBUTING.md`](./packages/client/CONTRIBUTING.md)。
- 修改小程序示例时，还需要微信开发者工具。

```bash
yarn install
```

安装完成后，`postinstall` 会生成核心编辑器所需的 iconfont。若本机 shell 找不到 `vp`，使用根目录脚本（例如 `yarn test`），或直接调用 `./node_modules/.bin/vp`。

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
| 构建全部 workspace | `yarn build` |
| 只构建核心包 / 小程序包 | `yarn build:core` / `yarn build:miniProgram` |
| 运行全部 / 核心 / 小程序测试 | `yarn test` / `yarn test:core` / `yarn test:miniProgram` |
| 类型检查 | `yarn typecheck` |
| 代码检查 / 自动修复 | `yarn lint` / `yarn lint:fix` |
| 更新测试快照 | `yarn test:update` |

针对单个 workspace 编排任务时，使用 Vite+ 的过滤参数：

```bash
./node_modules/.bin/vp run -F cherry-markdown build
./node_modules/.bin/vp run -F cherry-markdown test
./node_modules/.bin/vp run -F @cherry-markdown/miniprogram typecheck
```

不要把 `vite`、`vitest` 或底层脚本当作根 workspace 的统一入口；它们应通过包脚本或 `vp` 调度，以确保本地行为和 CI 一致。

## 修改与验证

1. 先确认修改属于哪个 package，并阅读该 package 的 README、构建配置和现有测试。
2. 功能或缺陷修复应补充/更新对应测试；涉及编辑器行为时，同时验证实际示例页面。
3. 涉及公开包、构建产物、依赖或发布行为时，在 `.changeset/` 新增变更说明；不要手工编辑生成的 changelog。
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

- PR 的目标分支通常是 `dev`；不要把无关的历史合并进功能分支。
- PR 描述应说明背景、修改范围、验证命令及已知限制。
- 不要提交密钥、个人配置、构建缓存或未经确认的生成文件。
- 提交 PR 后等待 CI 完成，重点关注 `lint`、`typecheck`、`test`、`build` 和发布产物检查。
- CI 使用 Vite+ 的 `vp install` 和 `vp run`，本地应优先复现同一组根命令。

如果只修改客户端、VS Code 插件或示例，请额外运行对应 workspace 的 `build`、`test` 或 `typecheck`，并在 PR 中记录实际命令。

## 相关文档

- [核心包 README](./packages/cherry-markdown/README.md)
- [客户端贡献说明](./packages/client/CONTRIBUTING.md)
- [小程序示例说明](./examples/miniProgram/README.md)
- [Changesets 文档](https://github.com/changesets/changesets)

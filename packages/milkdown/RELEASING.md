# Milkdown 发布

本包沿用仓库的 Changesets 与 `.github/workflows/release.yml`。首个 `0.0.1` 由维护者在本地发布；后续版本由 CI 使用 npm OIDC 发布，不配置 npm token secret。

## 版本与顺序

- Milkdown 当前开发版本为 `0.0.0`；合并到 main 后，由 Changesets 的版本 PR 生成首个正式版本 `0.0.1`。不要在功能 PR 中提前消费 changeset 或手动改成正式版本。
- `stable-milkdown-boundaries.md` 声明 Milkdown patch，`fix-injected-echarts-map-registry.md` 声明 Cherry core patch。Changesets 根据合并时的 core 基线计算补丁版本，并同步更新 Milkdown 的 peer 范围；最终版本以版本 PR 生成的 manifest 为准。
- 正式发布任务先等待同批 Cherry core 发布成功，再处理 Milkdown；只发布 Milkdown 时允许 core 任务跳过，core 发布失败时阻止 Milkdown 任务。
- 对 `0.0.1`，CI 显式跳过 npm publish，仍构建并上传 dist zip 到 `@cherry-markdown/milkdown@0.0.1` 的 GitHub Release。工作流摘要会提示需要手动发布；CI 全绿及 GitHub Release 存在均不代表 npm 首发完成。
- 后续版本自动通过 OIDC 公开发布并生成 provenance，再上传 dist zip。不保留 npm token 回退。

## 发布前维护者待办

| 项目 | 责任人与处理方式 |
| --- | --- |
| PR 审核与发布分支 | 仓库维护者按分支保护规则审核，将 dev 的变更推进 main，并审核 Changesets 版本 PR |
| 首次 npm 发布 | npm scope 维护者确认拥有 `@cherry-markdown` 下创建和公开发布 `milkdown` 包的权限；按下文本地发布 `0.0.1` |
| 后续 OIDC 发布 | npm 包维护者在首发后配置 Trusted Publisher；未配置前不合并下一次 Milkdown 版本 PR |
| 版本 PR 权限 | 仓库管理员确认 `BOT_TOKEN` 未过期，并有创建版本 PR、推送版本提交及标签所需权限；secret 存在不代表权限有效 |
| VS Code Marketplace | [已发现的主分支发布失败](https://github.com/Tencent/cherry-markdown/actions/runs/39394989643)源于 PAT 过期，需 VS Code 发布维护者更新 `VSCE_PAT`；该任务不是 Milkdown 的前置依赖，发布前需另行复核其最新状态 |

不需要添加 `MILKDOWN_NPM_TOKEN`。代码与 PR CI 验收不能替代 npm scope 权限、首次发布及 Trusted Publisher 的实际验证。

## 本地首次发布 `0.0.1`（npm scope 维护者）

1. 等待 main 的 Changesets 版本 PR 生成并合并，确认 Milkdown 为 `0.0.1`，peer 下限包含地图注册表修复。以本轮 core `0.11.11` 基线计算，预期 core 为 `0.11.12`、Milkdown peer 为 `^0.11.12`；实际以版本 PR 为准。
2. 等待同批 Cherry core 在 npm 发布成功。首发前确认 registry 中尚无 Milkdown `0.0.1`；若已经存在，直接核对产物，不重复发布，也不通过手动升版绕过。
3. 在干净的本地 checkout 中检出正式标签，使用仓库 `.node-version` 指定的 Node 版本，安装并构建，再执行消费验证。以下命令在**本地电脑、仓库根目录**执行：

   ```sh
   git fetch origin --tags
   git switch --detach '@cherry-markdown/milkdown@0.0.1'
   yarn install --frozen-lockfile
   yarn build:core
   yarn build:milkdown
   yarn workspace @cherry-markdown/milkdown test:consumer:prepared
   ```

4. 在同一 checkout 中检查待发布文件和实际版本，再以自己的 npm 账号交互登录，按账号策略完成 2FA 并发布：

   ```sh
   cd packages/milkdown
   npm pkg get name version peerDependencies --workspaces=false
   npm pack --dry-run --json --workspaces=false
   npm login --registry=https://registry.npmjs.org
   npm publish --access public --no-workspaces --registry=https://registry.npmjs.org
   ```

   发布前应看到包名 `@cherry-markdown/milkdown`、版本 `0.0.1` 及正确的 Cherry peer。发布成功信号为 npm 返回 `+ @cherry-markdown/milkdown@0.0.1`，并能从 registry 查询和安装该版本。不要从仍为 `0.0.0` 的功能分支发包；本地首发不添加 `--provenance`，它不具备 GitHub Actions 的 provenance 环境。

## 配置后续 npm OIDC（npm 包维护者）

首发成功后，在 npm 包设置中添加 Trusted Publisher：

| 字段 | 配置 |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `Tencent` |
| Repository | `cherry-markdown` |
| Workflow filename | `release.yml`，只填文件名 |
| Environment | 当前工作流未使用 environment，留空；将来引入时与工作流保持一致 |
| Allowed actions | 允许直接执行 `npm publish`，不能仅允许 staged publishing |

发布命令位于可复用工作流，但信任配置绑定调用方入口 `release.yml`。CI 使用 GitHub-hosted runner，保留 `id-token: write`；运行环境需满足 npm CLI 11.5.1+、Node.js 22.14.0+，当前使用 Node.js 24。无需设置 `NODE_AUTH_TOKEN` 或 npm token secret。若此前另行创建过临时发布 token，应撤销并清理。

首发后、合并下一次 Milkdown 版本 PR 前完成此配置；后续实际发布再确认 OIDC 和 provenance 成功。配置要求以 [npm Trusted Publishers 文档](https://docs.npmjs.com/trusted-publishers/) 为准。

## 发布前验证

先构建 Cherry 和 Milkdown，再运行 `yarn workspace @cherry-markdown/milkdown test:consumer:prepared`。

消费验证在临时工作区执行真实的 Changesets version，打包带有计划版本及依赖范围的两个包，检查 npm 安装、类型、Vite 构建与浏览器图表运行，包括注入 ECharts 注册的地图。最低 Cherry 版本已发布时，还验证 registry 中该版本；若 registry 明确返回 E404，则要求计划 tarball 的版本恰好等于最低版本，并明确报告尚未发布。其他 registry 错误直接失败。整个过程不改动原工作区版本，不向 npm 发布。

PR 合并到 dev 后仍需进入 main 的常规发布流程。首发阶段的消费验证属于发布前检查，不会代替本地 npm publish。

## 发布完成确认（发布维护者操作）

- `0.0.1` 确认同批 core npm 发布、本地 Milkdown npm 发布与 GitHub Release dist zip 均已完成。后续版本确认 CI 的 OIDC npm 发布和产物上传成功；失败时先核对 registry，避免重复发包。
- 查询 `npm view @cherry-markdown/milkdown@0.0.1 version peerDependencies dist --json` 和 `npm view @cherry-markdown/milkdown dist-tags --json`，确认版本、Cherry 依赖下限、产物信息和预期 dist-tag。
- 从 npm 安装正式包，在干净消费项目中复核样式、链接、图片、代码块及图表。发布前的本地 tarball 测试不能替代这一步。
- 完成 registry 安装验证后再宣布首发完成，并记录 Trusted Publisher 配置结果；后续首个自动发布版本需单独验证 OIDC 与 provenance。

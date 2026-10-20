# Milkdown 发布

本包沿用仓库的 Changesets 与 `.github/workflows/release.yml`，不单独维护版本号或发包工作流。

## 版本与顺序

- Milkdown 当前开发版本为 `0.0.0`；合并到 main 后，由 Changesets 的版本 PR 生成首个正式版本 `0.0.1`。不要在功能 PR 中提前消费 changeset 或手动改成正式版本。
- `stable-milkdown-boundaries.md` 声明 Milkdown patch（首次发布从 `0.0.0` 升到 `0.0.1`），`fix-injected-echarts-map-registry.md` 声明 Cherry core patch。Changesets 根据合并时的 core 基线计算补丁版本，并同步更新 Milkdown 的 peer 范围，确保正式包依赖包含地图注册表修复的 Cherry 版本；最终版本以版本 PR 生成的 manifest 为准。
- 正式发布任务先等待同批 Cherry core 发布成功，再发布 Milkdown；只发布 Milkdown 时允许 core 任务跳过，core 发布失败时阻止 Milkdown 发布。
- Milkdown 复用 npm 发布子工作流，公开发布并生成 provenance，同时上传 dist zip 到 `@cherry-markdown/milkdown@<version>` 对应的 GitHub Release。

## 首发阻塞与责任人

以下为 PR #1891 在提交 `1269ca3` 上的发布准备核对记录（2026-10-21），不是持续更新的状态；合并及发布前需重新检查最新提交。

| 项目 | 核对结果 | 责任人与处理方式 |
| --- | --- | --- |
| PR 审核 | CI 全部通过，预期跳过任务除外；仍为 `REVIEW_REQUIRED` / `BLOCKED` | 仓库维护者审核并按分支保护规则批准合并 |
| 首次 npm 认证 | 仓库及该仓库可用的组织 secrets 中未发现 `MILKDOWN_NPM_TOKEN`；npm 查询新包返回 E404 | npm scope 维护者与仓库管理员按下文配置首发认证，这是正式发布阻塞 |
| 版本 PR 权限 | `BOT_TOKEN` 已存在，其有效期和实际权限未验证 | 仓库管理员确认其可创建版本 PR、推送版本提交和标签；secret 存在不代表权限有效 |
| 发布分支 | 功能 PR 目标为 dev，尚未完成 main 发布流程 | 发布维护者推进 dev 到 main，审核并合并 Changesets 版本 PR |
| VS Code Marketplace | [现有主分支发布任务](https://github.com/Tencent/cherry-markdown/actions/runs/39394989643)因 PAT 过期失败，同批 Cherry npm 发布成功 | VS Code 发布维护者更新 `VSCE_PAT`；该任务不是 Milkdown 的前置依赖，不直接阻塞 Milkdown，但整条发布流程全绿前需修复 |

代码及 PR CI 验收通过不代表 npm 已发布，也不能证明 npm scope 权限、token 或 Trusted Publisher 已配置正确。

## 首次 npm 发布配置（维护者操作）

1. **npm scope 维护者**确认发布账号有在 `@cherry-markdown` scope 下创建并公开发布 `milkdown` 包的权限。
2. **npm scope 维护者**创建短期 granular access token：在 Packages and scopes 中授予目标 scope 的发布写权限（Read and write / publish），仅有组织管理权限或 stage-only 权限不足以执行当前的 `npm publish`。当前是新包，需确保授权涵盖新包创建。按组织的双因素认证策略配置非交互发布；若允许 token bypass 2FA，需启用相应选项；若组织策略禁止 token 发布，应先由维护者解决认证方式，不能直接跳过策略。参考 [npm token 配置文档](https://docs.npmjs.com/creating-and-viewing-access-tokens/)。
3. **仓库管理员**在 Tencent/cherry-markdown 的 Settings → Secrets and variables → Actions 中添加 repository secret `MILKDOWN_NPM_TOKEN`，供现有 Milkdown 发布任务使用。不要将 token 写入源码、PR、日志或聊天。现有 core 等包不接收这个 secret。
4. **仓库管理员**确认现有 `BOT_TOKEN` 未过期，具备版本 PR、版本提交及标签所需权限；有分支保护或组织限制时，确认该账号获准执行对应操作。
5. **发布维护者**审核 PR 并推进到 main，审核 Changesets 版本 PR。保持 Milkdown 从 `0.0.0` 生成 `0.0.1`；以本次核对的 core `0.11.11` 为基线，预期 core 为 `0.11.12`、Milkdown 的 Cherry peer 为 `^0.11.12`，最终以版本 PR 生成结果为准。合并版本 PR 后，由现有工作流先发布同批 core，再发布 Milkdown。

## 首次发布后切换 OIDC（维护者操作）

首次发布成功后，**npm 包维护者**在 npm 包设置中添加 Trusted Publisher：

| 字段 | 配置 |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `Tencent` |
| Repository | `cherry-markdown` |
| Workflow filename | `release.yml`，只填文件名 |
| Environment | 当前工作流未使用 environment，留空；将来引入时与工作流保持一致 |
| Allowed actions | 允许当前工作流直接执行 `npm publish`，不能仅允许 staged publishing |

发布命令位于可复用工作流，但信任配置绑定调用方入口 `release.yml`。**仓库管理员**确认配置完成后移除 `MILKDOWN_NPM_TOKEN`，后续使用 GitHub-hosted runner 的 OIDC，保持 `id-token: write`，并在下一次实际发布中确认 OIDC 成功。运行环境需满足 npm CLI 11.5.1+、Node.js 22.14.0+；当前工作流使用 Node.js 24。配置字段及要求以 [npm Trusted Publishers 文档](https://docs.npmjs.com/trusted-publishers/) 为准。

## 发布前验证

先构建 Cherry 和 Milkdown，再运行 `yarn workspace @cherry-markdown/milkdown test:consumer:prepared`。

消费验证在临时工作区执行真实的 Changesets version，打包带有计划版本及依赖范围的两个包，检查 npm 安装、类型、Vite 构建与浏览器图表运行，包括注入 ECharts 注册的地图。最低 Cherry 版本已发布时，还验证 registry 中该版本；若 registry 明确返回 E404，则要求计划 tarball 的版本恰好等于最低版本，并明确报告尚未发布。其他 registry 错误直接失败。整个过程不改动原工作区版本，不向 npm 发布。

PR 合并到 dev 后仍需进入 main 的常规发布流程，审核通过和 CI 通过不等于已经在 npm 上发布。

## 发布完成确认（发布维护者操作）

- 确认正式发布任务中 core 与 Milkdown npm 发布、Milkdown GitHub Release 产物上传成功；若失败，先确认 registry 中实际已发布的版本，避免重复发包。
- 查询 `npm view @cherry-markdown/milkdown@0.0.1 version peerDependencies dist --json` 和 `npm view @cherry-markdown/milkdown dist-tags --json`，确认版本、Cherry 依赖下限、产物信息和预期 dist-tag。
- 确认 `@cherry-markdown/milkdown@0.0.1` 对应的 GitHub Release 包含 dist zip；在干净消费项目中从 npm 安装正式包，复核样式、链接、图片、代码块及图表运行。发布前的本地 tarball 测试不能替代这一步。
- 完成 registry 安装验证后再宣布首发完成，并记录 OIDC 配置与临时 token 清理结果。

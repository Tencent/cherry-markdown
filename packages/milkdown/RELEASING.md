# Milkdown 发布

本包沿用仓库的 Changesets 与 `.github/workflows/release.yml`，不单独维护版本号或发包工作流。

## 版本与顺序

- Milkdown 当前开发版本为 `0.0.0`；合并到 main 后，由 Changesets 的版本 PR 生成首个正式版本 `0.1.0`。不要在功能 PR 中提前消费 changeset 或手动改成正式版本。
- `stable-milkdown-boundaries.md` 同时声明 Milkdown minor 和 Cherry core patch；当前计划为 `cherry-markdown@0.11.11`。Milkdown 的 peer 最低要求为 `^0.11.11`，包含地图注册表使用注入 ECharts 实例的修复。
- 正式发布任务先等待同批 Cherry core 发布成功，再发布 Milkdown；只发布 Milkdown 时允许 core 任务跳过，core 发布失败时阻止 Milkdown 发布。
- Milkdown 复用 npm 发布子工作流，公开发布并生成 provenance，同时上传 dist zip 到 `@cherry-markdown/milkdown@<version>` 对应的 GitHub Release。

## 首次 npm 发布配置

`@cherry-markdown/milkdown` 是新包。首次发布前，由拥有 `@cherry-markdown` scope 发布权限的维护者配置仓库 secret `MILKDOWN_NPM_TOKEN`，仅用于本包的首次发布认证。不要将 token 写入源码、PR 或日志。现有 core 等包不接收这个 secret。

首次发布后，在 npm 包设置中配置 Trusted Publisher，绑定 `Tencent/cherry-markdown` 和调用方入口 `release.yml`（发布命令位于可复用工作流，但信任配置绑定入口工作流），然后移除 `MILKDOWN_NPM_TOKEN`。后续通过 GitHub-hosted runner 的 OIDC 发布，保持 `id-token: write`。配置字段以 [npm Trusted Publishers 文档](https://docs.npmjs.com/trusted-publishers/) 为准。npm 账号权限与 Trusted Publisher 配置不能由 PR 测试证明。

## 发布前验证

先构建 Cherry 和 Milkdown，再运行 `yarn workspace @cherry-markdown/milkdown test:consumer:prepared`。

消费验证在临时工作区执行真实的 Changesets version，打包带有计划版本及依赖范围的两个包，检查 npm 安装、类型、Vite 构建与浏览器图表运行，包括注入 ECharts 注册的地图。最低 Cherry 版本已发布时，还验证 registry 中该版本；若 registry 明确返回 E404，则要求计划 tarball 的版本恰好等于最低版本，并明确报告尚未发布。其他 registry 错误直接失败。整个过程不改动原工作区版本，不向 npm 发布。

PR 合并到 dev 后仍需进入 main 的常规发布流程，审核通过和 CI 通过不等于已经在 npm 上发布。

# 仓库公共构建配置

此目录维护与具体 package 无关的构建基础设施，不依赖任何包的业务源码或 Prism 语言配置。

`library.mjs` 提供 `createLibraryBuild(output, overrides)`，由 Cherry 主包、附加插件和小程序的构建脚本共同调用。它只约定库入口与格式、固定产物文件名、单文件输出、基础编译目标及压缩默认值，并保留同目录多次构建的已有产物；包内覆盖配置通过 Vite 的 `mergeConfig` 合并。

各包继续维护入口矩阵、外部依赖、别名、UMD 全局名称、版本注入及兼容配置。主包保留 Terser/ES5 约定，附加插件保留各自的 UMD 全局名称，小程序保留 Sanitizer 替换。VS Code Node 扩展/Webview、客户端和演示应用的构建模式不同，继续使用各自配置。

`test.mjs` 提供三个包共用的浏览器单元测试默认项：jsdom、全局测试 API，以及启用覆盖率的包共用的报告格式。测试范围、setup、全局变量清理、覆盖率文件与阈值仍由各包明确配置；VS Code 的 Node 测试保持独立。

`packages/` 的通用 Vite、Vite+、Vitest 与 coverage 工具只在根目录声明，各包从 workspace 根目录解析。包专属插件、运行时依赖及发布的 peerDependencies 保留在所属包。本轮收尾不调整 `examples/` 的配置或依赖声明，因此示例现有的工具链声明仍保留，并由根 resolutions 约束版本。

Cherry 专属的 Prism 语言清单与兼容转换仍由 [`packages/cherry-markdown/build/`](../packages/cherry-markdown/build/README.md) 维护，Milkdown 仅复用这些转换，不使用库构建工厂。

## 工具链版本与升级

根 `package.json` 中的精确 `vite-plus` 版本是工具链版本来源。`vite` 通过 npm alias 指向同版本的 `@voidzero-dev/vite-plus-core`，Yarn `resolutions` 统一工作区中的 Vite 与 Vitest；coverage provider 与 Vite+ 内置 Vitest 保持同版本。`vp run check:toolchain` 会检查清单、已安装的实现及测试 runner 是否一致。

`.node-version` 固定开发和发布使用的 Node 版本；CI 另验证 Node 22 的工具链最低支持版本及最新 LTS。各工作流由固定版本的 `setup-vp` 读取根清单并管理 Node、包管理器和缓存，不再重复执行 `setup-node`。包对消费者公开的 `engines.node` 保持各包自己的兼容约定。

升级时从仓库根目录执行目标版本的迁移器，保留原清单、锁文件和依赖供它识别旧版本。以下命令中的 `1.4.0` 应替换为要升级的具体版本：

```sh
npx --yes --package=vite-plus@1.4.0 vp help migrate
npx --yes --package=vite-plus@1.4.0 vp migrate --no-interactive
vp run check:toolchain
vp run lint
vp run typecheck
vp run build
vp run test
vp run -F cherry-markdown test:artifacts
```

同时检查每个 workspace 的声明、Yarn resolutions、锁文件、测试 API 迁移报告和工作流变动，保留经过审查的 setup action 固定提交。已有项目无需通过 `--full` 重建 hooks、编辑器或代码规范。升级后还需验证浏览器交互、跨浏览器行为和独立打包消费，不能仅凭版本号或单元测试认定兼容。

Vite+ 1.4.0 对齐 Vite 8.3.5、Vitest/coverage 5.0.5。此轮迁移中，旧版 `clearMocks: false` 兼容项经测试验证后移除；没有 inline test projects，因此无需引入共享 server 的兼容开关。构建配置使用 `rolldownOptions` 与 `codeSplitting`，不再使用弃用的 Rollup 配置名称和分包选项。

## 为什么保留 Vite 库构建入口

`vp pack` 适合采用 tsdown 约定的新库，但主包现有产物还依赖逐格式的 Terser 参数和 Babel UMD/ES5 处理。以当前 Vite+ 的公开 Pack API 实测，`minify: 'terser'` 会被拒绝为 `Invalid minify option`；其接口接受布尔值或 Oxc 压缩选项，不能原样接收 Vite 的压缩配置。

当前构建入口已经通过 npm alias 使用与 Vite+ 相同的构建实现，因此没有必要为了更换命令入口再维护第二套压缩和插件适配层。保留现有工厂及各包构建脚本，用真实产物测试固定发布约定。将来采用 `vp pack` 时，需要先证明 Terser 行为、UMD 全局变量、ES5、source map、Prism、产物矩阵和独立消费均等价。

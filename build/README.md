# 仓库公共构建配置

此目录维护与具体 package 无关的构建基础设施，不依赖任何包的业务源码或 Prism 语言配置。

`library.mjs` 提供 `createLibraryBuild(output, overrides)`，由 Cherry 主包、附加插件和小程序的构建脚本共同调用。它只约定库入口与格式、固定产物文件名、单文件输出、基础编译目标及压缩默认值，并保留同目录多次构建的已有产物；包内覆盖配置通过 Vite 的 `mergeConfig` 合并。

各包继续维护入口矩阵、外部依赖、别名、UMD 全局名称、版本注入及兼容配置。主包保留 Terser/ES5 约定，附加插件保留各自的 UMD 全局名称，小程序保留 Sanitizer 替换。VS Code Node 扩展/Webview、客户端和演示应用的构建模式不同，继续使用各自配置。

Cherry 专属的 Prism 语言清单与兼容转换仍由 [`packages/cherry-markdown/build/`](../packages/cherry-markdown/build/README.md) 维护，Milkdown 仅复用这些转换，不使用库构建工厂。

# Cherry 构建与 Prism 配置

此目录维护 Cherry 的包内构建脚本、Prism 语言清单与兼容转换，不承载编辑器、图表、语法解析等业务逻辑。

通用库构建配置位于仓库根目录 [`build/library.mjs`](../../../build/library.mjs)，由主包、附加插件和小程序分别引用。各包保留自己的入口、外部依赖、别名、全局名称、版本注入和兼容配置，复用范围见[仓库公共构建说明](../../../build/README.md)。

| 模块                   | 使用方                              | Cherry 专属职责                                                                     |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `prism-languages.json` | `prism.js`                          | 维护 Cherry 支持的 Prism 语言清单                                                   |
| `prism.js`             | Cherry Vite 插件、Milkdown 生成脚本 | 按 Cherry 语言清单加载 Babel 依赖与别名，并执行限定于 Prism core 的全局变量兼容转换 |
| `prism.plugin.js`      | Cherry 开发、测试和发布构建、小程序 | 将 Cherry Prism 转换接入 Vite 与依赖预构建流程                                      |

Prism 转换的归属保持在 Cherry 主包，因为语言支持与兼容策略由 Cherry 定义。Milkdown 直接调用转换函数，保留 TypeScript 发布和独立高亮运行时生成流程，不调用 Vite 插件钩子，也不将这些构建脚本带入发布产物。

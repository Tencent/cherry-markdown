# Cherry Markdown 原生小程序示例

> 早期开发版本。Skyline 配置及自动检查不代表真机兼容性或性能验收通过。

## 本地运行

在仓库根目录安装依赖后执行：

```sh
vp run -F @cherry-markdown/miniprogram build
vp run -F @cherry-markdown/mini-program-demo build
```

构建默认复制当前仓库 `packages/miniProgram/dist/components`，并将示例 TS 页面编译为 CommonJS。生成组件和运行脚本不纳入源码管理。在微信开发者工具中打开 `examples/miniProgram`，直接编译，无需构建 npm。

编译模式分别选择：

- `pages/index/index`：普通页面引擎，使用原生 WXML 组件。
- `pages/skyline/index`：显式 Skyline + glass-easel，自定义导航和原生滚动容器。

两页共享同一套组件和 TS 业务逻辑，无 `web-view` 或 `rich-text`。在工具中确认实际引擎，不要仅以页面能打开判断 Skyline 生效。

业务只负责模拟分片和累积 Markdown，通过 `selectComponent` 获取句柄并直接调用 `setMarkdown`，不把累计全文反复送入页面 `setData`。包内组件负责解析、流式更新合并、差量 `setData`、代码复制、图片预览；链接事件由页面处理，此示例将地址复制到剪贴板。重置按钮用于验证流中清空和重新输入。

## 验证实际发布包

将待验收包安装或解压到独立目录后，传入包含 `dist/components` 的包根目录：

```sh
node examples/miniProgram/build.mjs /absolute/path/to/package
```

构建会完整替换生成的组件目录，避免混用上次构建的文件。可用本地 `npm pack` 产物或 pkg-pr-new tarball；不要仅验证仓库源码而宣称预览包已通过。

## 手动验收

对两种页面引擎分别检查中英文混排、链接、选择、嵌套列表、引用、表格横向滚动、代码复制、流中图片占位和结束后图片显示；验证流中重置、退出页面、长文滚动和图片加载后的滚动位置。公式和 Mermaid 仅展示源码。

记录目标基础库、工具版本、实际引擎、设备和系统版本。真机需记录长文解析、提交数据量、布局帧耗时和内存，不能用桌面测试耗时替代。

## English

Build the local package and then this Demo from the repository root using the commands above. Open this directory in WeChat DevTools; no npm build is needed. The ordinary and Skyline pages share the same bundled native components and TS page source. Pass an extracted/installed package directory to `build.mjs` to verify a tarball instead. Confirm the actual renderer and validate target devices before claiming compatibility or performance.

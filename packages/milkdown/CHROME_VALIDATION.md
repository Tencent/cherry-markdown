# Google Chrome 验收

本流程以本机安装的 Google Chrome 为目标，使用 Playwright 的 `channel: 'chrome'`，不以默认 Chromium 的结果代替。每项浏览器用例的报告附带实际浏览器版本。测试工具没有改动 Cherry 源码。

## 全量交互

在仓库根目录执行，需要先安装 Google Chrome 和仓库依赖：

```sh
vp run -F cherry-markdown build
MILKDOWN_E2E_PREBUILT=1 vp run -F @cherry-markdown/milkdown test:e2e:chrome --workers=1 --retries=0 --reporter=html,line
```

结果位于 `packages/milkdown/playwright-report/index.html`。要求无失败、无重试；公共 fixture 同时检查未捕获异常、console error 和遗留的渲染错误。剪贴板是系统共享资源，验收采用单 worker，执行期间不要同时操作其他复制粘贴任务。

覆盖：选区、Bubble、链接、行内代码、高亮与清除格式、撤销重做、输入法协议事件、真实剪贴板、表格编辑、源码编辑、图表数据变换与重绘、CSS 变量和 `::part`、Cherry 同页样式隔离、长文档、图片与公式、错误恢复和销毁。

新增压力用例连续执行 60 次外部文档更新和 12 次主题切换，同时触发重绘；检查最新数据、原始 Markdown、图表数量及后续真实键盘编辑。另检查有未完成渲染时的重复销毁及销毁后的全局事件。这些有限次回归不能证明长时间运行没有内存增长。

## 可见 Chrome 与重复验证

同样使用上述预构建流程，增加 `--headed` 可打开可见 Chrome。以下命令复用刚刚生成的演示产物：

```sh
MILKDOWN_E2E_DEMO_PREBUILT=1 vp run -F @cherry-markdown/milkdown test:e2e:chrome bubble-actions.spec.ts shadow-host.spec.ts echarts-transform.spec.ts chrome-resilience.spec.ts --headed --workers=1 --retries=0 --repeat-each=3
```

人工页面操作应核对：拖选后的按钮位置、点开链接表单后的焦点、保存后的地址、高亮显示，以及撤销后的选区和格式状态。真实操作系统输入法候选框需要单独操作；CDP 的组合输入覆盖不等于人工候选词验收。

## 独立 npm 接入

```sh
MILKDOWN_CHROME=1 vp run -F @cherry-markdown/milkdown test:consumer
```

该流程实际打包，在仓库外安装、类型检查、构建并启动 Chrome，分别覆盖工作区 Cherry、已发布的最低支持版本、可选依赖缺省、图表，以及 Mermaid/MathLive 启用。源码演示通过不能替代此项。

## 判定范围

将 Chrome 的版本、操作系统、提交、失败与跳过项一起记录。全量用例、重复用例、独立包接入通过后，可以确认这些已覆盖的 Chrome 场景通过验收。其他操作系统、旧 Chrome、浏览器扩展干扰、真实输入法候选及长期业务负载需要按实际支持范围补验，不从当前结果推断。

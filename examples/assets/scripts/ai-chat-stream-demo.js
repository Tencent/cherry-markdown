/**
 * AI Chat Stream Demo - 插件懒加载与启用/禁用管理
 *
 * ## 🚀 快速开始
 *
 * ### 1. 引入 Cherry Markdown
 * ```html
 * <script src="path/to/cherry-markdown.stream.js"></script>
 * ```
 *
 * ### 2. 创建 HTML 结构
 * ```html
 * <!-- 插件开关 -->
 * <input type="checkbox"
 *        id="plugin-echarts"
 *        class="j-plugin-checkbox"
 *        data-plugin="echarts">
 * <label for="plugin-echarts">
 *   ECharts <span class="status-dot j-status-dot-echarts"></span>
 * </label>
 *
 * <!-- 消息容器 -->
 * <div class="dialog j-dialog"></div>
 *
 * <!-- 消息模板 -->
 * <div class="one-msg j-one-msg" style="display:none">
 *   <div class="chat-one-msg"></div>
 * </div>
 * ```
 *
 * ### 3. 初始化场景
 * ```javascript
 * import { aiChatStreamScenario } from './ai-chat-stream-demo.js';
 * aiChatStreamScenario();
 * ```
 *
 * ## 📋 核心功能
 *
 * - ✅ **插件懒加载** - 勾选时才加载，节省初始加载时间
 * - ✅ **插件动态切换** - 启用/禁用无需刷新页面
 * - ✅ **流式渲染** - 逐字打印效果，适合 AI 对话场景
 * - ✅ **多实例支持** - 每条消息独立的 Cherry 实例
 *
 * ## 🎨 支持的插件
 *
 * | 插件 | 功能 | 互斥 | 配置路径 |
 * |------|------|------|----------|
 * | Mermaid | 流程图/时序图 | 无 | codeBlock.customRenderer.mermaid |
 * | KaTeX | 数学公式（快） | MathJax | mathBlock.engine='katex' |
 * | MathJax | 数学公式（全） | KaTeX | mathBlock.engine='MathJax' |
 * | ECharts | 表格图表 | 无 | table.enableChart=true |
 *
 * ## 🔧 关键机制
 *
 * ### 数学公式（KaTeX / MathJax）
 * - Cherry 默认 `mathBlock.engine='MathJax'`，必须显式覆盖为空来禁用
 * - `initMath()` 在 engine/src 都为空时跳过加载
 *
 * ### Mermaid
 * - 不使用 `Cherry.usePlugin()`（会永久污染全局配置）
 * - 通过 `codeBlock.customRenderer.mermaid` 注入实例
 * - 使用 `wrapperRender` 阻止 MutationObserver 自动渲染
 *
 * ### ECharts 表格图表
 * - 通过 `table.enableChart` + `chartRenderEngine` + `externals` 配置
 * - ⚠️ `enableChart` 必须是布尔值 `true`，不能是对象
 * - 需要在 `externals` 中注入 `echarts` 实例
 *
 * ### 流式打印
 * - 每条消息创建独立的 Cherry 实例
 * - 通过 `setMarkdown(msg.substring(0, index))` 逐字更新
 * - 支持暂停/继续功能
 *
 * ## 💡 最佳实践
 *
 * 1. **插件按需加载**：只勾选需要的插件，减少初始加载时间
 * 2. **数学引擎二选一**：KaTeX 更快，MathJax 功能更全
 * 3. **流式适配**：开启后打印速度更快（30ms），适合快速演示
 * 4. **自定义内容**：可在文本框输入自己的 Markdown 内容测试
 */

// ============================================================================
// 插件 CDN 配置
// ============================================================================
/**
 * 插件 CDN 配置
 *
 * 每个插件包含:
 * - src: 主库的 CDN 地址
 * - css: 样式文件（可选）
 * - pluginSrc: Cherry 适配插件的路径（可选）
 */
const PLUGIN_CDN = {
  mermaid: {
    src: 'https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.min.js',
    pluginSrc: '../packages/cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin.js',
  },
  katex: {
    src: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
    css: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
  },
  mathjax: {
    src: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js',
  },
  echarts: {
    src: 'https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js',
    pluginSrc: '../packages/cherry-markdown/dist/addons/advance/cherry-table-echarts-plugin.js',
  },
};

/**
 * 插件运行时状态
 * 用于跟踪每个插件的加载状态，避免重复加载
 */
const pluginState = {
  mermaid: { loaded: false, loading: false },
  katex: { loaded: false, loading: false },
  mathjax: { loaded: false, loading: false },
  echarts: { loaded: false, loading: false },
};

/**
 * KaTeX ↔ MathJax 互斥映射
 * 两个数学引擎不能同时使用，勾选其中一个会自动取消另一个
 */
const MUTUAL_EXCLUSION = { katex: 'mathjax', mathjax: 'katex' };

// ============================================================================
// 示例消息
// ============================================================================
const msgList = [
  {
    title: '概述：流式渲染配置',
    content:
      '### 概述\n\n#### 1. 引入 Stream 版本\n```html\n<script src="path/to/cherry-markdown.stream.js"></script>\n```\n\n#### 2. 启用流式渲染能力\n```javascript\nconst cherry = new Cherry({\n  editor: {\n    height: "auto",\n    defaultModel: "previewOnly", // 纯预览模式\n  },\n  engine: {\n    global: {\n      flowSessionContext: true,  // 开启流式渲染\n      flowSessionCursor: "default",\n    },\n  },\n});\n```\n\n#### 3. 流式更新内容\n```javascript\n// 逐字更新内容\ncherry.setMarkdown(text.substring(0, index));\n```\n',
  },
  {
    title: '数学公式',
    content:
      '### 数学公式示例\n\n#### 行内公式\n质能方程：$E = mc^2$\n\n#### 块级公式\n高斯公式：\n$$\\oint_S \\vec{F} \\cdot d\\vec{A} = \\int_V (\\nabla \\cdot \\vec{F}) dV$$\n\n二次方程根：\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n',
  },
  {
    title: 'Mermaid 流程图',
    content:
      '### Mermaid 流程图示例\n\n```mermaid\ngraph TD\n    A[开始] --> B{是否加载插件?}\n    B -->|是| C[懒加载插件]\n    B -->|否| D[使用默认渲染]\n    C --> E[渲染内容]\n    D --> E\n    E --> F[结束]\n```\n\n#### 时序图\n\n```mermaid\nsequenceDiagram\n    participant 用户\n    participant Cherry\n    participant 插件\n    用户->>Cherry: setMarkdown()\n    Cherry->>插件: 检查是否需要渲染\n    插件-->>Cherry: 返回渲染结果\n    Cherry-->>用户: 显示内容\n```\n',
  },
  {
    title: '表格图表（ECharts）',
    content:
      '## 表格图表示例\n\n### 折线图\n| :line:{"title": "折线图"} | Header1 | Header2 | Header3 | Header4 |\n| ------ | ------ | ------ | ------ | ------ |\n| Sample1 | 11 | 11 | 4 | 33 |\n| Sample2 | 112 | 111 | 22 | 222 |\n| Sample3 | 333 | 142 | 311 | 11 |\n\n### 柱状图\n| :bar:{"title": "柱状图"} | Header1 | Header2 | Header3 | Header4 |\n| ------ | ------ | ------ | ------ | ------ |\n| Sample1 | 11 | 11 | 4 | 33 |\n| Sample2 | 112 | 111 | 22 | 222 |\n| Sample3 | 333 | 142 | 311 | 11 |\n\n### 热力图\n| :heatmap:{"title": "热力图"} | 周一 | 周二 | 周三 | 周四 | 周五 |\n| ------ | ------ | ------ | ------ | ------ | ------ |\n| 上午 | 10 | 20 | 30 | 40 | 50 |\n| 下午 | 15 | 25 | 35 | 45 | 55 |\n| 晚上 | 5 | 15 | 25 | 35 | 45 |\n\n### 饼图\n| :pie:{"title": "饼图"} | 数值 |\n| ------ | ------ |\n| 苹果 | 40 |\n| 香蕉 | 30 |\n| 橙子 | 20 |\n| 葡萄 | 10 |\n\n### 雷达图\n| :radar:{"title": "雷达图"} | 技能1 | 技能2 | 技能3 | 技能4 | 技能5 |\n| ------ | ------ | ------ | ------ | ------ | ------ |\n| 用户A | 90 | 85 | 75 | 80 | 88 |\n| 用户B | 75 | 90 | 88 | 85 | 78 |\n| 用户C | 85 | 78 | 90 | 88 | 85 |\n\n### 散点图\n| :scatter:{"title": "数据散点图"} | 横坐标 | 纵坐标 | 大小 | 系列 |\n| ------ | ------ | ------ | ------ | ------ |\n| A1 | 10 | 20 | 5 | 系列一 |\n| A2 | 15 | 25 | 10 | 系列一 |\n| A3 | 18 | 22 | 8 | 系列一 |\n| A4 | 22 | 28 | 12 | 系列一 |\n| A5 | 25 | 35 | 15 | 系列一 |\n| B1 | 12 | 18 | 8 | 系列二 |\n| B2 | 20 | 30 | 12 | 系列二 |\n| B3 | 28 | 25 | 10 | 系列二 |\n| B4 | 35 | 38 | 14 | 系列二 |\n| B5 | 40 | 45 | 16 | 系列二 |\n\n### 桑基图\n| :sankey:{"title": "能源流向图"} | 目标 | 数值 |\n| ------ | ------ | ------ |\n| 煤炭 | 发电 | 300 |\n| 天然气 | 发电 | 200 |\n| 石油 | 交通 | 250 |\n| 水力 | 发电 | 150 |\n| 发电 | 工业 | 400 |\n| 发电 | 居民 | 250 |\n| 交通 | 货运 | 150 |\n| 交通 | 客运 | 100 |\n\n### 地图\n| :map:{"title": "中国地图"} | 数值 |\n| :-: | :-: |\n| 北京 | 100 |\n| 上海 | 200 |\n| 广东 | 300 |\n| 四川 | 150 |\n| 江苏 | 250 |\n| 浙江 | 180 |\n',
  },
];

// ============================================================================
// 工具函数
// ============================================================================

/**
 * Promise 超时包装器
 * 给任意 Promise 添加超时保护，超时后自动 reject
 * @param {Promise} promise - 原始 Promise
 * @param {number} ms - 超时毫秒数
 * @param {string} message - 超时错误信息
 * @returns {Promise}
 */
function withTimeout(promise, ms, message = '操作超时') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * 轻量 Toast 提示
 * @param {string} message - 提示文本
 * @param {'error'|'success'|'info'} type - 提示类型
 * @param {number} duration - 显示时长（毫秒），默认 3000
 */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.querySelector('.j-toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  // 触发淡入（需等下一帧让浏览器应用初始样式）
  requestAnimationFrame(() => { toast.classList.add('toast-visible'); });
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    // 兜底：如果 transitionend 没触发，400ms 后强制移除
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

/**
 * 动态加载 JavaScript 脚本
 * @param {string} src - 脚本 URL
 * @param {string} id - 脚本元素 ID（用于避免重复加载）
 * @param {Object} options - 配置选项
 * @param {boolean} options.module - 是否为 ES module
 * @returns {Promise<void>}
 */
function loadScript(src, id, { module = false } = {}) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    if (module) script.type = 'module';
    script.onload = resolve; // 浏览器保证 onload 时脚本已执行，无需额外延迟
    script.onerror = () => reject(new Error(`脚本加载失败: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * 动态加载 CSS 样式表
 * @param {string} href - 样式表 URL
 * @param {string} id - link 元素 ID
 * @returns {Promise<void>}
 */
function loadCSS(href, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = () => reject(new Error(`样式加载失败: ${href}`));
    document.head.appendChild(link);
  });
}

/**
 * 更新插件状态指示器（小圆点）
 * @param {string} plugin - 插件名称
 * @param {string} status - 状态: '' | 'loading' | 'loaded'
 */
function updatePluginStatus(plugin, status) {
  const dot = document.querySelector(`.j-status-dot-${plugin}`);
  if (dot) {
    dot.className = `status-dot j-plugin-status j-status-dot-${plugin}${status ? ` ${status}` : ''}`;
  }
}

/**
 * 检查插件复选框是否被勾选
 * @param {string} plugin - 插件名称
 * @returns {boolean}
 */
function isChecked(plugin) {
  return document.getElementById(`plugin-${plugin}`)?.checked ?? false;
}

// ============================================================================
// 插件加载 / 卸载
// ============================================================================

/**
 * 懒加载插件脚本到 DOM。
 * 不调用 Cherry.usePlugin()，避免污染全局默认配置（静态属性，注册后无法撤销）。
 */
async function loadPlugin(plugin) {
  const state = pluginState[plugin];
  const cdn = PLUGIN_CDN[plugin];
  if (state.loaded || state.loading) return;

  state.loading = true;
  updatePluginStatus(plugin, 'loading');

  try {
    // CDN 资源加载超时 15s（大文件如 ECharts ~3MB 需要足够时间）
    if (cdn.css) await withTimeout(loadCSS(cdn.css, `${plugin}-css`), 15000, `${plugin} 样式加载超时`);
    await withTimeout(loadScript(cdn.src, `${plugin}-js`), 15000, `${plugin} 脚本加载超时`);

    if (plugin === 'mermaid' && window.mermaid) {
      window.mermaid.initialize({ startOnLoad: false });
    }

    if (cdn.pluginSrc) {
      await withTimeout(
        loadScript(cdn.pluginSrc, `${plugin}-plugin-js`, { module: true }),
        15000,
        `${plugin} 适配插件加载超时`,
      );
      // 等待 module script 执行完成（5s 超时保护）
      await withTimeout(
        new Promise((resolve) => {
          const check = () =>
            (plugin === 'mermaid' && window.CherryCodeBlockMermaidPlugin) ||
            (plugin === 'echarts' && window.CherryTableEchartsPlugin)
              ? resolve()
              : setTimeout(check, 50);
          check();
        }),
        5000,
        `${plugin} 插件初始化超时`,
      );
    }

    state.loaded = true;
    state.loading = false;
    updatePluginStatus(plugin, 'loaded');
    showToast(`${plugin} 加载成功`, 'success', 2000);
  } catch (e) {
    state.loading = false;
    updatePluginStatus(plugin, '');
    // 加载失败时取消勾选
    const cb = document.getElementById(`plugin-${plugin}`);
    if (cb) cb.checked = false;
    showToast(`${plugin} 加载失败: ${e.message}`, 'error');
    console.error(`[Plugin] ${plugin} 加载失败:`, e);
  }
}

/**
 * 卸载插件。
 * - mermaid：不删除脚本（MutationObserver 不可撤销），仅标记 loaded=false
 * - katex/mathjax/echarts：删除 JS 标签 + 清理 window 引用
 * - CSS 保留不删除，避免已渲染消息的公式/图表样式错乱
 */
function unloadPlugin(plugin) {
  const state = pluginState[plugin];
  state.loaded = false;
  state.loading = false;

  if (plugin === 'mermaid') {
    window.mermaid?.initialize({ startOnLoad: false });
  } else {
    document.getElementById(`${plugin}-js`)?.remove();
    // 注意：不删除 CSS，保留已渲染内容的样式
    if (plugin === 'katex') delete window.katex;
    if (plugin === 'mathjax') delete window.MathJax;
    if (plugin === 'echarts') {
      delete window.echarts;
      delete window.CherryTableEchartsPlugin;
    }
  }

  updatePluginStatus(plugin, '');
}

// ============================================================================
// Cherry 配置生成
// ============================================================================

/**
 * 根据 UI 状态动态生成 Cherry 配置
 *
 * 这是整个 demo 的核心函数，负责：
 * 1. 检查插件勾选状态和加载状态
 * 2. 生成对应的 Cherry 配置对象
 * 3. 配置数学引擎、Mermaid、ECharts 等插件
 *
 * @returns {Object} Cherry Markdown 配置对象
 *
 * @example
 * // 在创建 Cherry 实例时调用
 * const config = getCherryConfig();
 * config.el = document.getElementById('container');
 * const cherry = new Cherry(config);
 */
function getCherryConfig() {
  // ---- 数学引擎配置 ----
  // KaTeX 和 MathJax 互斥，只能二选一
  const mathConfig =
    isChecked('katex') && pluginState.katex.loaded
      ? { engine: 'katex', src: PLUGIN_CDN.katex.src, css: PLUGIN_CDN.katex.css || '' }
      : isChecked('mathjax') && pluginState.mathjax.loaded
      ? { engine: 'MathJax', src: PLUGIN_CDN.mathjax.src, css: '' }
      : { engine: '', src: '', css: '' }; // 都未勾选时禁用数学公式

  // ---- Mermaid 流程图配置 ----
  const mermaidReady =
    isChecked('mermaid') && pluginState.mermaid.loaded && window.CherryCodeBlockMermaidPlugin && window.mermaid;

  const codeBlockCfg = {
    selfClosing: false,
    mermaid: { showSourceToolbar: true },
    // 通过 customRenderer 注入 Mermaid 插件（不使用 usePlugin）
    customRenderer: mermaidReady
      ? {
          mermaid: new window.CherryCodeBlockMermaidPlugin({
            mermaid: window.mermaid,
            mermaidAPI: window.mermaid,
          }),
        }
      : undefined,
    // 阻止 mermaid MutationObserver 自动渲染（即使未启用也设置）
    wrapperRender: (language, _code, innerHTML) =>
      language === 'mermaid' ? innerHTML.replace(/language-mermaid/g, 'language-mermaid-disabled') : innerHTML,
  };

  // ---- ECharts 表格图表配置 ----
  const echartsReady = isChecked('echarts') && pluginState.echarts.loaded && !!window.echarts;
  const tableConfig = echartsReady && window.CherryTableEchartsPlugin
    ? {
        enableChart: true, // 必须是布尔值 true，不能是对象
        chartRenderEngine: window.CherryTableEchartsPlugin,
        externals: ['echarts'], // 声明需要注入的外部依赖
        selfClosing: false,
      }
    : {
        enableChart: false,
        selfClosing: false,
      };

  // ---- 组装完整的 Cherry 配置 ----
  return {
    editor: {
      height: 'auto',
      defaultModel: 'previewOnly', // 纯预览模式（流式场景必需）
    },
    engine: {
      global: {
        flowSessionContext: document.querySelector('.j-status-input').checked, // 流式渲染开关
        flowSessionCursor: 'default',
      },
      syntax: {
        codeBlock: codeBlockCfg,
        table: tableConfig,
        inlineCode: { selfClosing: false },
        header: { anchorStyle: 'none', selfClosing: false },
        fontEmphasis: { selfClosing: false },
        link: { selfClosing: false },
        image: { selfClosing: false },
        mathBlock: { selfClosing: false, ...mathConfig },
        inlineMath: { selfClosing: false, engine: mathConfig.engine, src: '' },
      },
    },
    externals: {
      echarts: window.echarts, // 全局注入 echarts 实例
    },
    previewer: { enablePreviewerBubble: true },
  };
}

// ============================================================================
// 场景初始化 - 流式打印主逻辑
// ============================================================================

/**
 * 初始化 AI Chat Stream 场景
 *
 * 这是整个 demo 的入口函数，负责：
 * 1. 渲染示例消息按钮
 * 2. 绑定插件开关事件
 * 3. 实现流式打印功能
 * 4. 处理用户交互
 *
 * @example
 * // 在 HTML 文件中调用
 * <script type="module">
 *   import { aiChatStreamScenario } from './ai-chat-stream-demo.js';
 *   aiChatStreamScenario();
 * </script>
 */
export function aiChatStreamScenario() {
  // 获取 DOM 元素
  const dialog = document.querySelector('.j-dialog');
  const msgTemplate = document.querySelector('.j-one-msg');
  const msgPickerList = document.querySelector('.j-msg-picker-list');
  const pauseBtn = document.querySelector('.j-pause-button');
  const customTextarea = document.querySelector('.j-custom-textarea');
  const customButton = document.querySelector('.j-custom-button');

  // 流式打印状态
  let currentCherry = null; // 当前 Cherry 实例
  let printing = false; // 是否正在打印
  let paused = false; // 是否暂停
  let currentWordIndex = 0; // 当前打印到的字符索引
  let interval = 30; // 打印间隔（毫秒）
  let rafId = null; // requestAnimationFrame ID

  // Cherry 实例管理（防止内存泄漏）
  const MAX_INSTANCES = 5;
  const cherryInstances = [];

  /**
   * 销毁所有 Cherry 实例
   */
  function destroyAllInstances() {
    while (cherryInstances.length > 0) {
      const instance = cherryInstances.shift();
      try { instance.destroy(); } catch (e) { /* noop */ }
    }
  }

  /**
   * 注册 Cherry 实例，超过上限时销毁最早的实例
   * @param {Object} cherry - Cherry 实例
   */
  function registerInstance(cherry) {
    cherryInstances.push(cherry);
    while (cherryInstances.length > MAX_INSTANCES) {
      const oldest = cherryInstances.shift();
      try { oldest.destroy(); } catch (e) { /* noop */ }
    }
  }

  /**
   * 打印期间禁用/恢复交互控件
   * @param {boolean} disabled - 是否禁用
   */
  function setControlsDisabled(disabled) {
    document.querySelectorAll('.j-msg-pick-btn, .j-custom-button').forEach((el) => {
      el.disabled = disabled;
    });
    customTextarea.disabled = disabled;
  }

  /**
   * 更新暂停按钮状态
   * @param {boolean} isPrinting - 当前是否正在打印
   */
  function updatePauseButton(isPrinting) {
    pauseBtn.disabled = !isPrinting;
    if (!isPrinting) {
      paused = false;
      pauseBtn.innerText = '暂停流式';
    }
  }

  // 渲染消息选择按钮
  msgList.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'button secondary j-msg-pick-btn';
    btn.dataset.index = index;
    btn.textContent = item.title;
    msgPickerList.appendChild(btn);
  });

  /**
   * 确保所有已勾选的插件加载完成
   * 在开始打印前调用，避免渲染时插件未就绪
   */
  async function ensureCheckedPluginsLoaded() {
    const checkboxes = document.querySelectorAll('.j-plugin-checkbox:checked');
    for (const cb of checkboxes) {
      await loadPlugin(cb.dataset.plugin);
    }
  }

  /**
   * 开始流式打印
   * 创建新的 Cherry 实例并使用 rAF + 批量字符推进
   * @param {string} msg - 要打印的 Markdown 内容
   */
  function beginPrint(msg) {
    // 取消之前的 rAF（若有残留）
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

    printing = true;
    paused = false;
    currentWordIndex = 0;
    setControlsDisabled(true);
    updatePauseButton(true);

    // 克隆消息模板
    const msgEl = msgTemplate.cloneNode(true);
    msgEl.classList.remove('j-one-msg');

    // 创建 Cherry 实例
    const config = getCherryConfig();
    config.el = msgEl.querySelector('.chat-one-msg');
    currentCherry = new Cherry(config);
    registerInstance(currentCherry);
    dialog.appendChild(msgEl);

    // rAF + 基于时间的批量字符推进
    let lastTime = performance.now();

    function step(now) {
      if (!printing) return;

      if (paused) {
        lastTime = now; // 暂停时重置时间基准，避免恢复后一次性跳过大量字符
        rafId = requestAnimationFrame(step);
        return;
      }

      // 根据经过时间计算本帧应推进的字符数
      const elapsed = now - lastTime;
      const charsToAdvance = Math.max(1, Math.floor(elapsed / interval));
      lastTime = now;

      currentWordIndex = Math.min(currentWordIndex + charsToAdvance, msg.length);
      currentCherry.setMarkdown(msg.substring(0, currentWordIndex));

      if (currentWordIndex < msg.length) {
        rafId = requestAnimationFrame(step);
      } else {
        // 打印完成
        rafId = null;
        printing = false;
        setControlsDisabled(false);
        updatePauseButton(false);
      }
    }

    rafId = requestAnimationFrame(step);
  }

  // ========================================================================
  // 事件绑定
  // ========================================================================

  // 消息选择按钮点击事件
  msgPickerList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.j-msg-pick-btn');
    if (!btn || printing) return;
    await ensureCheckedPluginsLoaded(); // 先加载插件
    beginPrint(msgList[Number(btn.dataset.index)].content); // 开始打印
  });

  // 插件复选框切换事件（加载/卸载 + 互斥处理）
  document.querySelectorAll('.j-plugin-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', async function () {
      const plugin = this.dataset.plugin;

      if (this.checked) {
        // 加载期间禁用所有插件复选框，防止重复点击
        document.querySelectorAll('.j-plugin-checkbox').forEach((cb) => { cb.disabled = true; });

        // KaTeX ↔ MathJax 互斥：勾选其中一个会自动取消另一个
        const other = MUTUAL_EXCLUSION[plugin];
        if (other) {
          const otherCb = document.getElementById(`plugin-${other}`);
          if (otherCb?.checked) {
            otherCb.checked = false;
            unloadPlugin(other);
          }
        }
        await loadPlugin(plugin); // 懒加载插件

        // 加载完成，恢复所有复选框可用
        document.querySelectorAll('.j-plugin-checkbox').forEach((cb) => { cb.disabled = false; });
      } else {
        unloadPlugin(plugin); // 卸载插件
      }
    });
  });

  // 流式适配开关（影响打印速度）
  document.querySelector('.j-status-input').addEventListener('change', function () {
    interval = this.checked ? 30 : 50; // 开启时快速打印（30ms），关闭时慢速（50ms）
    destroyAllInstances(); // 销毁所有 Cherry 实例
    dialog.innerHTML = ''; // 清空消息列表
  });

  // 暂停/继续按钮
  pauseBtn.addEventListener('click', () => {
    if (!printing) return; // 非打印状态不响应
    paused = !paused;
    pauseBtn.innerText = paused ? '继续流式' : '暂停流式';
  });

  // 自定义内容打印
  customButton.addEventListener('click', async () => {
    if (printing) return;
    const content = customTextarea.value.trim();
    if (!content) {
      showToast('请输入要流式打印的内容', 'info');
      return;
    }
    await ensureCheckedPluginsLoaded();
    beginPrint(content);
  });
}

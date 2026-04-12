/**
 * AI Chat Stream Demo - 插件懒加载与启用/禁用管理
 *
 * ## Cherry Markdown 内部机制
 *
 * ### 数学公式（KaTeX / MathJax）
 * - Cherry 构造时 `Engine.initMath()` 根据 `config.engine.syntax.mathBlock` 的
 *   engine/src/css 配置决定是否加载 CDN 脚本。
 * - 如果 engine 和 src 都为空，`initMath()` 直接 return，不加载任何东西。
 * - `LoadMathModule` 装饰器在每次 `toHtml` 时从 `window`/`externals` 获取
 *   katex/MathJax 实例；找不到则原样输出公式源码。
 * - Cherry 默认配置中 `mathBlock.engine = 'MathJax'`，所以必须显式覆盖为空。
 *
 * ### Mermaid
 * - 通过 `codeBlock.customRenderer.mermaid` 注入 `CherryCodeBlockMermaidPlugin` 实例。
 * - CodeBlock hook 在渲染时检查 `customParser[lang]`，存在则调用其 render 方法。
 * - 不使用 `Cherry.usePlugin()` —— 它会永久修改 `Cherry.config.defaults`（静态属性），
 *   注册后无法撤销，导致后续所有实例都会继承 mermaid 渲染器。
 * - mermaid v11 加载后注册 MutationObserver（不可撤销），通过 wrapperRender 替换
 *   代码块 class 来阻止自动渲染。
 *
 * ### 流式打印
 * - 每条消息创建独立的 Cherry 实例，通过 `setMarkdown()` 逐字更新。
 * - 关键是 `getCherryConfig()` 根据当前 checkbox 状态返回正确配置。
 */

// ============================================================================
// 插件 CDN 配置（纯静态，不含运行时状态）
// ============================================================================
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
};

/** 插件运行时状态 */
const pluginState = {
  mermaid: { loaded: false, loading: false },
  katex: { loaded: false, loading: false },
  mathjax: { loaded: false, loading: false },
};

/** KaTeX ↔ MathJax 互斥映射 */
const MUTUAL_EXCLUSION = { katex: 'mathjax', mathjax: 'katex' };

// ============================================================================
// 示例消息
// ============================================================================
const msgList = [
  {
    title: '概述：流式渲染配置',
    content:
      '### 概述\n通过以下方式打开Cherry Markdown的流式渲染能力：\n```javascript\nconst cherry = new Cherry({\n  editor: {\n    height: "auto",\n    defaultModel: "previewOnly",\n  },\n  engine: {\n    global: {\n      flowSessionContext: true,\n      flowSessionCursor: "default",\n    },\n  },\n});\n```\n',
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
    title: '代码块 + 表格 + 公式',
    content:
      '### 综合示例\n\n#### 代码块\n```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))  # 输出: 55\n```\n\n#### 表格\n| 插件 | 用途 | 大小 |\n|:----:|:-----|-----:|\n| Mermaid | 流程图、时序图 | ~2MB |\n| KaTeX | 数学公式（快） | ~300KB |\n| MathJax | 数学公式（全） | ~3MB |\n\n#### 数学公式\n欧拉公式：$e^{i\\pi} + 1 = 0$\n',
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
    script.onload = () => setTimeout(resolve, 100);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function loadCSS(href, id) {
  return new Promise((resolve) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    document.head.appendChild(link);
  });
}

function updatePluginStatus(plugin, status) {
  const dot = document.querySelector(`.j-status-dot-${plugin}`);
  if (dot) {
    dot.className = `status-dot j-plugin-status j-status-dot-${plugin}${status ? ` ${status}` : ''}`;
  }
}

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
    if (cdn.css) await loadCSS(cdn.css, `${plugin}-css`);
    await loadScript(cdn.src, `${plugin}-js`);

    if (plugin === 'mermaid') {
      // 禁用 mermaid 自动渲染（MutationObserver 仍会注册但不会立即扫描）
      if (window.mermaid) window.mermaid.initialize({ startOnLoad: false });
      // 加载 Cherry 适配插件（暴露 window.CherryCodeBlockMermaidPlugin）
      // 使用 module 模式：Vite dev server 会将此请求重定向到 ES module 虚拟模块
      if (cdn.pluginSrc) {
        await loadScript(cdn.pluginSrc, `${plugin}-plugin-js`, { module: true });
        // module script 的 onload 不保证模块已执行，轮询等待全局变量可用
        await new Promise((resolve) => {
          const check = () => (window.CherryCodeBlockMermaidPlugin ? resolve() : setTimeout(check, 50));
          check();
        });
      }
    }

    state.loaded = true;
    state.loading = false;
    updatePluginStatus(plugin, 'loaded');
  } catch (e) {
    state.loading = false;
    updatePluginStatus(plugin, '');
    console.error(`[Plugin] ${plugin} 加载失败:`, e);
  }
}

/**
 * 卸载插件。
 * - mermaid：不删除脚本（MutationObserver 不可撤销），仅标记 loaded=false，
 *   靠 getCherryConfig 中不传 customRenderer + wrapperRender 替换 class 来阻止渲染。
 * - katex/mathjax：删除 DOM 标签 + 清理 window 引用，重新勾选时 loadPlugin 会重新加载。
 */
function unloadPlugin(plugin) {
  const state = pluginState[plugin];
  state.loaded = false;
  state.loading = false;

  if (plugin === 'mermaid') {
    if (window.mermaid) window.mermaid.initialize({ startOnLoad: false });
  } else {
    document.getElementById(`${plugin}-js`)?.remove();
    document.getElementById(`${plugin}-css`)?.remove();
    if (plugin === 'katex') delete window.katex;
    if (plugin === 'mathjax') delete window.MathJax;
  }

  updatePluginStatus(plugin, '');
}

// ============================================================================
// Cherry 配置生成
// ============================================================================

/**
 * 根据当前 checkbox + 加载状态生成 Cherry 配置。
 *
 * 核心原则：
 * - 未勾选 → engine/src/css 全部置空，Cherry 的 initMath() 直接跳过
 * - 已勾选 + 已加载 → 传入正确的 engine/src/css
 * - mermaid 启用 → 通过 customRenderer 传入实例（不用 usePlugin）
 * - mermaid 禁用 → wrapperRender 替换 class 防止 MutationObserver 自动渲染
 * - wrapperRender 始终设置（即使 mermaid 启用时也作为 fallback 保护）
 */
function getCherryConfig() {
  // ---- 数学引擎 ----
  let mathEngine = '';
  let mathSrc = '';
  let mathCss = '';

  if (isChecked('katex') && pluginState.katex.loaded) {
    mathEngine = 'katex';
    mathSrc = PLUGIN_CDN.katex.src;
    mathCss = PLUGIN_CDN.katex.css || '';
  } else if (isChecked('mathjax') && pluginState.mathjax.loaded) {
    mathEngine = 'MathJax';
    mathSrc = PLUGIN_CDN.mathjax.src;
  }

  // ---- Mermaid ----
  const mermaidReady =
    isChecked('mermaid') && pluginState.mermaid.loaded && window.CherryCodeBlockMermaidPlugin && window.mermaid;

  const codeBlockCfg = {
    selfClosing: false,
    mermaid: { showSourceToolbar: true },
  };

  if (mermaidReady) {
    codeBlockCfg.customRenderer = {
      mermaid: new window.CherryCodeBlockMermaidPlugin({
        mermaid: window.mermaid,
        mermaidAPI: window.mermaid,
      }),
    };
  }

  // 始终设置 wrapperRender：
  // - mermaid 未启用：替换 class 阻止 MutationObserver 自动渲染
  // - mermaid 已启用：作为 fallback（parseCustomLanguage 失败时回退到普通代码块）
  codeBlockCfg.wrapperRender = (language, _code, innerHTML) => {
    if (language === 'mermaid') {
      return innerHTML.replace(/language-mermaid/g, 'language-mermaid-disabled');
    }
    return innerHTML;
  };

  // ---- 组装配置 ----
  // 注意：Cherry 默认 mathBlock.engine='MathJax'，必须显式置空覆盖
  return {
    editor: {
      height: 'auto',
      defaultModel: 'previewOnly',
    },
    engine: {
      global: {
        flowSessionContext: document.querySelector('.j-status-input').checked,
        flowSessionCursor: 'default',
      },
      syntax: {
        codeBlock: codeBlockCfg,
        table: { enableChart: true, selfClosing: false },
        inlineCode: { selfClosing: false },
        header: { anchorStyle: 'none', selfClosing: false },
        fontEmphasis: { selfClosing: false },
        link: { selfClosing: false },
        image: { selfClosing: false },
        mathBlock: { selfClosing: false, engine: mathEngine, src: mathSrc, css: mathCss },
        inlineMath: { selfClosing: false, engine: mathEngine, src: '' },
      },
    },
    externals: {
      echarts: window.echarts,
    },
    previewer: { enablePreviewerBubble: true },
  };
}

// ============================================================================
// 场景初始化
// ============================================================================
export function aiChatStreamScenario() {
  const dialog = document.querySelector('.j-dialog');
  const msgTemplate = document.querySelector('.j-one-msg');
  const msgPickerList = document.querySelector('.j-msg-picker-list');
  const pauseBtn = document.querySelector('.j-pause-button');
  const customTextarea = document.querySelector('.j-custom-textarea');
  const customButton = document.querySelector('.j-custom-button');

  let currentCherry = null;
  let printing = false;
  let paused = false;
  let currentWordIndex = 0;
  let interval = 30;

  /** 打印期间禁用/恢复交互控件 */
  function setControlsDisabled(disabled) {
    document.querySelectorAll('.j-msg-pick-btn, .j-custom-button').forEach((el) => {
      el.disabled = disabled;
    });
    customTextarea.disabled = disabled;
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

  /** 确保所有已勾选的插件加载完成 */
  async function ensureCheckedPluginsLoaded() {
    const checkboxes = document.querySelectorAll('.j-plugin-checkbox:checked');
    for (const cb of checkboxes) {
      await loadPlugin(cb.dataset.plugin);
    }
  }

  /** 流式打印 */
  function beginPrint(msg) {
    printing = true;
    currentWordIndex = 0;
    setControlsDisabled(true);

    const msgEl = msgTemplate.cloneNode(true);
    msgEl.classList.remove('j-one-msg');

    const config = getCherryConfig();
    config.el = msgEl.querySelector('.chat-one-msg');
    currentCherry = new Cherry(config);
    dialog.appendChild(msgEl);
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'end' });

    function step() {
      try {
        dialog.scrollTop = dialog.scrollHeight;
      } catch (e) {
        /* noop */
      }
      if (paused) {
        setTimeout(step, 100);
        return;
      }
      currentCherry.setMarkdown(msg.substring(0, currentWordIndex));
      try {
        dialog.scrollTop = dialog.scrollHeight;
      } catch (e) {
        /* noop */
      }
      if (currentWordIndex < msg.length) {
        currentWordIndex++;
        setTimeout(step, interval);
      } else {
        printing = false;
        setControlsDisabled(false);
        msgEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
    setTimeout(step, interval);
  }

  // ---- 事件绑定 ----

  // 消息选择
  msgPickerList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.j-msg-pick-btn');
    if (!btn || printing) return;
    await ensureCheckedPluginsLoaded();
    beginPrint(msgList[Number(btn.dataset.index)].content);
  });

  // 插件 checkbox（加载/卸载 + 互斥）
  document.querySelectorAll('.j-plugin-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', async function () {
      const plugin = this.dataset.plugin;

      if (this.checked) {
        // KaTeX ↔ MathJax 互斥
        const other = MUTUAL_EXCLUSION[plugin];
        if (other) {
          const otherCb = document.getElementById(`plugin-${other}`);
          if (otherCb?.checked) {
            otherCb.checked = false;
            unloadPlugin(other);
          }
        }
        await loadPlugin(plugin);
      } else {
        unloadPlugin(plugin);
      }
    });
  });

  // 流式适配开关
  document.querySelector('.j-status-input').addEventListener('change', function () {
    interval = this.checked ? 30 : 50;
    dialog.innerHTML = '';
  });

  // 暂停/继续
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.innerText = paused ? '继续流式' : '暂停流式';
  });

  // 自定义内容
  customButton.addEventListener('click', async () => {
    if (printing) return;
    const content = customTextarea.value.trim();
    if (!content) {
      alert('请输入要流式打印的内容');
      return;
    }
    await ensureCheckedPluginsLoaded();
    beginPrint(content);
  });
}

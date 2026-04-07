// 插件配置
const pluginConfig = {
  mermaid: {
    loaded: false,
    loading: false,
    src: 'https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.min.js',
    pluginSrc: '../packages/cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin.js',
  },
  katex: {
    loaded: false,
    loading: false,
    src: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
    css: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
  },
  mathjax: {
    loaded: false,
    loading: false,
    src: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js',
  },
};

// 示例消息列表
const msgList = [
  '### 概述\n通过以下方式打开Cherry Markdown的流式渲染能力：\n```javascript\nconst cherry = new Cherry({\n  editor: {\n    height: "auto",\n    defaultModel: "previewOnly",\n  },\n  engine: {\n    global: {\n      flowSessionContext: true,\n      flowSessionCursor: "default",\n    },\n  },\n});\n```\n',
  '### 数学公式示例\n\n#### 行内公式\n质能方程：$E = mc^2$\n\n#### 块级公式\n高斯公式：\n$$\\oint_S \\vec{F} \\cdot d\\vec{A} = \\int_V (\\nabla \\cdot \\vec{F}) dV$$\n\n二次方程根：\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n',
  '### Mermaid 流程图示例\n\n```mermaid\ngraph TD\n    A[开始] --> B{是否加载插件?}\n    B -->|是| C[懒加载插件]\n    B -->|否| D[使用默认渲染]\n    C --> E[渲染内容]\n    D --> E\n    E --> F[结束]\n```\n\n#### 时序图\n\n```mermaid\nsequenceDiagram\n    participant 用户\n    participant Cherry\n    participant 插件\n    用户->>Cherry: setMarkdown()\n    Cherry->>插件: 检查是否需要渲染\n    插件-->>Cherry: 返回渲染结果\n    Cherry-->>用户: 显示内容\n```\n',
  '### 综合示例\n\n#### 代码块\n```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))  # 输出: 55\n```\n\n#### 表格\n| 插件 | 用途 | 大小 |\n|:----:|:-----|-----:|\n| Mermaid | 流程图、时序图 | ~2MB |\n| KaTeX | 数学公式（快） | ~300KB |\n| MathJax | 数学公式（全） | ~3MB |\n\n#### 数学公式\n欧拉公式：$e^{i\\pi} + 1 = 0$\n',
];

// 加载脚本
function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.onload = () => {
      // 等待一小段时间确保脚本执行完毕并挂载到 window
      setTimeout(resolve, 100);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 加载样式
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

// 更新插件状态显示
function updatePluginStatus(plugin, status) {
  const statusEl = document.querySelector(`.j-plugin-status[data-plugin="${plugin}"]`);
  if (statusEl) {
    statusEl.className = `plugin-status j-plugin-status ${status}`;
    switch (status) {
      case 'loading':
        statusEl.textContent = '(加载中...)';
        break;
      case 'loaded':
        statusEl.textContent = '(已加载)';
        break;
      default:
        statusEl.textContent = '';
    }
  }
}

// 懒加载插件
async function loadPlugin(plugin) {
  const config = pluginConfig[plugin];
  if (config.loaded || config.loading) return;

  config.loading = true;
  updatePluginStatus(plugin, 'loading');

  try {
    if (config.css) {
      await loadCSS(config.css, `${plugin}-css`);
    }
    await loadScript(config.src, `${plugin}-js`);

    // mermaid 需要额外加载插件脚本
    if (plugin === 'mermaid' && config.pluginSrc) {
      await loadScript(config.pluginSrc, `${plugin}-plugin-js`);
    }

    // 特殊初始化
    if (plugin === 'mermaid' && window.mermaid && window.CherryCodeBlockMermaidPlugin) {
      // 使用 usePlugin 注册 mermaid 插件
      Cherry.usePlugin(window.CherryCodeBlockMermaidPlugin, {
        mermaid: window.mermaid,
        mermaidAPI: window.mermaid,
      });
    }

    config.loaded = true;
    config.loading = false;
    updatePluginStatus(plugin, 'loaded');
    console.log(`[Plugin] ${plugin} 加载完成`);
  } catch (e) {
    config.loading = false;
    updatePluginStatus(plugin, '');
    console.error(`[Plugin] ${plugin} 加载失败:`, e);
  }
}

// 获取当前 Cherry 配置
function getCherryConfig() {
  const useMermaid = document.getElementById('plugin-mermaid').checked;
  const useKatex = document.getElementById('plugin-katex').checked;
  const useMathJax = document.getElementById('plugin-mathjax').checked;

  // 数学引擎配置
  let mathEngine = 'katex';
  let mathSrc = pluginConfig.katex.src;
  let mathCss = pluginConfig.katex.css;

  if (useMathJax && !useKatex) {
    mathEngine = 'MathJax';
    mathSrc = pluginConfig.mathjax.src;
    mathCss = '';
  }

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
        codeBlock: {
          selfClosing: false,
          mermaid: {
            showSourceToolbar: true,
          },
        },
        inlineCode: { selfClosing: false },
        header: { anchorStyle: 'none', selfClosing: false },
        table: { selfClosing: false },
        fontEmphasis: { selfClosing: false },
        link: { selfClosing: false },
        image: { selfClosing: false },
        mathBlock: {
          selfClosing: false,
          engine: mathEngine,
          src: mathSrc,
          css: mathCss,
        },
        inlineMath: {
          selfClosing: false,
          engine: mathEngine,
        },
      },
    },
    externals: {
      // mermaid 通过 usePlugin 方式注册，不需要在这里配置
    },
    previewer: {
      enablePreviewerBubble: true,
    },
  };
}

/**
 * AI Chat Stream 场景初始化
 */
export function aiChatStreamScenario() {
  // 初始化 DOM 元素
  const dialog = document.querySelector('.j-dialog');
  const msgTemplate = document.querySelector('.j-one-msg');
  const button = document.querySelector('.j-button');
  const buttonTips = document.querySelector('.j-button-tips');
  const pauseBtn = document.querySelector('.j-pause-button');
  const customTextarea = document.querySelector('.j-custom-textarea');
  const customButton = document.querySelector('.j-custom-button');

  let currentCherry = null;
  let printing = false;
  let paused = false;
  let currentMsgIndex = msgList.length;
  let currentWordIndex = 0;
  let interval = 30;

  buttonTips.innerHTML = currentMsgIndex;

  // 流式打印函数
  function beginPrint(msg) {
    printing = true;
    function step() {
      if (paused) {
        setTimeout(step, 100);
        return;
      }
      const currentText = msg.substring(0, currentWordIndex);
      currentCherry.setMarkdown(currentText);
      try {
        dialog.scrollTop = dialog.scrollHeight;
      } catch (e) {}
      if (currentWordIndex < msg.length) {
        currentWordIndex++;
        setTimeout(step, interval);
      } else {
        printing = false;
        currentWordIndex = 0;
      }
    }
    setTimeout(step, interval);
  }

  // 插件复选框事件
  document.querySelectorAll('.j-plugin-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', async function () {
      const plugin = this.dataset.plugin;

      // KaTeX 和 MathJax 互斥
      if (plugin === 'katex' && this.checked) {
        document.getElementById('plugin-mathjax').checked = false;
      } else if (plugin === 'mathjax' && this.checked) {
        document.getElementById('plugin-katex').checked = false;
      }

      // 懒加载插件
      if (this.checked) {
        await loadPlugin(plugin);
      }
    });
  });

  // 流式适配开关
  document.querySelector('.j-status-input').addEventListener('change', function () {
    interval = this.checked ? 30 : 50;
    currentWordIndex = 0;
    currentMsgIndex = msgList.length;
    buttonTips.innerHTML = currentMsgIndex;
    dialog.innerHTML = '';
  });

  // 暂停/继续按钮
  pauseBtn.addEventListener('click', function () {
    paused = !paused;
    pauseBtn.innerText = paused ? '继续流式' : '暂停流式';
  });

  // 获取消息按钮
  button.addEventListener('click', async function () {
    if (printing || currentMsgIndex === 0) return;

    // 检查并加载需要的插件
    const checkboxes = document.querySelectorAll('.j-plugin-checkbox:checked');
    for (const cb of checkboxes) {
      await loadPlugin(cb.dataset.plugin);
    }

    const msg = msgTemplate.cloneNode(true);
    msg.classList.remove('j-one-msg');
    const config = getCherryConfig();
    config.el = msg.querySelector('.chat-one-msg');
    currentCherry = new Cherry(config);
    dialog.appendChild(msg);

    try {
      dialog.scrollTop = dialog.scrollHeight;
    } catch (e) {}

    beginPrint(msgList[msgList.length - currentMsgIndex]);
    currentMsgIndex--;
    buttonTips.innerHTML = currentMsgIndex;
  });

  // 自定义内容按钮
  customButton.addEventListener('click', async function () {
    if (printing) return;

    const customContent = customTextarea.value.trim();
    if (!customContent) {
      alert('请输入要流式打印的内容');
      return;
    }

    // 检查并加载需要的插件
    const checkboxes = document.querySelectorAll('.j-plugin-checkbox:checked');
    for (const cb of checkboxes) {
      await loadPlugin(cb.dataset.plugin);
    }

    const msg = msgTemplate.cloneNode(true);
    msg.classList.remove('j-one-msg');
    const config = getCherryConfig();
    config.el = msg.querySelector('.chat-one-msg');
    currentCherry = new Cherry(config);
    dialog.appendChild(msg);

    try {
      dialog.scrollTop = dialog.scrollHeight;
    } catch (e) {}

    beginPrint(customContent);
  });

  // 默认加载 KaTeX
  loadPlugin('katex');
}

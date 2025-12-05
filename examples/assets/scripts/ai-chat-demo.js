const cherryConfig = {
  editor: {
    height: 'auto',
    defaultModel: 'previewOnly',
  },
  engine: {
    global: {
      // 开启流式模式
      flowSessionContext: true,
      flowSessionCursor: 'default',
    },
    syntax: {
      codeBlock: {
        selfClosing: false,
      },
      inlineCode: {
        selfClosing: false,
      },
      header: {
        anchorStyle: 'none',
      },
      table: {
        selfClosing: false,
      },
      fontEmphasis: {
        selfClosing: false,
      },
      header: {
        anchorStyle: 'none',
        selfClosing: false,
      },
      link: {
        selfClosing: false,
      },
      image: {
        selfClosing: false,
        selfClosingRender: (type, name, url) => {
          if (type === 'img') {
            return `<img style="width:30px;height:30px;border-radius:15px;" src="assets/images/loading.gif" alt="${name}" />`;
          }
          return '';
        },
      },
      mathBlock: {
        selfClosing: false,
        // engine: 'MathJax', // katex或MathJax
        engine: 'katex', // katex或MathJax
        // src: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js', // 如果使用MathJax plugins，则需要使用该url通过script标签引入
        src: 'https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.js',
        css: 'https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css', // 如果使用katex，则还需要引入css（如果是MathJax，则不需要）
      },
      inlineMath: {
        selfClosing: false,
        // engine: 'MathJax', // katex或MathJax
        engine: 'katex', // katex或MathJax
      },
    },
  },
  previewer: {
    enablePreviewerBubble: false,
  },
};

const msgList = [
  '### 概述\n通过以下方式打开Cherry Markdown的流式渲染能力和虚拟光标：\n```javascript\nconst cherry = new Cherry({\n  editor: {\n    height: "auto",\n    // 纯预览模式\n    defaultModel: "previewOnly",\n  },\n  engine: {\n    global: {\n      // 开启流式渲染模式\n      flowSessionContext: true,\n      /**\n       * 流式会话时，在最后位置增加一个类似光标的dom\n       * - "default"：用cherry提供的默认样式\n       * - ""：不增加任何dom\n       * - "<span class="custom-cursor"></span>": 自定义的dom\n       */\n      flowSessionCursor: "default",\n    },\n  },\n  previewer: {\n    // 关闭预览区的编辑功能\n    enablePreviewerBubble: false,\n  },\n});\n```\n开启流式渲染后，cherry会对以下语法进行自动补全，避免出现Markdown源码，以达到在流式输出过程中**稳定输出**的效果：\n- 标题\n- 加粗、斜体\n- 超链接\n- 图片、音视频\n- 行内代码块\n- 段落代码块\n- 行内公式\n- 段落公式\n- 无序列表\n- 表格\n- mermaid画图\n- 脚注\n\n',
  '### 提升渲染频率\n在流式输出的情况下cherry提供了更快的渲染频率（最快每**10ms渲染一次**）\n在关闭流式输出时，cherry的渲染频率为最快**50ms渲染一次**。\n### 稳定输出加粗斜体\n在流式输出的情况下输出**加粗文字时，cherry会自动补全加粗文字**。\n在流式输出的情况下输出*斜体文字时，cherry会自动补全斜体文字*。\n### 稳定输出代码块\n在流式输出的情况下，文字会一个一个的输出到页面上\n在输出**代码块**时，cherry会自动补全代码块：\n```\nalert("hello world");\nalert("hello world");\n```\n代码块输出结束了。\n在输出**行内代码**时，cherry会自动补全行内代码：`alert("hello world");`',
  '### 稳定输出公式\n在流式输出的情况下可稳定输出行内公式如：$(a+b)^2=a^2+2ab+b^2$ 行内公式输出结束\n也可以稳定输出段落公式如：$$(a+b)^2=a^2+2ab+b^2$$  段落公式输出结束\n### 稳定输出超链接、图片、视频\n输出超链接时不会漏出源码，如：[项目Github 地址](https://github.com/Tencent/cherry-markdown)，地址输出结束。\n输出图片时不会漏出源码，如：![dogs #200px#B#S#R](assets/images/demo-dog.png)，图片输出结束。',
  '### 稳定输出表格\n在流式输出的情况下输出**表格**时，在输出第一行表格内容后，cherry自动补全表格的第二行：\n|项目（居中对齐）|价格（右对齐）|数量（左对齐）|\n|:-:|-:|:-|\n|计算机|￥1600|5|\n|手机机|￥12|50|\n表格输出结束了。',
  '### 稳定输出无序列表\n在流式输出的情况下输出**无序列表**的时候，cherry会自动修复无序列表的内容，使内容在输出时不会命中标题语法：\n- 无序列表第一行\n- 无序列表第二行\n- 无序列表第三行\n\n无序列表结束了。\n用短横线命中标题\n--\n标题结束了。',
  '### 稳定输出mermaid图形、脚注等\n输出比较丰富的富媒体内容：\n#### 时序图\n\n```mermaid\ngraph LR\n    A[公司] -->| 下 班 | B(菜市场)\n    B --> C{看见<br>卖西瓜的}\n    C -->|Yes| D[买一个包子]\n    C -->|No| E[买一斤包子]\n```\n\n#### 字体样式\n\n**说明**\n\n- 使用`*(或_)` 和 `**(或__)` 表示*斜体*和 **粗体**\n- 使用 `/` 表示 /下划线/ ,使用`~~` 表示~~删除线~~\n- 使用`^(或^^)`表示^上标^或^^下标^^\n- 使用 ! 号+数字 表示字体 !24 大! !12 小! [^专有语法提醒]\n- 使用两个(三个)!号+RGB 颜色 表示!!#ff0000 字体颜色!!(!!!#f9cb9c 背景颜色!!!)[^专有语法提醒]\n\n**示例**\n\n```markdown\n[!!#ff0000 红色超链接!!](http://www.qq.com)\n[!!#ffffff !!!#000000 黑底白字超链接!!!!!](http://www.qq.com)\n[新窗口打开](http://www.qq.com){target=_blank}\n鞋子 !32 特大号!\n大头 ^`儿子`^ 和小头 ^^`爸爸`^^\n爱在~~西元前~~**当下**\n```\n\n**效果**\n[!!#ff0000 红色超链接!!](http://www.qq.com)\n[!!#ffffff !!!#000000 黑底白字超链接!!!!!](http://www.qq.com)\n[新窗口打开](http://www.qq.com){target=_blank}\n鞋子 !32 特大号!\n大头 ^`儿子`^ 和小头 ^^`爸爸`^^\n爱在~~西元前~~**当下**\n\n---\n\n#### 标题设置\n\n**说明**\n\n- 在文字下方加 === 可使上一行文字变成一级标题\n- 在文字下方加 --- 可使上一行文字变成二级标题\n- 在行首加井号（#）表示不同级别的标题，例如：# H1, ##H2, ###H3\n\n---\n#### 信息面板\n\n**说明**\n使用连续三个冒号`:::`和关键字（`[primary | info | warning | danger | success]`）来声明\n\n```markdown\n:::primary // [primary | info | warning | danger | success] 标题\n内容\n:::\n```\n\n**效果**\n:::p 标题\n内容\n:::\n:::success\n内容\n:::\n\n',
];

function ensureChatDemoDom() {
  const css = `:root{
      --ai-bg: #f8f9fb;
      --ai-surface: #fff;
      --ai-accent: #0d68ff;
      --ai-muted: #ccc;
      --ai-gap: 16px;
      --ai-max-width: 780px;
      --ai-msg-max-width: 680px;
    }

    html, body {
      margin: 0;
      margin-left: auto;
      margin-right: auto;
      padding: 0;
      overflow: auto;
      background: var(--ai-bg);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
      color: #222;
    }

    /* 主对话容器 */
    .ai-chat-wrapper { box-sizing: border-box; }

    .dialog {
      padding: 0 0 0 42px;
      width: 100%;
      max-width: var(--ai-max-width);
      box-sizing: border-box;
      margin: 0 auto;
      overflow-y: auto;
      background: transparent;
    }

    /* 单条消息模板/实例 */
    .one-msg {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin: 18px 0;
      padding: 6px 8px;
      width: 100%;
      max-width: var(--ai-msg-max-width);
      box-sizing: border-box;
    }

    .j-one-msg { display: none; }

    .msg-left { flex-direction: row; }
    .msg-right { flex-direction: row-reverse; }

    .avatar {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      border: 1px solid var(--ai-muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      background: var(--ai-surface);
      color: #111;
    }

    .chat-one-msg {
      display: block;
      width: 100%;
      max-width: 100%;
      background: var(--ai-surface);
      border-radius: 8px;
      padding: 10px 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      box-sizing: border-box;
    }

    /* 控制区 */
    .controls {
      margin: 24px auto 20px;
      display: flex;
      gap: 12px;
      align-items: center;
      width: 100%;
      max-width: var(--ai-max-width);
      box-sizing: border-box;
      justify-content: flex-start;
    }

    .button {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      border: 0;
      background-color: var(--ai-accent);
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(13,104,255,0.16);
      cursor: pointer;
      font-size: 14px;
    }

    .button.secondary {
      background: #ffffff;
      color: #333;
      border: 1px solid var(--ai-muted);
      box-shadow: none;
    }

    .controls .status { margin-left: 6px; }

    .status-input { width: 18px; height: 18px; cursor: pointer; }

    @media (max-width: 720px){
      .ai-chat-wrapper { padding: 12px; }
      .dialog { padding: 10px; }
      .controls { flex-wrap: wrap; gap: 8px; }
      .one-msg { margin: 12px 0; }
      .chat-one-msg { padding: 8px; }
    }

    /* 视觉上隐藏但对屏幕阅读器可见 */
    .sr-only { position: absolute; left: -9999px; top: -9999px; }
`;


  const wrapperExtraCss = `
    /* 将整体 wrapper 拉满高度并使用 flex 居中对齐，使内容水平和垂直居中 */
    .ai-chat-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      padding: 12px 16px;
      background: #f8f9fb;
      box-sizing: border-box;
    }
    .custom-input {
      margin-top: 10px;
      margin-bottom: 10px;
      width: 60%;
      min-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }
    .custom-textarea {
      width: 100%;
      height: 100px;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
      box-sizing: border-box;
    }
  `;
  // 合并额外样式
  const finalCss = css + wrapperExtraCss;
  // 注入样式（如果尚未注入）
  if (!document.getElementById('ai-chat-demo-style')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'ai-chat-demo-style';
    styleEl.innerHTML = finalCss;
    document.head.appendChild(styleEl);
  }

  // 如果页面没有 dialog，则注入示例 DOM 结构
  if (!document.querySelector('.j-dialog')) {
    const wrapper = document.createElement('div');
    // 给 wrapper 添加 class，方便在 CSS 中统一控制样式或做主题覆盖
    wrapper.className = 'ai-chat-wrapper';
    wrapper.innerHTML = `
      <div class="dialog j-dialog" role="log" aria-live="polite" aria-relevant="additions"></div>

      <!-- 消息模板（隐藏） -->
      <div class="one-msg j-one-msg msg-left" aria-hidden="true">
        <div class="avatar" aria-hidden="true">AI</div>
        <div class="chat-one-msg" role="status" aria-live="polite"></div>
      </div>

      <!-- 控件区（更语义化的按钮与 label） -->
      <div class="controls" role="region" aria-label="AI chat controls">
        <button type="button" class="button j-button" aria-label="获取消息">
          获取消息（剩余<span class="j-button-tips"></span>条消息）
        </button>

        <button type="button" class="button secondary j-pause-button pause-button" aria-pressed="false">
          暂停流式
        </button>

        <label class="status" for="j-status-input">
          <input id="j-status-input" class="j-status-input status-input" type="checkbox" checked aria-checked="true"> 开启流式适配
        </label>
      </div>
      <div class="custom-input">
        <textarea class="custom-textarea j-custom-textarea" placeholder="请输入您想要流式打印的Markdown内容..."></textarea>
        <div class="button custom-button j-custom-button">流式打印自定义内容</div>
      </div>
    `;
    document.body.appendChild(wrapper);
  }
}

// 确保 DOM 在脚本后续运行前存在
ensureChatDemoDom();

const dialog = document.querySelector('.j-dialog');
const msgTemplate = document.querySelector('.j-one-msg');
const button = document.querySelector('.j-button');
const buttonTips = document.querySelector('.j-button-tips');
const pauseBtn = document.querySelector('.j-pause-button');
let currentCherry = null;
let printing = false;
let paused = false;
let currentMsgIndex = msgList.length;
let currentWordIndex = 0;
let interval = 30;
buttonTips.innerHTML = currentMsgIndex;

function beginPrint(msg) {
  printing = true;
  function step() {
    if (paused) {
      setTimeout(step, 100);
      return;
    }
    const currentText = msg.substring(0, currentWordIndex);
    currentCherry.setMarkdown(currentText);
    // 确保打印时自动滚动到最新位置
    try {
      dialog.scrollTop = dialog.scrollHeight;
    } catch (e) {
      // ignore in non-browser or if dialog not ready
    }
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

const aiChatScenario = (devCompatibleConfig) => {
  document.querySelector('.j-status-input').addEventListener('change', function () {
    interval = this.checked ? 30 : 50;
    cherryConfig.engine.global.flowSessionContext = this.checked;
    currentWordIndex = 0;
    currentMsgIndex = msgList.length;
    buttonTips.innerHTML = currentMsgIndex;
    dialog.innerHTML = '';
  });
  // 暂停/继续按钮
  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      paused = !paused;
      pauseBtn.innerText = paused ? '继续流式' : '暂停流式';
    });
  }
  button.addEventListener('click', function () {
    if (printing || currentMsgIndex === 0) {
      return;
    }
    const msg = msgTemplate.cloneNode(true);
    msg.classList.remove('j-one-msg');
    currentCherry = new Cherry(
      Object.assign(cherryConfig, { el: msg.querySelector('.chat-one-msg') }, devCompatibleConfig),
    );
    dialog.appendChild(msg);
    // 自动滚动到最新消息
    try {
      dialog.scrollTop = dialog.scrollHeight;
    } catch (e) {
      // ignore
    }
    beginPrint(msgList[msgList.length - currentMsgIndex]);
    currentMsgIndex--;
    buttonTips.innerHTML = currentMsgIndex;
  });

  // 自定义输入功能
  const customTextarea = document.querySelector('.j-custom-textarea');
  const customButton = document.querySelector('.j-custom-button');
  
  customButton.addEventListener('click', function () {
    if (printing) {
      return;
    }
    
    const customContent = customTextarea.value.trim();
    if (!customContent) {
      alert('请输入要流式打印的内容');
      return;
    }
    
    const msg = msgTemplate.cloneNode(true);
    msg.classList.remove('j-one-msg');
    currentCherry = new Cherry(
      Object.assign(cherryConfig, { el: msg.querySelector('.chat-one-msg') }, devCompatibleConfig),
    );
    dialog.appendChild(msg);
    
    // 自动滚动到最新消息
    try {
      dialog.scrollTop = dialog.scrollHeight;
    } catch (e) {
      // ignore
    }
    
    beginPrint(customContent);
    
    // 清空输入框
    // customTextarea.value = '';
  });
};

export { aiChatScenario };

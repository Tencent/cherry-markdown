var cherryConfig = {
  editor: {
    height: 'auto',
    defaultModel: 'previewOnly',
  },
  engine: {
    global: {
      // 开启流式模式 （默认 true）
      flowSessionContext: true,
    },
    syntax: {
      codeBlock: {
        selfClosing: false,
      },
      header: {
        anchorStyle: 'none',
      }
    }
  },
  previewer: {
    enablePreviewerBubble: false,
  },
  isPreviewOnly: true,
};

const msgList = [
  '在流式输出的情况下，文字会一个一个的输出到页面上\n在输出代码块时，cherry会自动补全代码块：\n```\nalert("hello world");\nalert("hello world");\n```\n代码块输出结束了。',
  '在输出无序列表的时候，cherry会自动修复无序列表的内容，是内容在输出时不会命中标题语法：\n- 无序列表第一行\n- 无序列表第二行\n- 无序列表第三行\n\n无序列表结束了。\n用短横线命中标题\n--\n标题结束了。',
];

const dialog = document.querySelector('.j-dialog');
const msgTemplate = document.querySelector('.j-one-msg');
const button = document.querySelector('.j-button');
const buttonTips = document.querySelector('.j-button-tips');
let currentCherry = null;
let printing = false;
let currentMsgIndex = msgList.length;
let currentWordIndex = 0;
let interval = 30;
buttonTips.innerHTML = currentMsgIndex;


document.querySelector('.j-status-input').addEventListener('change', function() {
  interval = this.checked ? 30 : 50;
  cherryConfig.engine.global.flowSessionContext = this.checked;
  currentWordIndex = 0;
  currentMsgIndex = msgList.length;
  buttonTips.innerHTML = currentMsgIndex;
  dialog.innerHTML = '';
})
button.addEventListener('click', function () {
  if (printing || currentMsgIndex === 0) {
    return;
  }
  const msg = msgTemplate.cloneNode(true);
  msg.classList.remove('j-one-msg');
  currentCherry = new Cherry(Object.assign({}, cherryConfig, { el: msg.querySelector('.chat-one-msg') }));
  dialog.appendChild(msg);
  beginPrint(msgList[msgList.length - currentMsgIndex]);
  currentMsgIndex --;
  buttonTips.innerHTML = currentMsgIndex;
});


function beginPrint(msg) {
  printing = true;
  setTimeout(function () {
    // 截取字符串
    const currentText = msg.substring(0, currentWordIndex);
    currentCherry.setMarkdown(currentText);
    if (currentWordIndex < msg.length) {
      currentWordIndex++;
      beginPrint(msg);
    } else {
      printing = false;
      currentWordIndex = 0;
    }
  }, interval);
}


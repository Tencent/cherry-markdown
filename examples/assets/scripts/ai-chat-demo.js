var cherryConfig = {
  editor: {
    height: 'auto',
    defaultModel: 'previewOnly',
  },
  engine: {
    global: {
      // 开启流式模式 （默认 true）
      flowSessionContext: true,
      flowSessionCursor: 'default',
    },
    syntax: {
      codeBlock: {
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
      }
    }
  },
  previewer: {
    enablePreviewerBubble: false,
  },
  isPreviewOnly: true,
};

const msgList = [
  '在流式输出的情况下cherry提供了更快的渲染频率（最快每**10ms渲染一次**）\n在关闭流式输出时，cherry的渲染频率为最快**50ms渲染一次**。',
  '在流式输出的情况下输出**加粗文字时，cherry会自动补全加粗文字**。\n在流式输出的情况下输出*斜体文字时，cherry会自动补全斜体文字*。',
  '在流式输出的情况下，文字会一个一个的输出到页面上\n在输出**代码块**时，cherry会自动补全代码块：\n```\nalert("hello world");\nalert("hello world");\n```\n代码块输出结束了。',
  '在流式输出的情况下输出**无序列表**的时候，cherry会自动修复无序列表的内容，使内容在输出时不会命中标题语法：\n- 无序列表第一行\n- 无序列表第二行\n- 无序列表第三行\n\n无序列表结束了。\n用短横线命中标题\n--\n标题结束了。',
  '在流式输出的情况下输出**表格**时，在输出第一行表格内容后，cherry自动补全表格的第二行：\n|项目（居中对齐）|价格（右对齐）|数量（左对齐）|\n|:-:|-:|:-|\n|计算机|￥1600|5|\n|手机机|￥12|50|\n表格输出结束了。',
  '输出比较丰富的富媒体内容：\n## 字体样式\n\n**说明**\n\n- 使用`*(或_)` 和 `**(或__)` 表示*斜体*和 **粗体**\n- 使用 `/` 表示 /下划线/ ,使用`~~` 表示~~删除线~~\n- 使用`^(或^^)`表示^上标^或^^下标^^\n- 使用 ! 号+数字 表示字体 !24 大! !12 小! [^专有语法提醒]\n- 使用两个(三个)!号+RGB 颜色 表示!!#ff0000 字体颜色!!(!!!#f9cb9c 背景颜色!!!)[^专有语法提醒]\n\n**示例**\n\n```markdown\n[!!#ff0000 红色超链接!!](http://www.qq.com)\n[!!#ffffff !!!#000000 黑底白字超链接!!!!!](http://www.qq.com)\n[新窗口打开](http://www.qq.com){target=_blank}\n鞋子 !32 特大号!\n大头 ^`儿子`^ 和小头 ^^`爸爸`^^\n爱在~~西元前~~**当下**\n```\n\n**效果**\n[!!#ff0000 红色超链接!!](http://www.qq.com)\n[!!#ffffff !!!#000000 黑底白字超链接!!!!!](http://www.qq.com)\n[新窗口打开](http://www.qq.com){target=_blank}\n鞋子 !32 特大号!\n大头 ^`儿子`^ 和小头 ^^`爸爸`^^\n爱在~~西元前~~**当下**\n\n---\n\n## 标题设置\n\n**说明**\n\n- 在文字下方加 === 可使上一行文字变成一级标题\n- 在文字下方加 --- 可使上一行文字变成二级标题\n- 在行首加井号（#）表示不同级别的标题，例如：# H1, ##H2, ###H3\n\n---\n## 信息面板\n\n**说明**\n使用连续三个冒号`:::`和关键字（`[primary | info | warning | danger | success]`）来声明\n\n```markdown\n:::primary // [primary | info | warning | danger | success] 标题\n内容\n:::\n```\n\n**效果**\n:::p 标题\n内容\n:::\n:::success\n内容\n:::\n\n---\n\n## 手风琴\n\n**说明**\n使用连续三个加号`+++`和关键字（`[ + | - ]`）来声明，关键字`+`表示默认收起，关键字`-`表示默认展开\n\n```markdown\n+++ 点击展开更多\n内容\n++- 默认展开\n内容\n++ 默认收起\n内容\n+++\n```\n\n**效果**\n+++ 点击展开更多\n内容\n++- 默认展开\n内容\n++ 默认收起\n内容\n+++',
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


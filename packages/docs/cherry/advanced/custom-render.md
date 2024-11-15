# 自定义语法

    当已有的功能不能满足你需求的时候，那么你肯定想自己来实现解析markdown字符串进行自定义渲染。

## Cherry.createSyntaxHook(hookName, type, options)

- hookName: `string` 语法名
- type: `string` 语法类型
- `Cherry.constants.HOOKS_TYPE_LIST.SEN` 行内语法。
- `Cherry.constants.HOOKS_TYPE_LIST.PAR` 行内语法。
- options: `object` 自定义语法的主体逻辑。

## 简单例子

   自定义一个语法，识别形如 `***ABC***` 的内容，并将其替换成: `<span style="color: red"><strong>ABC</strong></span>`。

```ts
let CustomHookA = Cherry.createSyntaxHook('important', 
    Cherry.constants.HOOKS_TYPE_LIST.SEN, {
    makeHtml(str) {
        return str.replace(this.RULE.reg, function(whole, m1, m2) {
            return `<span style="color: red;"><strong>${m2}</strong></span>`;
        });
    },
    rule(str) {
        return { reg: /(\*\*\*)([^\*]+)\1/g };
    },
});
```

### 将这个语法配置到cherry配置中

```ts
new Cherry({
    id: 'markdow-container', 
    value: '## hello world', 
    fileUpload: myFileUpload,
    customSyntax: {
        importHook: {
            syntaxClass: CustomHookA, // 将自定义语法对象挂载到 importHook.syntaxClass上 //[!code ++]
            force: false, // true： 当cherry自带的语法中也有一个“importHook”时，用自定义的语法覆盖默认语法； false：不覆盖
            before: 'fontEmphasis', // 定义该自定义语法的执行顺序，当前例子表明在加粗/斜体语法前执行该自定义语法
        },
    },
    toolbars: {
        ...
    },
});
```

#### 效果如下图

![custom-render-1](/cherry/advanced/custom-render-1.png)

## 详细解析

### 原理

一言以蔽之，cherry的语法解析引擎就是将一堆正则按一定顺序依次执行，将markdown字符串替换为html字符串的工具。

### 语法分两类

- 行内语法: 即类似加粗、斜体、上下标等主要对文字样式进行控制的语法，最大的特点是可以相互嵌套。
- 段落语法，即类似表格、代码块、列表等主要对整段文本样式进行控制的语法。
  有两个特点:
  1. **可以在内部执行行内语法**
  2. **可以声明与其他段落语法互斥**

### 语法的组成

```ts
type createSyntaxHook={
    name?:string;
    beforeMakeHtml?:(str:string)=>any;
    makeHtml?:(str:string)=>any;
    afterMakeHtml?:(str:string)=>any;
    rule?:(str:string)=>{reg:Reg};
    needCache?:boolean;
}
```

1. `name`: 唯一的作用就是用来定义语法的执行顺序的时候按语法名排序。
2. `beforeMakeHtml()`: engine会最先按**语法正序**依次调用`beforeMakeHtml()`。
3. `makeHtml()`: engine会在调用完所有语法的`beforeMakeHtml()`后，再按**语法正序**依次调用`makeHtml()`。
4. `afterMakeHtml()`: engine会在调用完所有语法的`makeHtml()`后，再按**语法逆序**依次调用`afterMakeHtml()`。
5. `rule()`，用来定义语法的正则。
6. `needCache`: 用来声明是否需要“缓存”，只有段落语法支持这个变量，`true`：段落语法可以在`beforeMakeHtml()`、`makeHtml()`的时候利用`this.pushCache()`和`this.popCache()`实现排它的能力。

### 自带的语法

<br/>

#### 行内Hook

> 引擎会按当前顺序执行makeHtml()方法

- emoji 表情
- image 图片
- link 超链接
- autoLink 自动超链接（自动将符合超链接格式的字符串转换成`<a>`标签）
- fontEmphasis 加粗和斜体
- bgColor 字体背景色
- fontColor 字体颜色
- fontSize 字体大小
- sub 下标
- sup 上标
- ruby 一种表明上下排列的排版方式，典型应用就是文字上面加拼音
- strikethrough 删除线
- underline 下划线
- highLight 高亮（就是在文字外层包一个`<mark>`标签）

#### 段落级 Hook

> 引擎会按当前排序顺序执行beforeMake()、makeHtml()方法
> 引擎会按当前排序逆序执行afterMake()方法'

- codeBlock 代码块
- inlineCode 行内代码（因要实现排它特性，所以归类为段落语法）
- mathBlock 块级公式
- inlineMath 行内公式（理由同行内代码）
- htmlBlock html标签，主要作用为过滤白名单外的html标签
- footnote 脚注
- commentReference 超链接引用
- br 换行
- table 表格
- blockquote 引用
- toc 目录
- header 标题
- hr 分割线
- list有序列表、无序列表、checklist
- detail 手风琴
- panel 信息面板
- normalParagraph 普通段落

### 具体介绍

- 如果要实现一个**行内语法**，只需要了解以下三个概念
  1. 定义正则 `rule()`
  2. 定义具体的正则替换逻辑 `makeHtml()`
  3. 确定自定义语法名，并确定执行顺序

- 如果要实现一个**段落语法**，则需要在了解行内语法相关概念后再了解以下概念：
  1. 排它机制
  2. 局部渲染机制
  3. 编辑区和预览区同步滚动机制

## 一例胜千言

### 最简单段落语法

```ts
/**
 * 把 \n++\n XXX \n++\n 渲染成 <div>XXX</div>
 */
var myBlockHook = Cherry.createSyntaxHook('myBlock', Cherry.constants.HOOKS_TYPE_LIST.PAR, {
    makeHtml(str) {
        return str.replace(this.RULE.reg, function(whole, m1) {
            return `<div style="border: 1px solid;border-radius: 15px;background: gold;">${m1}</div>`;
        });
    },
    rule(str) {
        return { reg: /\n\+\+(\n[\s\S]+?\n)\+\+\n/g };
    },
});
...
new Cherry({
    ...
    customSyntax: {
        myBlock: {
            syntaxClass: myBlockHook,
            before: 'blockquote',
        },
    },
    ...
});
```

#### 效果如下

![custom-render-2](/cherry/advanced/custom-render-2.png)

#### 遇到问题1

当我们尝试进行段逻语法嵌套时，就会发现这样的问题：

- 问题1：代码块没有放进新语法里。
- 问题2：产生了一个多余的P标签。

![custom-render-3](/cherry/advanced/custom-render-3.png)

## 理解排它机制

为什么会有这样的问题，则需要先理解cherry的排他机制一言以蔽之，排他就是某个语法利用自己的“先发优势（如`beforeMakeHtml()`、`makeHtml()`）”把符合自己语法规则的内容先替换成**占位符**，
再利用自己的“后发优势（`afterMakeHtml()`）”将占位符**替换回**html内容。

#### 分析原因1

接下来解释上面出现的"bug"的原因：

1. 新语法（myBlockHook)并没有实现排他操作.
2. 在 **1** 的前提下，引擎先执行`codeBlock.makeHtml()`，再执行`myBlockHook.makeHtml()`，最后执行`normalParagraph.makeHtml()`（当然还执行了其他语法hook）。

   (**1**). 在执行`codeBlock.makeHtml()`后，源md内容变成了:
   ![custom-render-4](/cherry/advanced/custom-render-4.png)

   (**2**). 在执行`myBlockHook.makeHtml()`后，原内容变成了:
   ![custom-render-5](/cherry/advanced/custom-render-5.png)

   (**3**). 在执行`normalParagraph.makeHtml()`时,必须要先讲一下`normalParagraph.makeHtml()`的逻辑了，逻辑如下：
      1. normalParagraph认为任意两个同层级排他段落语法之间是**无关的**，所以其会按**段落语法占位符**分割文档，把文档分成若干段落，在本例子中，其把文章内容分成了 `<dev ...>src`、`~CodeBlock的占位符~`、`</div>`三块内容，至于为什么这么做，则涉及到了**局部渲染机制**，后续会介绍。
      2. normalParagraph在渲染各块内容时会利用[dompurify](https://github.com/cure53/DOMPurify)对内容进行html标签合法性处理，比如会检测到第一段内容div标签没有闭合，会将第一段内容变成`<dev ...>src</div>`这就出现了问题(**1**)，然后会判定第三段内容非法，直接把`</div>`删掉，这就出现了问题(**2**)。

#### 解决问题1

  如何解决上述“bug”呢，很简单，只要给myBlockHook实现排他就好了，实现代码如下：

```ts
/**
 * 把 \n++\n XXX \n++\n 渲染成 <div>XXX</div>
 */
var myBlockHook = Cherry.createSyntaxHook('myBlock', Cherry.constants.HOOKS_TYPE_LIST.PAR, {
    needCache: true, // 表明要使用缓存，也是实现排他的必要操作
    makeHtml(str) {
        const that = this;
        return str.replace(this.RULE.reg, function(whole, m1) {
          const result = `\n<div style="border: 1px solid;border-radius: 15px;background: gold;">${m1}</div>\n`;
            return that.pushCache(result); // 将结果转成占位符
        });
    },
    rule(str) {
        return { reg: /\n\+\+(\n[\s\S]+?\n)\+\+\n/g };
    },
});
```

#### 效果如下

![custom-render-6](/cherry/advanced/custom-render-6.png)

#### 遇到问题2

自定义语法没有被渲染出来。

## 理解局部渲染机制

  为什么自定义语法没有渲染出来，则需要了解cherry的局部渲染机制，首先看以下例子：

  ![custom-render-7](/cherry/advanced/custom-render-7.png)

  > 局部渲染的目的就是为了在文本量很大时提高性能，做的无非两件事：减少每个语法的执行次数（局部解析），减少预览区域dom的变更范围（局部渲染）。

  局部解析的机制与当前问题无关先按下不表，接下来解释局部渲染的实现机制：

  1. 段落语法根据md内容生成对应html内容时，会提取md内容的特征（md5），并将特征值放进段落标签的`data-sign`属性中
  2. 预览区会将已有段落的`data-sign`和引擎生成的新段落`data-sign`进行对比
      - 如果`data-sign`值没有变化，则认为当前段落内容没有变化
      - 如果段落内容有变化，则用新段落替换旧段落

#### 分析原因2

接下来解释上面出现的“bug”的原因：

1. 新语法（`myBlockHook`)输出的html标签里并没有`data-sign`属性
2. 预览区在拿到新的html内容时，会获取有`data-sign`属性的段落，并将其更新到预览区
3. 由于`myBlockHook`没有`data-sign`属性，但`codeBlock`有`data-sign`属性，所以只有代码块被渲染到了预览区

#### 解决问题2

如何解决上述“bug”呢，很简单，只要给myBlockHook实现排他就好了，实现代码如下：

```ts
/**
 * 把 \n++\n XXX \n++\n 渲染成 <div>XXX</div>
 */
var myBlockHook = Cherry.createSyntaxHook('myBlock', Cherry.constants.HOOKS_TYPE_LIST.PAR, {
    needCache: true, // 表明要使用缓存，也是实现排他的必要操作
    makeHtml(str) {
        const that = this;
        return str.replace(this.RULE.reg, function(whole, m1) {
            const sign = that.$engine.md5(whole); // 定义sign，用来实现局部渲染
            const lines = that.getLineCount(whole); // 定义行号，用来实现联动滚动
            const result = `\n<div data-sign="${sign}" data-lines="${lines}" style="border: 1px solid;border-radius: 15px;background: gold;">${m1}</div>\n`;
            return that.pushCache(result, sign, lines); // 将结果转成占位符
        });
    },
    rule(str) {
        return { reg: /\n\+\+(\n[\s\S]+?\n)\+\+\n/g };
    },
});
```

> 注：data-lines属性是用来实现编辑区和预览区联动滚动的

#### 效果如下

![custom-render-8](/cherry/advanced/custom-render-8.png)

#### 遇到问题3

新段落语法里的行内语法没有被渲染出来。

#### 解决问题3

段落语法的`makeHtml()`会传入**两个**参数（行内语法的只会传入**一个**参数），第二个参数是`sentenceMakeFunc`（行内语法渲染器）

```ts
/**
 * 把 \n++\n XXX \n++\n 渲染成 <div>XXX</div>
 */
var myBlockHook = Cherry.createSyntaxHook('myBlock', Cherry.constants.HOOKS_TYPE_LIST.PAR, {
    needCache: true, // 表明要使用缓存，也是实现排他的必要操作
    makeHtml(str, sentenceMakeFunc) {
        const that = this;
        return str.replace(this.RULE.reg, function(whole, m1) {
            // const sign = that.$engine.md5(whole); // 定义sign，用来实现局部渲染
            const lines = that.getLineCount(whole); // 定义行号，用来实现联动滚动
            const { sign, html } = sentenceMakeFunc(m1); // 解析行内语法
            const result = `\n<div data-sign="${sign}" data-lines="${lines}" style="border: 1px solid;border-radius: 15px;background: gold;">${html}</div>\n`;
            return that.pushCache(result, sign, lines); // 将结果转成占位符
        });
    },
    rule(str) {
        return { reg: /\n\+\+(\n[\s\S]+?\n)\+\+\n/g };
    },
});
```

## 总结

- 如果要实现一个**行内语法**，只需要实现以下三个功能
    1. 定义正则 rule()
    2. 定义具体的正则替换逻辑 makeHtml()
    3. 确定自定义语法名，并确定执行顺序
- 如果要实现一个**段落语法**，则需要在实现上面三个功能后，同时实现以下三个功能
    1. 排它机制 `needCache: true`
    2. 局部渲染机制 `data-sign`
    3. 编辑区和预览区同步滚动机制 `data-lines`

由于上面已有自定义行内语法的实现例子，接下来我们将通过实现一个**自定义段落语法**的例子来了解各个机制。

### 完整例子

```ts
/**
 * 自定义一个语法，识别形如 ***ABC*** 的内容，并将其替换成 <span style="color: red"><strong>ABC</strong></span>
 */
var CustomHookA = Cherry.createSyntaxHook('important', Cherry.constants.HOOKS_TYPE_LIST.SEN, {
    makeHtml(str) {
        return str.replace(this.RULE.reg, function(whole, m1, m2) {
            return `<span style="color: red;"><strong>${m2}</strong></span>`;
        });
    },
    rule(str) {
        return { reg: /(\*\*\*)([^\*]+)\1/g };
    },
});

/**
 * 把 \n++\n XXX \n++\n 渲染成 <div>XXX</div>
 */
var myBlockHook = Cherry.createSyntaxHook('myBlock', Cherry.constants.HOOKS_TYPE_LIST.PAR, {
    needCache: true, // 表明要使用缓存，也是实现排他的必要操作
    makeHtml(str, sentenceMakeFunc) {
        const that = this;
        return str.replace(this.RULE.reg, function(whole, m1) {
            // const sign = that.$engine.md5(whole); // 定义sign，用来实现局部渲染
            const lines = that.getLineCount(whole); // 定义行号，用来实现联动滚动
            const { sign, html } = sentenceMakeFunc(m1); // 解析行内语法
            const result = `\n<div data-sign="${sign}" data-lines="${lines}" style="border: 1px solid;border-radius: 15px;background: gold;">${html}</div>\n`;
            return that.pushCache(result, sign, lines); // 将结果转成占位符
        });
    },
    rule(str) {
        return { reg: /\n\+\+(\n[\s\S]+?\n)\+\+\n/g };
    },
});

new Cherry({
    id: 'markdown-container', 
    value: '## hello world', 
    fileUpload: myFileUpload,
    customSyntax: {
        importHook: {
            syntaxClass: CustomHookA, // 将自定义语法对象挂载到 importHook.syntaxClass上
            force: false, // true： 当cherry自带的语法中也有一个“importHook”时，用自定义的语法覆盖默认语法； false：不覆盖
            before: 'fontEmphasis', // 定义该自定义语法的执行顺序，当前例子表明在加粗/斜体语法前执行该自定义语法
        },
        myBlock: {
            syntaxClass: myBlockHook,
            force: true,
            before: 'blockquote',
        },
    },
    toolbars: {
        ...
    },
});

```

### 最终效果如下

![custom-render-9](/cherry/advanced/custom-render-9.png)

# 自定义语法

sunsonliu edited this page on Apr 16 · [10 revisions](https://github.com/Tencent/cherry-markdown/wiki/自定义语法/_history)

## 简单例子



通过一个例子来了解cherry的自定义语法机制，如下：

**定义一个自定义语法**

```
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

...
/**
 * @param {string} hookName 语法名
 * @param {string} type 语法类型，行内语法为Cherry.constants.HOOKS_TYPE_LIST.SEN，段落语法为Cherry.constants.HOOKS_TYPE_LIST.PAR
 * @param {object} options 自定义语法的主体逻辑
 */
Cherry.createSyntaxHook(hookName, type, options)
```



**将这个语法配置到cherry配置中**：

```
new Cherry({
    id: 'markdown-container', 
    value: '## hello world', 
    fileUpload: myFileUpload,
    engine: {
        customSyntax: {
            importHook: {
                syntaxClass: CustomHookA, // 将自定义语法对象挂载到 importHook.syntaxClass上
                force: false, // true： 当cherry自带的语法中也有一个“importHook”时，用自定义的语法覆盖默认语法； false：不覆盖
                before: 'fontEmphasis', // 定义该自定义语法的执行顺序，当前例子表明在加粗/斜体语法前执行该自定义语法
            },
        },
    },
    toolbars: {
        ...
    },
});
```



**效果如下图：** ![image](https://private-user-images.githubusercontent.com/998441/276579544-66a99621-ee1c-4a46-99d2-35f25c1e132f.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjIzNTg2NjYsIm5iZiI6MTc2MjM1ODM2NiwicGF0aCI6Ii85OTg0NDEvMjc2NTc5NTQ0LTY2YTk5NjIxLWVlMWMtNGE0Ni05OWQyLTM1ZjI1YzFlMTMyZi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMTA1JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTEwNVQxNTU5MjZaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0yNDZkYzVkMmFiY2UwZjYwZDE5NDA1Y2I4ZjcwMDQ1YmNlMDM5NDdlMjc5NmQzYzU1OGIxYjZmMDZhYzAwOWJkJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.fpnxl4Wj4SbUyZ1whg9ChsObdeuxbL9D9d9W395CVCU)

------

## 详细解释



**原理**

一言以蔽之，cherry的语法解析引擎就是将一堆**正则**按一定**顺序**依次执行，将markdown字符串替换为html字符串的工具。

**语法分两类**

1. 行内语法，即类似加粗、斜体、上下标等主要对文字样式进行控制的语法，最大的特点是可以相互嵌套
2. 段落语法，即类似表格、代码块、列表等主要对整段文本样式进行控制的语法，有两个特点：
   1. 可以在内部执行行内语法
   2. 可以声明与其他段落语法互斥

**语法的组成**

1. 语法名，唯一的作用就是用来定义语法的执行顺序的时候按语法名排序
2. beforeMakeHtml()，engine会最先按**语法正序**依次调用beforeMakeHtml()
3. makeHtml()，engine会在调用完所有语法的beforeMakeHtml()后，再按**语法正序**依次调用makeHtml()
4. afterMakeHtml()，engine会在调用完所有语法的makeHtml()后，再按**语法逆序**依次调用afterMakeHtml()
5. rule()，用来定义语法的正则
6. needCache，用来声明是否需要“缓存”，只有段落语法支持这个变量，true：段落语法可以在beforeMakeHtml()、makeHtml()的时候利用`this.pushCache()`和`this.popCache()`实现排它的能力

> 这些东西都是干啥用的？继续往下看，我们会用一个实际的例子介绍上述各功能属性的作用

**自带的语法**

- 行内Hook

  引擎会按当前顺序执行makeHtml方法

  - emoji 表情
  - image 图片
  - link 超链接
  - autoLink 自动超链接（自动将符合超链接格式的字符串转换成标签）
  - fontEmphasis 加粗和斜体
  - bgColor 字体背景色
  - fontColor 字体颜色
  - fontSize 字体大小
  - sub 下标
  - sup 上标
  - ruby 一种表明上下排列的排版方式，典型应用就是文字上面加拼音
  - strikethrough 删除线
  - underline 下划线
  - highLight 高亮（就是在文字外层包一个标签）

- 段落级 Hook

  引擎会按当前排序顺序执行beforeMake、makeHtml方法

  引擎会按当前排序逆序执行afterMake方法

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
  - list 有序列表、无序列表、checklist
  - detail 手风琴
  - panel 信息面板
  - normalParagraph 普通段落

**具体介绍**

- 如果要实现一个

  行内语法

  ，只需要了解以下三个概念

  1. 定义正则 rule()
  2. 定义具体的正则替换逻辑 makeHtml()
  3. 确定自定义语法名，并确定执行顺序

- 如果要实现一个

  段落语法

  ，则需要在了解行内语法相关概念后再了解以下概念：

  1. 排它机制
  2. 局部渲染机制
  3. 编辑区和预览区同步滚动机制

由于上面已有自定义行内语法的实现例子，接下来我们将通过实现一个**自定义段落语法**的例子来了解各个机制

------

## 一例胜千言



**最简单段落语法**

```
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



**效果如下**

![image](https://private-user-images.githubusercontent.com/998441/279918022-48b57bb2-4a18-434a-a7b9-3ec1a46d264b.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjIzNTg2NjYsIm5iZiI6MTc2MjM1ODM2NiwicGF0aCI6Ii85OTg0NDEvMjc5OTE4MDIyLTQ4YjU3YmIyLTRhMTgtNDM0YS1hN2I5LTNlYzFhNDZkMjY0Yi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMTA1JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTEwNVQxNTU5MjZaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0xN2I5M2M1OTZlNmJkMGJhMDQ4MjhkMTM1OWZhNTIzZjk2NTY5NjljMDNhMjZiZjgxOTkxN2EzN2Y4NGVkMjYzJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.GbYllAzvfsL-IKfbqAQqasRMd100Rh6rrfQx0ITUnt4)

**遇到问题**

当我们尝试进行段逻语法嵌套时，就会发现这样的问题：

1. **问题1**：代码块没有放进新语法里
2. **问题2**：产生了一个多余的P标签 ![image](https://private-user-images.githubusercontent.com/998441/281294040-61db32f1-cced-46f3-a286-491f4c049c54.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjIzNTg2NjYsIm5iZiI6MTc2MjM1ODM2NiwicGF0aCI6Ii85OTg0NDEvMjgxMjk0MDQwLTYxZGIzMmYxLWNjZWQtNDZmMy1hMjg2LTQ5MWY0YzA0OWM1NC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMTA1JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTEwNVQxNTU5MjZaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT00MjU0NmNhMWRmYWM5YzllODI4NmJiMzdiODAzYTY2NDkwNWNmMzRiMWViMzg4ZTRiZmY3N2NlN2NkOGI1YTQ1JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.9CnYeq4fDWueWnqSVfniazw5KZODktSJ1vQLG29G-jw)

### 理解排它机制



为什么会有这样的问题，则需要先理解cherry的排他机制 一言以蔽之，排他就是某个语法利用自己的“先发优势（如`beforeMakeHtml`、`makeHtml`）”把符合自己语法规则的内容先替换成**占位符**，再利用自己的“后发优势（`afterMakeHtml`）”将占位符**替换回**html内容

**分析原因**

接下来解释上面出现的“bug”的原因：

1. 新语法（`myBlockHook`)并没有实现排他操作

2. 在1）的前提下，引擎先执行

   ```
   codeBlock.makeHtml()
   ```

   ，再执行

   ```
   myBlockHook.makeHtml()
   ```

   ，最后执行

   ```
   normalParagraph.makeHtml()
   ```

   （当然还执行了其他语法hook）

   1. 在执行`codeBlock.makeHtml()`后，源md内容变成了
      ![image](https://private-user-images.githubusercontent.com/998441/281329034-091cb59e-e3f1-45e8-9278-cd2aa4e7f644.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjIzNTg2NjYsIm5iZiI6MTc2MjM1ODM2NiwicGF0aCI6Ii85OTg0NDEvMjgxMzI5MDM0LTA5MWNiNTllLWUzZjEtNDVlOC05Mjc4LWNkMmFhNGU3ZjY0NC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMTA1JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTEwNVQxNTU5MjZaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1iNTY0NjhhMDg2MmM2NDg5NmIyZTIwZTBmZTgxNWM0OTM5NTE5NjQ0ZDJjZjRlYzZhZDRkMjVhODdiYWYwYTVlJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.-0RRd22rmpyrBHgB695v5z_UGzMZwCKgHISGLXlf-D0)

   2. 在执行`myBlockHook.makeHtml()`后，原内容变成了
      ![image](https://private-user-images.githubusercontent.com/998441/281329385-59e3f0ae-92b8-43f0-bc74-6e24405a92a8.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjIzNTg2NjYsIm5iZiI6MTc2MjM1ODM2NiwicGF0aCI6Ii85OTg0NDEvMjgxMzI5Mzg1LTU5ZTNmMGFlLTkyYjgtNDNmMC1iYzc0LTZlMjQ0MDVhOTJhOC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMTA1JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTEwNVQxNTU5MjZaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1iMTE5NTJhNzc3MDVmODA1YWVlYmI4MDQzOTFmNGJmM2ZjMWZhN2ZkNWFiZTBiODJjNjBlYTc0ZTIxMmZkNzNjJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.tTfU0pq652rmFG62PeZIgvTR8YAqByQXwzsk9pCHl2M)

   3. 在执行

      ```
      normalParagraph.makeHtml()
      ```

      时，必须要先讲一下

      ```
      normalParagraph.makeHtml()
      ```

      的逻辑了，逻辑如下：

      - normalParagraph认为任意两个同层级排他段落语法之间是**无关的**，所以其会按**段落语法占位符**分割文档，把文档分成若干段落，在本例子中，其把文章内容分成了 `<dev ...>src`、`~CodeBlock的占位符~`、`</div>`三块内容，至于为什么这么做，则涉及到了**局部渲染机制**，后续会介绍
      - normalParagraph在渲染各块内容时会利用[dompurify](https://github.com/cure53/DOMPurify)对内容进行html标签合法性处理，比如会检测到第一段内容div标签没有闭合，会将第一段内容变成`<dev ...>src</div>`这就出现了**问题1**，然后会判定第三段内容非法，直接把`</div>`删掉，这就出现了**问题2**

**解决问题**

如何解决上述“bug”呢，很简单，只要给myBlockHook实现排他就好了，实现代码如下：

```
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



**效果如下**

![image](https://private-user-images.githubusercontent.com/998441/281594648-98149a7f-7462-4621-a15c-3179c6fd323c.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjIzNTg2NjYsIm5iZiI6MTc2MjM1ODM2NiwicGF0aCI6Ii85OTg0NDEvMjgxNTk0NjQ4LTk4MTQ5YTdmLTc0NjItNDYyMS1hMTVjLTMxNzljNmZkMzIzYy5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMTA1JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTEwNVQxNTU5MjZaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0wMjliYTNjM2MwZTBmODk5MTY3ZTI2ZTlhNjE3MDE4MmM4ZDgyZTRlMTQwZTg4Zjc3ZDFlZjA4MjRmNjQ3ZGFjJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.DQTHFt0oaV9RqqG0rP3kiDN11uLjTZuFcnYHN8NKSXw)

**遇到问题**

自定义语法没有被渲染出来

### 理解局部渲染机制



为什么自定义语法没有渲染出来，则需要了解cherry的局部渲染机制，首先看以下例子： ![image](https://private-user-images.githubusercontent.com/998441/281605200-8fd27a4d-aa69-47b1-8c1a-1aa573a3eb4f.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjIzNTg2NjYsIm5iZiI6MTc2MjM1ODM2NiwicGF0aCI6Ii85OTg0NDEvMjgxNjA1MjAwLThmZDI3YTRkLWFhNjktNDdiMS04YzFhLTFhYTU3M2EzZWI0Zi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMTA1JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTEwNVQxNTU5MjZaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT02YWM4OWI1Y2RiM2I3YmYxODI0YTAzYTI5ZWZkNjMzOWNlN2IxYmUxM2E5ZTRiZDJkMzRmZjM2Y2JlOWRkODNjJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.xVOgMaTjwQhLUBggLcSml7KrhabDRqHmp2eEoSGpn2M)

> 局部渲染的目的就是为了在**文本量很大**时**提高性能**，做的无非两件事：减少每个语法的**执行次数**（局部解析），减少预览区域dom的**变更范围**（局部渲染）。

局部解析的机制与当前问题无关先按下不表，接下来解释局部渲染的实现机制：

1. 段落语法根据md内容生成对应html内容时，会提取md内容的特征（md5），并将特征值放进段落标签的`data-sign`属性中

2. 预览区会将已有段落的

   ```
   data-sign
   ```

   和引擎生成的新段落

   ```
   data-sign
   ```

   进行对比

   - 如果`data-sign`值没有变化，则认为当前段落内容没有变化
   - 如果段落内容有变化，则用新段落替换旧段落

**分析原因**

接下来解释上面出现的“bug”的原因：

1. 新语法（`myBlockHook`)输出的html标签里并没有`data-sign`属性
2. 预览区在拿到新的html内容时，会获取有`data-sign`属性的段落，并将其更新到预览区
3. 由于`myBlockHook`没有`data-sign`属性，但`codeBlock`有`data-sign`属性，所以只有代码块被渲染到了预览区

**解决问题**

如何解决上述“bug”呢，很简单，只要给myBlockHook增加`data-sign`属性就好了，实现代码如下：

```
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



> 注：`data-lines`属性是用来实现编辑区和预览区联动滚动的

**效果如下**

![image](https://private-user-images.githubusercontent.com/998441/281996643-b2f9d90a-91c4-4bb2-a79d-24b903ef5ace.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjIzNTg2NjYsIm5iZiI6MTc2MjM1ODM2NiwicGF0aCI6Ii85OTg0NDEvMjgxOTk2NjQzLWIyZjlkOTBhLTkxYzQtNGJiMi1hNzlkLTI0YjkwM2VmNWFjZS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMTA1JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTEwNVQxNTU5MjZaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT02ZWQwZWMzN2NhZmRmMzE5YjY3MzMyZDllMjVmZGI4ZTllNDI3YWJkNDNhYzA2ZGU1MDE5Y2YyZDlhN2RjOWI4JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.rjiZb4DmVBlk0c_KixG9F4Aio3vvMykEuKLqePCQEHQ)

**遇到问题**

新段落语法里的行内语法没有被渲染出来

**解决问题**

段落语法的`makeHtml()`会传入**两个**参数（行内语法的只会传入**一个**参数），第二个参数是`sentenceMakeFunc`（行内语法渲染器）

```
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



------

### 总结



- 如果要实现一个

  行内语法

  ，只需要实现以下三个功能

  1. 定义正则 rule()
  2. 定义具体的正则替换逻辑 makeHtml()
  3. 确定自定义语法名，并确定执行顺序

- 如果要实现一个

  段落语法

  ，则需要在实现上面三个功能后，同时实现以下三个功能

  1. 排它机制 `needCache: true`
  2. 局部渲染机制 `data-sign`
  3. 编辑区和预览区同步滚动机制 `data-lines`

**完整例子**：

```
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
    engine: {
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
    },
    toolbars: {
        ...
    },
});
```



**效果如下**

![image](https://private-user-images.githubusercontent.com/998441/281998420-fe3feb0b-2791-460f-9ab7-e04f076ce388.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjIzNTg2NjYsIm5iZiI6MTc2MjM1ODM2NiwicGF0aCI6Ii85OTg0NDEvMjgxOTk4NDIwLWZlM2ZlYjBiLTI3OTEtNDYwZi05YWI3LWUwNGYwNzZjZTM4OC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMTA1JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTEwNVQxNTU5MjZaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT04MjExMjljMjg0MmI1MTM3YjllZjQ1ZmU4NDk3YWU3M2E5ZjBkOTdjMDk2YzQzY2E1OGExMTA4NzQ5MDZmN2NmJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.np3DxOgYNmtV7s_sJoh63VDdMBrXpPq9l7sbGvIJ5Gg)

## 特殊情况



因为要实现**排他性**，所以需要声明自定义语法为**段落语法**，但实际这个语法是**行内语法**，所以需要**特殊处理**。

主要操作就是在调用`pushCache`的时候，第二个参数前面加上`!`前缀，这样cherry就会按照行内语法进行渲染

```
/**
 * 把 ++\n XXX \n++ 渲染成 <custom-node>XXX</custom-node>，并且排他
 */
var myBlockHook = Cherry.createSyntaxHook('myBlock', Cherry.constants.HOOKS_TYPE_LIST.PAR, {
    needCache: true, // 表明要使用缓存，也是实现排他的必要操作
    makeHtml(str, sentenceMakeFunc) {
        const that = this;
        return str.replace(this.RULE.reg, function(whole, m1) {
            // const sign = that.$engine.md5(whole); // 定义sign，用来实现局部渲染
            const lines = that.getLineCount(whole); // 定义行号，用来实现联动滚动
            const { sign, html } = sentenceMakeFunc(m1); // 解析行内语法
            const result = `<custom-node data-sign="${sign}" data-lines="${lines}" style="border: 1px solid;border-radius: 15px;background: gold;">${html}</custom-node>`;
            // pushCache的第二个参数是sign，因为是行内语法，所以需要加一个前缀!
            return that.pushCache(result, `!${sign}`, lines); // 将结果转成占位符
        });
    },
    rule(str) {
        return { reg: /\+\+(\n[\s\S]+?\n)\+\+/g };
    },
});
```



**效果如下**:

![image](https://private-user-images.githubusercontent.com/998441/434295761-fad1ae9a-0b3b-4f03-af95-617b50aa65d7.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjIzNTg2NjYsIm5iZiI6MTc2MjM1ODM2NiwicGF0aCI6Ii85OTg0NDEvNDM0Mjk1NzYxLWZhZDFhZTlhLTBiM2ItNGYwMy1hZjk1LTYxN2I1MGFhNjVkNy5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMTA1JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTEwNVQxNTU5MjZaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1iYTkyYmM4ZGQ0NjQyZTA0NWM0ZmI0YThjMGMyZmNmOTljYjhmNjljMTE1ZWI5YmM0YzNhODliM2VjNWM2Mzg2JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9._Fs_A6srpVUKmhSE-ew8JeQ3-12I8Hl_WEUx95vbxQg)

##### 
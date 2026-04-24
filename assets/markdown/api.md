# 例子
> [Github 地址](https://github.com/Tencent/cherry-markdown){target=_blank}

- [basic](index.html){target=_blank}
- [H5](h5.html){target=_blank}
- [多实例](multiple.html){target=_blank}
- [无 toolbar](notoolbar.html){target=_blank}
- [纯预览模式](preview_only.html){target=_blank}
- [注入](xss.html){target=_blank}
- [API](api.html){target=_blank}
- [图片所见即所得编辑尺寸](img.html){target=_blank}
- [标题自动序号](head_num.html){target=_blank}

# Cherry API


## setMarkdown(val:string)
设置内容

## insert(content:string)
在光标处或者指定行+偏移量插入内容
>insert(\`content\`, \`isSelect\`, \`anchor\`, \`focus\`)
- \`content\` 被插入的文本
- \`isSelect\` 是否选中刚插入的内容，默认false，不选中
- \`anchor\` [x,y] 代表x+1行，y+1字符偏移量，默认false 会从光标处插入
- \`focus\` 保持编辑器处于focus状态，默认true，选中编辑器（用户可以继续输入）

## getMarkdown()
获取markdown内容

## getHtml()
获取渲染后的html内容

## switchModel(model:string)
切换模式：{'edit&amp;preview'|'editOnly'|'previewOnly'}

## getToc()
获取由标题组成的目录

## getCodeMirror()
获取左侧编辑器实例

## getPreviewer()
获取右侧预览区对象实例

-----

# Cherry.engine API


## engine.makeHtml(markdown:string)
将markdown字符串渲染成Html

## engine.makeMarkdown(html:string)
将html字符串渲染成markdown

-----

# Cherry.toolbar.toolbarHandlers API


## toolbar.toolbarHandlers.bold()
向cherry编辑器中插入加粗语法
 
## toolbar.toolbarHandlers.italic()
向cherry编辑器中插入斜体语法
 
## toolbar.toolbarHandlers.header(level:int)
向cherry编辑器中插入标题语法
 
## toolbar.toolbarHandlers.strikethrough()
向cherry编辑器中插入删除线语法
 
## toolbar.toolbarHandlers.list(type:string)
向cherry编辑器中插入有序、无序列表或者checklist语法

|level |效果 |
|:-:|:-:|
|'1' |ol 列表 |
|'2' |ul 列表 |
|'3' |checklist |


## toolbar.toolbarHandlers.insert(type:string)
向cherry编辑器中插入特定语法：
|type |效果 |
|:-:|:-:|
|'hr' |删除线 |
|'br' |强制换行 |
|'code' |代码块 |
|'formula' |行内公式 |
|'checklist' |检查项 |
|'toc' |目录 |
|'link' |超链接 |
|'image' |图片 |
|'video' |视频 |
|'audio' |音频 |
|'normal-table' |插入3行5列的表格 |
|'normal-table-row*col' |如 \`normal-table-2*4\` 插入2行(包含表头是3行)4列的表格 |


## toolbar.toolbarHandlers.graph(type:string)
向cherry编辑器中插入画图语法

|id |效果 |
|:-:|:-:|
|'1' |流程图 |
|'2' |时序图 |
|'3' |状态图 |
|'4' |类图 |
|'5' |饼图 |
|'6' |甘特图 |



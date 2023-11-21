# 语法特性

 支持了所有常用的、通用的语法，除此之外我们还支持了一些有意思的语法。

## 特性 1：图片缩放、对齐、引用

### 语法

> 其中，`宽度`、`高度`支持：绝对像素值（比如200px）、相对外层容器百分比（比如50%），
`对齐方式`候选值有：左对齐（缺省）、右对齐（right）、居中（center）、悬浮左、右对齐（float-left/right）
![图片尺寸](/example/images/feature_image_size.png)



## 特性 2：根据表格内容生成图表<Badge type="danger" text="暂无开源" />

![表格图表](/example/images/feature_table_chart.png)



## 特性 3：字体颜色、字体大小

![字体样式](/example/images/feature_font.png)


## 功能特性

### 特性 1：复制Html粘贴成MD语法

![html转md](/example/images/feature_copy.gif)

#### 使用场景

- Markdown初学者快速熟悉MD语法的一个途径
- 为调用方提供一个历史富文本数据迁成Markdown数据的方法


### 特性 2：经典换行&常规换行

![br](/example/images/feature_br.gif)

#### 使用场景

团队对markdown源码有最大宽度限制？一键切回经典换行（两个及以上连续换行才算一个换行）


### 特性 3: 多光标编辑

![br](/example/images/feature_cursor.gif)

#### 使用场景

想要批量修改？可以试试多光标编辑（快捷键、搜索多光标选中等功能正在开发中）

### 特性 4：图片尺寸

![wysiwyg](/example/images/feature_image_wysiwyg.gif)

### 特性 5：表格编辑

![wysiwyg](/example/images/feature_table_wysiwyg.gif)

### 特性 6：导出

![wysiwyg](/example/images/feature_export.png)


## 性能特性

### 局部渲染

> CherryMarkdown会判断用户到底变更了哪个段落，做到只渲染变更的段落，从而提升修改时的渲染性能

![wysiwyg](/example/images/feature_myers.png)

### 局部更新

> CherryMarkdown利用virtual dom机制实现对预览区域需要变更的内容进行局部更新的功能，从而减少了浏览器Dom操作，提高了修改时预览内容更新的性能

![wysiwyg](/example/images/feature_vdom.gif)

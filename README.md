<p align="center"><img src="logo/logo--color.svg" alt="cherry logo" width="50%"/></p>

# Cherry Markdown Editor

在线体验 demo **敬请期待**

## 如何使用

使用文档请参考 **敬请期待**

## 如何开发

```bash
# install dependencies
yarn install
# or
npm install

# watch changes for development
# visit example page at http://localhost:8000/examples/index.html
npm run dev

# build for development
npm run build:debug

# build for production
npm run build

# lint
npm run lint
# or with --fix option
npm run lint --fix
```

## Changelog

[查看最新的优化与修复点](./CHANGELOG.md)

## 部分特性展示

### 特性 1：复制 Html 粘贴成 MD 语法

#### 使用场景

- Markdown 初学者快速熟悉 MD 语法的一个途径
- 为调用方提供一个历史富文本数据迁成 Markdown 数据的方法

#### 效果

**敬请期待**

---

### 特性 2：图片缩放、对齐、引用

#### 语法

`![img #宽度#高度#对齐方式][图片URL或引用]`

> 其中，`宽度`、`高度`支持：绝对像素值（比如 200px）、相对外层容器百分比（比如 50%），
> `对齐方式`候选值有：左对齐（缺省）、右对齐（right）、居中（center）、悬浮左、右对齐（float-left/right）

#### 效果

**敬请期待**

---

### 特性 3：根据表格内容生成图表

> 注：本特性需要引入`echarts`

#### 效果

**敬请期待**

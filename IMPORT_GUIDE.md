# Cherry Markdown 导入指南

## 推荐方式

### 使用 Stream 版本（纯净化渲染）
```javascript
import {stream} from 'cherry-markdown/dist/cherry-markdown.stream';
// 或
import CherryStream from 'cherry-markdown/dist/cherry-markdown.stream';
```

**优点**：
- ✅ 已排除 mermaid、codemirror、echarts
- ✅ 体积更小
- ✅ 配置简单，不会有 tree-shaking 问题
- ✅ 纯净的流式渲染功能

### 使用完整版本（带所有功能）
```javascript
import Cherry from 'cherry-markdown';
```

**包含**：
- Cherry 编辑器（含默认 mermaid 初始化）
- 所有插件（mermaid、echarts、plantuml 等）
- 完整的编辑器功能

## 不推荐

### ❌ 从主入口按需导入
```javascript
// 不推荐：会有 tree-shaking 问题
import {stream} from 'cherry-markdown';
import {core} from 'cherry-markdown';
```

**问题**：
- Tree-shaking 配置复杂
- 可能缺少必要的依赖（echarts、crypto-js、Prism.js 等）
- 容易出现运行时错误

## 常见问题

### Q: 为什么 `import {stream} from 'cherry-markdown'` 会有问题？
A: 主入口包含了太多功能和依赖，tree-shaking 难以完美处理所有边界情况。使用专门打包的版本更稳定。

### Q: 如何在完整版本中使用 mermaid？
A:
```javascript
import Cherry from 'cherry-markdown';

// 使用默认的 mermaid 初始化（已内置）
const cherry = new Cherry({});

// 或手动初始化
import {MermaidPlugin} from 'cherry-markdown';
Cherry.usePlugin(MermaidPlugin, {
  mermaid,
  mermaidAPI: mermaid?.mermaidAPI,
  theme: 'default',
});
```

### Q: 如何使用 stream 版本但需要某些功能？
A: 手动导入需要的插件：
```javascript
import {stream, MermaidPlugin} from 'cherry-markdown';
stream.usePlugin(MermaidPlugin, {...});
```

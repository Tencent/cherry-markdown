# 测试目录结构说明

## 目录结构

```
test/
├── setup.ts                    # 全局测试设置（mock 浏览器 API）
│
├── __mocks__/                  # Mock 文件目录
│   └── codemirror.mock.ts      # CodeMirror 编辑器 Mock
│
├── unit/                       # 单元测试
│   ├── codemirror/             # CodeMirror 相关测试（编辑器升级专项）
│   │   ├── Editor.spec.ts      # 编辑器核心功能测试
│   │   ├── selection.spec.ts   # 选区操作测试
│   │   ├── shortcutKey.spec.ts # 快捷键功能测试
│   │   └── autoindent.spec.ts  # 列表自动缩进测试
│   │
│   └── utils/                  # 纯工具函数测试
│       └── regexp.spec.ts      # 正则表达式测试
│
├── core/                       # 核心渲染引擎测试
│   ├── CommonMark.spec.ts      # CommonMark 规范兼容性测试
│   └── hooks/                  # Hooks 语法扩展测试
│       ├── AutoLink.spec.ts    # 自动链接测试
│       └── List.spec.ts        # 列表语法测试
│
├── suites/                     # 测试数据/测试套件
│   └── commonmark.spec.json    # CommonMark 测试用例数据
│
├── example.md                  # 示例 Markdown 文件
└── node.js                     # Node 环境测试
```

## 目录说明

### `__mocks__/`
存放所有 Mock 文件，用于模拟外部依赖。

- `codemirror.mock.ts` - 模拟 CodeMirror 5 编辑器实例，包含文档操作、光标操作、选区操作等核心 API

### `unit/`
单元测试目录，按功能模块划分：

- **`codemirror/`** - CodeMirror 编辑器相关的单元测试
  - 这些测试记录了 CodeMirror 5 的行为特征
  - 用于编辑器升级时的回归测试，确保功能一致性
  
- **`utils/`** - 纯工具函数的单元测试
  - 不依赖 DOM 或编辑器环境
  - 测试独立的工具函数

### `core/`
核心渲染引擎测试：

- `CommonMark.spec.ts` - 验证 Markdown 解析是否符合 CommonMark 规范
- `hooks/` - 语法扩展钩子的测试

### `suites/`
测试数据目录，存放大型测试用例数据集。

## 运行测试

```bash
# 运行所有测试
yarn workspace cherry-markdown test

# 运行特定目录的测试
yarn workspace cherry-markdown test test/unit/codemirror

# 运行单个测试文件
yarn workspace cherry-markdown test test/unit/codemirror/selection.spec.ts
```

## 命名规范

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| 单元测试 | `{模块名}.spec.ts` | `selection.spec.ts` |
| Mock 文件 | `{模块名}.mock.ts` | `codemirror.mock.ts` |
| 测试数据 | `{用途}.spec.json` | `commonmark.spec.json` |

## 编写测试指南

### 测试描述格式
```typescript
describe('模块名 - 函数名', () => {
  describe('场景分类', () => {
    it('应该 xxx', () => {
      // 测试代码
    });
  });
});
```

### 添加新测试
1. 根据被测模块类型选择目录：
   - 编辑器相关 → `unit/codemirror/`
   - 工具函数 → `unit/utils/`
   - 渲染引擎 → `core/`
2. 遵循命名规范创建测试文件
3. 使用相对路径导入被测模块（避免 `@/` 别名）

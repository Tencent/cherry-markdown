# 为核心Hooks添加单元测试，提升测试覆盖率 #1492

**状态：** 🟢 Open  
**作者：** mikoto0418  
**分支：** `mikoto0418/tests/coverage-improvement`  
**目标分支：** `ftcnext/dev`  

---

## 📄 概要

为核心 Hooks 添加单元测试以提升测试覆盖率。

### 修复 Table.ts 中的类型错误
- 调整 `Table` 类声明，使 `Type` 参数支持传入 `ParsedScript` 结构体。

### 主要变更点
1. 修复类型声明问题。
2. 为 `core/hooks/codeblock` 增加单元测试覆盖。
3. 补充测试场景包括：语言标识、缩进、空行、Tab 等。

### 文件修改
- `packages/cherry-markdown/src/core/hooks/Table.ts`
- `tests/core/hooks/Codeblock.spec.ts`

---

## 🧩 代码变更

### packages/cherry-markdown/src/core/hooks/Table.ts
```diff
-  export default class Table extends ParagraphBase {
+  export default class Table extends ParagraphBase {
+    public rule: RegExp;
+    public tableRuleWithScript: RegExp;
+    public tableRuleWithoutScript: RegExp;
+
+    constructor() {
+      super();
+      this.tableRuleWithScript = /\|/;
+      this.tableRuleWithoutScript = /\|/;
+    }
+
+    parseTable(value: string): any {
+      return parseTable(value);
+    }
+  }
```

---

## 🧪 测试文件：`tests/core/hooks/Codeblock.spec.ts`

文件新增了多个测试用例，用于验证代码块解析逻辑：

| 测试描述 | 状态 |
|-----------|------|
| should parse fenced code blocks | ❌ 失败 |
| should handle code block with language specified | ❌ 失败 |
| should handle code block without language | ❌ 失败 |
| should preserve code content | ❌ 失败 |
| should handle code block with special characters | ❌ 失败 |
| should handle code block with line numbers | ❌ 失败 |
| should handle indented code blocks | ❌ 失败 |
| should handle code block with tabs | ❌ 失败 |
| should handle code block with empty lines | ❌ 失败 |

---

## ❌ 错误日志示例

### 错误类型 1：返回值为 undefined
```
TypeError: .toMatch() expects to receive a string, but got undefined
```

### 错误类型 2：断言参数无效
```
AssertionError: The given combination of arguments (undefined and string) is invalid for this assertion.
```

### 错误类型 3：内容不匹配
```
expect(received).toContain(expected)
```

---

## 🧠 建议与后续优化方向

- 检查 `CodeBlockHook` 导出是否正确。
- 确保测试调用的钩子函数签名匹配实际实现。
- 增加输入边界值与异常分支测试。
- 可引入 `jest.spyOn` 模拟钩子内部依赖。

---

**提交者：** mikoto0418  
**提交时间：** 昨日  
**Commit:** `915c4b4a`

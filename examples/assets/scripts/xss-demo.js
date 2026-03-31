/**
 * XSS 白名单对比演示配置
 *
 * 用两个 Cherry 实例展示 htmlWhiteList 配置的效果差异：
 * - 实例1（默认模式）：不配置 htmlWhiteList，HTML 标签被 DOMPurify 过滤
 * - 实例2（白名单模式）：配置 htmlWhiteList: 'iframe|style'，允许渲染指定 HTML 标签
 *
 * 安全说明：
 * - 演示内容仅使用 <style> 和 <iframe> 标签，不包含 <script>
 * - iframe 仅嵌入 about:blank，不加载任何外部资源
 * - style 使用 #markdown-whitelist 限定作用域，不会污染其他实例
 * - 所有演示内容都是视觉效果展示，不会执行任何攻击代码
 */

/**
 * 生成演示用 markdown 内容
 * @param {string} instanceId - Cherry 实例容器 ID，用于限定 <style> 作用域
 */
function createXssDemoMarkdown(instanceClass) {
  return `\
# htmlWhiteList 效果演示

---

## 1. \`<style>\` 标签测试

通过 \`<style>\` 注入自定义样式，改变引用块的边框和背景色：

<style>
.${instanceClass} blockquote {
  border-left-color: #e53935 !important;
  background: #ffebee !important;
}
.${instanceClass} h2 {
  color: #e53935 !important;
}
</style>

> ✅ 如果 style 生效，这段引用块左边框变为**红色**，背景变为**浅红**；上方标题也会变红。
> ❌ 如果 style 被过滤，引用块和标题保持默认颜色。

---

## 2. \`<iframe>\` 标签测试

嵌入一个空白 iframe：

<iframe src="about:blank" width="100%" height="50" style="border:3px dashed #4CAF50; border-radius:6px; background:#e8f5e9;"></iframe>

> ✅ 如果 iframe 生效，上方出现**绿色虚线边框**区域。
> ❌ 如果 iframe 被过滤，上方什么都不会显示。

---

## 3. 默认白名单标签（始终生效）

以下标签属于默认安全白名单，两边都能正常渲染：

<div style="padding:10px; background:#e3f2fd; border-radius:6px; border:1px solid #90caf9;">
  ✅ <code>&lt;div&gt;</code> 标签始终正常渲染，不需要额外配置白名单。
</div>

<b>粗体</b> · <i>斜体</i> · <u>下划线</u> · <del>删除线</del>
`;
}

/**
 * 实例1配置：默认模式（不启用白名单）
 * - htmlWhiteList 为空，DOMPurify 会过滤 style、iframe、script 等标签
 * - 这是 Cherry 的默认安全行为
 */
const xssConfig1 = {
  id: 'markdown-default',
  engine: {
    global: {
      // 不配置 htmlWhiteList，使用默认安全策略
      htmlWhiteList: '',
    },
  },
  toolbars: {
    toolbar: [
      'bold',
      'italic',
      'strikethrough',
      '|',
      'color',
      'header',
      '|',
      'list',
      'code',
      'table',
      'hr',
    ],
    toolbarRight: [],
    sidebar: [],
  },
  editor: {
    height: '100%',
  },
  value: createXssDemoMarkdown('compare-panel__default'),
};

/**
 * 实例2配置：白名单模式（启用 iframe + style）
 * - htmlWhiteList 配置为 'iframe|style'
 * - DOMPurify 不会过滤这两个标签，允许渲染
 *
 * 安全提示：不在演示中启用 script 白名单，避免实际 XSS 风险
 */
const xssConfig2 = {
  id: 'markdown-whitelist',
  engine: {
    global: {
      // 允许 iframe 和 style 标签通过 DOMPurify 过滤
      htmlWhiteList: 'iframe|style',
    },
  },
  toolbars: {
    toolbar: [
      'bold',
      'italic',
      'strikethrough',
      '|',
      'color',
      'header',
      '|',
      'list',
      'code',
      'table',
      'hr',
    ],
    toolbarRight: [],
    sidebar: [],
  },
  editor: {
    height: '100%',
  },
  value: createXssDemoMarkdown('compare-panel__whitelist'),
};

export { xssConfig1, xssConfig2 };

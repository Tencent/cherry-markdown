### 跨站脚本攻击（XSS）

Markdown编辑器在渲染Markdown内容为HTML时，如果没有正确处理用户输入，可能会将恶意脚本作为正常内容渲染。攻击者通过在Markdown内容中注入恶意JavaScript代码，当其他用户查看转换后的HTML内容时，恶意脚本在用户浏览器中执行导致XSS攻击。

```markdown
<img src="x" onerror="while(true)alert('show me the bitcoin')">
```

这段Markdown内容在被转换为HTML并渲染时，会尝试加载一个不存在的图片资源，并在加载失败时执行`onerror`事件处理器中的JavaScript代码，弹出一个包含恶意信息的警告框。

### 数据泄露

某些编辑器支持加载外部资源，如图片、样式表或完整的网页（即`<iframe>`）。如果这些外部资源的提供者有恶意意图，他们可以收集用户的敏感信息，如IP地址等。

```html
<iframe
  width="100%"
  height="100%"
  src="http://localhost:3000">
</iframe>
```

如果上述`<iframe>`代码被插入到Markdown编辑器中，并指向一个恶意服务器，那么用户的IP地址等信息可能会被收集。

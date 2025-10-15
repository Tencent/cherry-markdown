---
'cherry-markdown': patch
'cherry-markdown-vscode-plugin': patch
'@cherry-markdown/client': patch
---

fix: #1461 #1453 精简流式渲染场景的dom结构，并优化流式渲染场景mermaid的渲染失败时的处理逻辑

#### 在流式输出模式下(`global.flowSessionContext=true`)
1. 当只有一个 mermaid 渲染的时候，如果在编辑过程中出现 mermaid 渲染错误，他会保持渲染上次渲染成功 mermaid svg。
2. 当有多个 mermaid 渲染的时候，当在第一次渲染的时候，如果后面的 mermaid 渲染错误，他会往上寻找直到寻找渲染成功的 mermaid svg 进行替换当前渲染错误的 mermaid。

#### 在流式输出模式下(`global.flowSessionContext=true`) && 没有开启预览区编辑(`enablePreviewerBubble=false`)

1. 并且没有开启预览区编辑，则需要移除不再需要的dom ,这里针对流式输出的场景简单移除dom，是符合预期的，但这种精简 dom 的方案在需要 switchModel 时会有问题。

# Architecture

`@cherry-markdown/milkdown` is a standalone WYSIWYG editor, not a Cherry editor-mode plugin.

- `editor.ts` owns the Milkdown lifecycle and public instance API.
- `CherryEngine.makeHtml(markdown)` is the compatibility/rendering boundary for Cherry-specific syntax.
- `wysiwyg/` owns ProseMirror schema extensions, NodeViews, source editing, and editor-local overlays.
- `renderers/` contains optional heavyweight renderers such as ECharts.
- `styles.css` imports Cherry's published stylesheet and adds only scoped editing-state CSS.

The package must not instantiate `Cherry`, Previewer, CodeMirror, or Cherry toolbar/Bubble classes. Reusing a Cherry CSS class is a visual contract only and must not imply runtime coupling.

Markdown is the source of truth. Standard syntax uses Milkdown nodes and marks. Cherry-specific syntax is structurally editable only when parsing and serialization are deterministic; otherwise it is retained as an atomic raw block rendered through CherryEngine. Renderer failure is isolated to the affected node.

NodeViews may mount optional renderers only into elements they create and own. They must not discover, rewrite, or append controls to class names inside HTML returned by `CherryEngine.makeHtml()`. Compound Cherry blocks therefore expose one block-level source editor unless Cherry publishes a stable child-rendering contract in the future.

Every editor owns its overlays, observers, timers, NodeViews, and renderer instances. `destroy()` removes only the child mount created by this package and never removes consumer-owned root content.

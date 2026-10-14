# Architecture

`@cherry-markdown/milkdown` is a standalone WYSIWYG editor, not a Cherry editor-mode plugin.

- `editor.ts` owns the Milkdown lifecycle and public instance API.
- `CherryEngine.makeHtml(markdown)` renders Cherry-owned native syntax; registered visual renderers handle Mermaid, ECharts, and custom fenced blocks.
- Cherry dist imports are isolated behind `cherry-engine.ts`, `cherry-echarts.ts`, and `cherry-codeblock-echarts.ts`; these are the package-upgrade checkpoints. The published Cherry stylesheet remains an explicit CSS dependency.
- Table and fenced charts share one Milkdown-owned mount/cleanup path. It uses Cherry's existing option generator and chart lifecycle, including the declared minimum (0.11.10), without adding a Cherry mounting API or depending on Previewer DOM. Charts in one editor share a reference-counted engine, matching Cherry's root-scoped export/theme observers; each mount owns its request-cancellation scope. Cleanup and resize resolve the current chart after export rebuilds, and the final mount releases the engine. Consumer checks exercise both the published minimum and the workspace tarball.
- Its legacy locale context is generated from Cherry's chart messages during build (`sync-chart-locale.mjs`), not an independently maintained translation table. It does not import Cherry's editor/toolbar runtime to obtain translations.
- Markdown source reconciliation accepts a formatting-preserving edit only after parser/serializer validation. Ambiguous matches fall back to canonical serialization rather than changing the wrong occurrence. Nested renderer results share an abort-owned cleanup scope, including late results after sibling failures.
- `table-focus.ts` isolates Table Block's pointer/word selection integration. Table editing and controls remain Milkdown-owned; selection updates use ProseMirror transactions, never replacement of component DOM.
- `composition-gate.ts` only schedules/coalesces external writes until native composition commits. `document-update.ts` shares structure-checked ProseMirror transforms with ordinary updates and rebases the latest deferred update over native input. Overlapping/ambiguous ranges preserve local input and report a conflict; same-value echoes do not cancel a distinct update. This bounded IME reconciliation is not a collaborative merge protocol. ProseMirror remains the caret/history owner, and concurrent local input still emits its merged value even for a silent external write.
- ECharts shares Cherry's CSS-derived theme and observer for table and fenced charts. Instance-local theme notifications redraw only Mermaid's preview, leaving source DOM and ProseMirror selection untouched. Renderer cleanup/error reporting share one exception-isolated lifecycle scope.
- `wysiwyg/` owns ProseMirror schema extensions, NodeViews, source editing, and editor-local overlays.
- `renderers/` contains optional heavyweight renderers such as ECharts.
- `styles.css` imports Cherry's published stylesheet and adds only scoped editing-state CSS.

The package must not instantiate `Cherry`, Previewer, CodeMirror, or Cherry toolbar/Bubble classes. Reusing a Cherry CSS class is a visual contract only and must not imply runtime coupling.

Cherry's published standalone Engine entry has no matching subpath type declaration. The public `engine` input therefore accepts an object and validates `makeHtml()` when creating the editor; the packed-consumer test covers this boundary.

ECharts fenced blocks use Cherry's code-block addon's `parseOption()` and its default data-only policy. Milkdown mounts the chart itself because Cherry's `render()` locates a Previewer DOM node. Mermaid's Cherry addon has the same Previewer dependency, so the Milkdown-owned renderer and source control need explicit browser regression coverage when Cherry or Mermaid changes. These editor controls are ProseMirror NodeViews, not Cherry editor controls.

Ordinary editable code blocks use Prism decorations rather than Cherry's static code-block DOM. Their default grammar/fallback follows Cherry's bundled Prism behavior, and the token-style contract test compares both renderers by character. Mermaid rendering uses one temporary canvas per revision and serializes calls, matching Cherry's shared-renderer concurrency boundary.

Markdown is the source of truth. Standard syntax uses Milkdown nodes and marks. Cherry-specific syntax is structurally editable only when parsing and serialization are deterministic; otherwise recognized source blocks are retained as atomic raw nodes rendered through CherryEngine. There is no blanket byte-preservation guarantee for unknown syntax that is not recognized by the adapter. Renderer failure is isolated to the affected node.

NodeViews may mount optional renderers only into elements they create and own. They must not discover, rewrite, or append controls to class names inside HTML returned by `CherryEngine.makeHtml()`. Renderer callbacks are trusted application code; returned HTML strings pass through the package sanitizer before mounting. Compound Cherry blocks therefore expose one block-level source editor unless Cherry publishes a stable child-rendering contract in the future.

Every editor owns its overlays, observers, timers, NodeViews, and renderer instances. `destroy()` removes only the child mount created by this package and never removes consumer-owned root content.

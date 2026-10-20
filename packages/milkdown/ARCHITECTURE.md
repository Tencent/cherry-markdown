# Architecture

`@cherry-markdown/milkdown` is a standalone WYSIWYG editor, not a Cherry editor-mode plugin.

- `editor.ts` owns the Milkdown lifecycle and public instance API.
- `CherryEngine.makeHtml(markdown)` renders Cherry-owned native syntax; registered visual renderers handle Mermaid, ECharts, and custom fenced blocks.
- Cherry dist imports are isolated behind `cherry-engine.ts`, `cherry-echarts.ts`, and `cherry-codeblock-echarts.ts`; these are the package-upgrade checkpoints. The published Cherry stylesheet remains an explicit CSS dependency.
- Table and fenced charts share one Milkdown-owned mount/cleanup path. It uses Cherry's existing option generator and chart lifecycle, including the declared minimum (0.11.11), without adding a Cherry mounting API or depending on Previewer DOM. Charts in one editor share a reference-counted engine, matching Cherry's root-scoped export/theme observers; each mount owns its request-cancellation scope. Cleanup and resize resolve the current chart after export rebuilds, and the final mount releases the engine. Consumer checks apply Changesets in a disposable workspace and exercise the versioned tarballs, including registered maps. They also test the published minimum when available; before its first publication, the planned core tarball must match that minimum exactly.
- `cherry-map.ts` owns map fetching, cancellation, fallback and retry for Milkdown mounts. Export rebuilds reuse the pending request; completed maps still use Cherry's existing option generator for province normalization, chart data and themes. The per-instance adapter routes only owned map mounts, never replaces browser globals, and requires no cancellation API in Cherry. Cherry's only integration fix is selecting the injected ECharts registry consistently instead of an unrelated global instance.
- `scripts/sync-cherry-helpers.mjs` bundles Cherry's pure clipboard, image-layout and link-scheme helpers into `src/generated/`. Inline grammar and image directive patterns are generated from Cherry's actual rule builders and helper methods. `--check` detects drift, and production builds include the generated runtime without importing Cherry source or UI at runtime. Handwritten declarations describe this private integration boundary.
- `inline-syntax.ts` is the single adapter between those generated rules and both Markdown import and live input. Input-only delimiter precedence avoids consuming unfinished background-color/subscript syntax; capture indices retain payloads equal to their attributes. Original AST source ranges protect escaped delimiters after Markdown decoding.
- Its legacy locale context is generated from Cherry's chart messages during build (`sync-chart-locale.mjs`), not an independently maintained translation table. It does not import Cherry's editor/toolbar runtime to obtain translations.
- Markdown source reconciliation accepts a formatting-preserving edit only after parser/serializer validation. Ambiguous matches fall back to canonical serialization rather than changing the wrong occurrence. Nested renderer results share an abort-owned cleanup scope, including late results after sibling failures.
- Markdown's parsed code/HTML nodes own literal source boundaries, including nested indented code and incomplete fences. Cherry directive and reference scans share those protected ranges; visual fenced nodes take their language and payload from the same AST instead of parsing fences a second time. Complete blocks between directives reuse their original AST and document-wide reference context; only partially split blocks require reparsing.
- `table-focus.ts` isolates Table Block's pointer/word selection integration. Table editing and controls remain Milkdown-owned; selection updates use ProseMirror transactions, never replacement of component DOM.
- `composition-gate.ts` only schedules/coalesces external writes until native composition commits. `document-update.ts` shares structure-checked ProseMirror transforms with ordinary updates and rebases the latest deferred update over native input. Overlapping/ambiguous ranges preserve local input and report a conflict; same-value echoes do not cancel a distinct update. This bounded IME reconciliation is not a collaborative merge protocol. ProseMirror remains the caret/history owner, and concurrent local input still emits its merged value even for a silent external write.
- ECharts shares Cherry's CSS-derived theme and observer for table and fenced charts. Instance-local theme notifications redraw only Mermaid's preview, leaving source DOM and ProseMirror selection untouched. Renderer cleanup/error reporting share one exception-isolated lifecycle scope.
- `wysiwyg/` owns ProseMirror schema extensions, NodeViews, source editing, and editor-local overlays.
- `wysiwyg/nodes.ts` only assembles the existing registration order and exports. Its `nodes/` modules separate schemas, compound containers, footnotes, source/navigation nodes, and rendered embeds; feature modules never import the assembly entrypoint.
- `render-lifecycle.ts` shares pending/committed render ownership for embeds and table-chart previews. It commits only the current revision, retains the old preview until success, and releases cancelled/late results through the existing renderer cleanup scope. NodeViews still own DOM, source editing, and error presentation.
- `contextual-ui.ts` shares contextual control geometry, selection-preserving pointer behavior, viewport subscriptions, and frame scheduling. Text, link, and image plugins keep their own visibility/actions and existing placement policies; no shared global overlay state or Cherry DOM rewriting is introduced.
- `renderers/` contains optional heavyweight renderers such as ECharts.
- `styles.css` imports Cherry's published stylesheet and adds only scoped editing-state CSS.

The package must not instantiate `Cherry`, Previewer, CodeMirror, or Cherry toolbar/Bubble classes. Reusing a Cherry CSS class is a visual contract only and must not imply runtime coupling.

Cherry's published standalone Engine entry has no matching subpath type declaration. The public `engine` input therefore accepts an object and validates `makeHtml()` when creating the editor; the packed-consumer test covers this boundary.

ECharts fenced blocks use Cherry's code-block addon's `parseOption()` and its default data-only policy. Milkdown mounts the chart itself because Cherry's `render()` locates a Previewer DOM node. Mermaid's Cherry addon has the same Previewer dependency, so the Milkdown-owned renderer and source control need explicit browser regression coverage when Cherry or Mermaid changes. These editor controls are ProseMirror NodeViews, not Cherry editor controls.

Ordinary editable code blocks use Prism decorations rather than Cherry's static code-block DOM. Their default grammar/fallback follows Cherry's bundled Prism behavior, and the token-style contract test compares both renderers by character. Mermaid rendering uses one temporary canvas per revision and serializes calls, matching Cherry's shared-renderer concurrency boundary.

Markdown is the source of truth. Standard syntax uses Milkdown nodes and marks. Cherry-specific syntax is structurally editable only when parsing and serialization are deterministic; otherwise recognized source blocks are retained as atomic raw nodes rendered through CherryEngine. There is no blanket byte-preservation guarantee for unknown syntax that is not recognized by the adapter. Renderer failure is isolated to the affected node.

NodeViews may mount optional renderers only into elements they create and own. They must not discover, rewrite, or append controls to class names inside HTML returned by `CherryEngine.makeHtml()`. Renderer callbacks are trusted application code; returned HTML strings pass through the package sanitizer before mounting. Compound Cherry blocks therefore expose one block-level source editor unless Cherry publishes a stable child-rendering contract in the future.

Every editor owns its overlays, observers, timers, NodeViews, and renderer instances. `destroy()` removes only the child mount created by this package and never removes consumer-owned root content.

## Reuse boundaries

| Surface           | Shared Cherry logic                                            | Milkdown-owned interaction                                        |
| ----------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- |
| Links             | Scheme validation and clipboard helper                         | Selection ranges, form, save/cancel and ProseMirror transaction   |
| Images            | Image rendering, layout grammar and decoration/alignment state | Attribute form, resize, upload ownership and document updates     |
| Code blocks       | Clipboard helper; Prism appearance checked against Cherry      | Editable NodeView, language control, selection and decorations    |
| Inline extensions | Cherry-generated syntax rules shared by import and live input  | Schema, serialization, delimiter precedence while typing and undo |

Generated modules are build artifacts with Cherry as their source of truth. Do not hand-edit them or import Cherry toolbar/Previewer controllers to reuse a pure operation. Existing controls retain their DOM, class names and styles; visual parity checks supplement behavior tests.

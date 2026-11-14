# @cherry-markdown/milkdown

An out-of-the-box Milkdown/ProseMirror WYSIWYG Markdown editor that reuses Cherry Markdown parsing, rendered HTML, and visual styles. It does not create a Cherry editor or Previewer and is independent from Cherry's editor modes.

Requires Node.js 22+; see the `peerDependencies` in [package.json](./package.json) for the supported `cherry-markdown` range. The Cherry minimum includes the injected ECharts map-registry fix; map loading, cancellation and retry remain in Milkdown. See [release setup](./RELEASING.md) for versioning and npm publisher configuration.

Use `prosemirror-view` 1.42.3 or newer to address [GHSA-c8x8-7fp4-3x9w](https://github.com/ProseMirror/prosemirror-view/security/advisories/GHSA-c8x8-7fp4-3x9w). Check every resolved copy used by the editor, for example with `npm ls prosemirror-view`; a direct peer alone cannot prevent an older nested copy, and `npm ls` can succeed while listing one.

For Yarn Classic, an application can set `"resolutions": { "prosemirror-view": "^1.42.3" }` in its root `package.json`, run `yarn install` to update the lockfile, and recheck the installed tree. This applies to other users of the package in that application too, so verify their compatibility.

For npm, one root configuration is to declare `"prosemirror-view": "^1.42.3"` in `dependencies` and set `"overrides": { "prosemirror-view": "$prosemirror-view" }`. Update the lockfile and recheck every resolved copy; adapt an existing direct dependency rather than adding a conflicting override.

## Minimal React setup

```tsx
import { useEffect, useRef } from 'react';
import { cherryMilkdown } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/style.css';

export function Editor() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let instance: Awaited<ReturnType<typeof cherryMilkdown>> | undefined;
    void cherryMilkdown({
      root: root.current!,
      value: '# Hello',
      onChange: ({ markdown }) => console.log(markdown),
    }).then((editor) => {
      if (disposed) return editor.destroy();
      instance = editor;
    });
    return () => {
      disposed = true;
      void instance?.destroy();
    };
  }, []);
  return <div ref={root} />;
}
```

The package creates a default `CherryEngine`. Pass `engine` to supply a compatible custom rendering implementation.

The default Cherry Engine reads browser storage during initialization. If the browser denies storage access, creation can fail and reports the `create` error through `onError`. An application may provide a trusted `engine` that works in its environment; its rendering capabilities depend on that implementation.

## API

- `cherryMilkdown(options)` creates an independent editor.
- `getMarkdown()` reads Markdown.
- `onError(error, phase, context?)` can provide `context.getPreviousMarkdown()` when a plugin view fails after an external update has committed, or serialization fails and a plugin changes the document during the update or rollback. Applications can read the previous local content to save or compare it with the current document. This does not change the current document or restore plugin state. Cached content remains readable after destruction; some synchronous reentrant cases require an active editor and a working serializer for the first read. The context retains the previous document snapshot, so release the reference after saving it. Other errors may not include a context.
  If serialization and rollback both fail during an external update, import `ExternalUpdateRollbackError` from the package entry and use `instanceof` to identify it. Its `errors` contain the original serialization error followed by the rollback error.
- `setMarkdown(markdown, { emit? })` remains a full replacement outside IME and emits by default. During composition, the latest external write is rebased after commit when non-conflicting, preserving input, caret and undo history. Same-value echoes neither replay preedit text nor cancel other queued updates. Overlapping or unsafe updates preserve local input and report `onError(error, 'parse')`; this is not a collaborative-editing protocol. `emit: false` silences the external edit, not concurrently committed local input, whose `onChange` contains the merged result.
- Outside composition, a same-value `emit: false` echo leaves any pending local change notification intact. A different-value silent replacement still replaces the document and cancels the superseded notification.
- `setTheme(theme)` switches the Cherry theme without changing Markdown or history. ECharts reuses Cherry's lightweight theme update without replacing chart data; Mermaid redraws inside its node without replacing the source editor.
- `focus()` focuses the editor.
- `destroy()` releases the editor, overlays, NodeViews, and renderer resources. It cancels pending debounced `onChange` notifications; read and save `getMarkdown()` before destroying when the latest content is needed.
  The underlying history implementation may retain plugins and a removed view from the most recently edited instance; `destroy()` does not guarantee immediate garbage collection. Pending external renderers and application-owned references can also extend object lifetimes.
- `bubble` enables the selection Bubble (default `true`), initially with bold, italic, underline, and strikethrough.
- `readonly` creates a read-only surface.
- `theme` selects a Cherry theme and defaults to `default`; `dark`, `abyss`, `green`, `red`, `gray`, `violet`, and `blue` are supported.
- `plugins` adds Milkdown plugins.
- `renderers` registers optional renderers by fenced-code language. Matching fences automatically gain source expansion and live updates; `tableChart` is reserved for table-chart previews.
- When formulas are enabled, import `mathlive/fonts.css` in the application. The base stylesheet does not require the optional MathLive peer.
- `plugins` are applied alongside the built-in Milkdown plugins. Plugins that replace schemas, keymaps, or NodeViews may conflict; compatibility with arbitrary third-party plugins is not guaranteed.
- `fileUpload` optionally uploads a selected image. The returned URL and image attributes are written only after the user confirms Save; scrolling or resizing preserves the image form and any ongoing upload. Manually editing the URL cancels an ongoing upload and clears its pending image attributes.

```ts
import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts';
await cherryMilkdown({ root: '#markdown', value: markdown, renderers: { echarts, tableChart } });
```

A custom renderer does not require a Milkdown schema change. This renderer matches fences whose language is `custom-chart` and redraws only the affected node after its expanded source changes:

````ts
await cherryMilkdown({
  root: '#markdown',
  value: '```custom-chart\n{"value": 1}\n```',
  renderers: {
    'custom-chart': ({ container, source }) => {
      container.textContent = source;
    },
  },
});
````

```ts
await cherryMilkdown({
  root: '#markdown',
  value: markdown,
  fileUpload(file, done, { signal }) {
    return upload(file, { signal }).then(({ url }) => done(url, { name: file.name, width: '100%' }));
  },
});
```

Return the upload promise so a rejection can show the failure state and allow retry. The callback is still used to provide the uploaded URL.

Placing the caret in a link opens compact actions to open, copy, edit or unlink it, styled with Cherry theme tokens. Press `Alt+F10` to focus the link actions, then use Tab to navigate and Escape to return to the editor; Tab retains its usual behavior in the editor. Unlinking preserves text and other formatting and supports undo. Unsaved link fields survive scrolling and viewport resizing. Use `Ctrl/Cmd+K` to edit a link or add one to selected text.

After selecting an image with the arrow keys, press `Alt+F10` to enter its actions. Use Tab to navigate, Space or Enter to activate an action, and Escape to return to the editor.

The action bar follows a continuously moving image. Resize handles are hidden while it moves to avoid inaccurate drags and return when movement stops.

When a paused image animation is seeked, the action bar and resize handles follow its new position. If the paused animation changes during a resize, that resize is canceled rather than committing dimensions based on the old position.

Starting an external animation that may change the image geometry during a resize also cancels that resize. Width and height transitions caused by the resize itself remain supported.

## Boundaries

- The main and ECharts modules can be imported during server rendering, but editor creation and chart rendering require a browser DOM. Create and destroy the editor in a client-side lifecycle.

Editable code highlighting follows Cherry's language list, including TypeScript, JSON, Python and aliases. Live editing, language selection and copy controls remain available; unknown languages fall back to JavaScript.

- Markdown is the only persistent data format.
- CommonMark/GFM content is structurally edited by Milkdown.
- Cherry-specific syntax uses CherryEngine or a configured renderer. Only syntax with deterministic parsing and serialization is structurally edited; complex and recognized custom blocks use whole-block source editing.
- Editing attempts to preserve untouched Markdown spelling, but falls back to serialization when the original source cannot be located or validated safely. Even CommonMark/GFM can therefore normalize untouched headings, list markers, whitespace, or other spelling; byte-for-byte preservation is not guaranteed. Applications that need exact source should retain the original and check the saved result for their use case.
- Cherry Engine and its table-chart addon are imported through package-local adapters that isolate the current published dist paths. Recheck those adapters and Cherry's CSS path when upgrading Cherry.
- Custom renderers may mutate the supplied `container`. Returned HTML strings are sanitized before insertion; do not concatenate untrusted Markdown into executable HTML.
- Custom engines and renderers are trusted application code. Sanitization is not a sandbox; applications remain responsible for the HTML and CSS they produce.
- Engine HTML removes stylesheets and fixed, sticky, absolute, or variable-based inline positioning, while preserving relative positioning. HTML returned by explicitly registered renderers retains embedded stylesheets for diagram compatibility; those styles can affect the host page, so only register trusted renderers.
- Sanitizing returned HTML removes SVG SMIL animation elements, which could otherwise rewrite links or other attributes after insertion. A trusted renderer can manage the supplied `container` directly when animation is required.
- Selection, link, and image UI belongs to this package and does not call Cherry editor internals.
- The stylesheet imports Cherry's published CSS and scopes editing-only additions under `.cherry-milkdown` to reduce upgrade coupling.
- `mathlive`, `mermaid`, and `echarts` are capability peers. Install the matching dependency when enabling formulas, Mermaid, or ECharts; runtime renderer failures stay isolated to the affected node and report through `onError` without blocking ordinary Markdown.
- esbuild resolves dynamic imports by default, so a build without MathLive must mark `mathlive` as external. This does not provide formula support: install and bundle MathLive, or supply runtime module resolution, when formulas are needed.
- Fenced ECharts configuration accepts JSON5 data only and never executes JavaScript. Maps still require consumer-provided map data or a custom renderer.
- Standalone table charts keep Milkdown's native GFM table as their editable source of truth; a package-owned derived preview hot-updates from its cells. Cherry-owned compound blocks such as Columns and Tabs remain whole-block renders and whole-block source editors; this package never injects child controls or chart mount points into Cherry-generated DOM.
- Generic drag handles cover top-level paragraphs and blockquotes only. Headings keep Cherry's native anchor interaction; lists and compound Cherry nodes retain selection/cut/paste semantics so their internal controls are not intercepted.

Run the demo with `yarn workspace @cherry-markdown/milkdown dev:demo`.

### Table-chart syntax and performance boundaries

Cherry Engine owns table-chart recognition, option parsing and column padding; Milkdown retains live cell editing, selection and undo. Prefer standard JSON such as `:line:{"title":"Trend"}`, without trailing commas. Cherry's deprecated legacy format, such as `:line:{title: My Chart}`, remains supported with upstream warnings. Table options no longer use a separate JSON5 dialect; invalid standard JSON follows Cherry's fallback and diagnostics. Fenced ECharts code still uses Cherry's data-only JSON5 parser and never executes JavaScript.

Cell splitting and escaping follow Cherry: escape a cell pipe as `\|` rather than relying on backticks around a bare pipe. Full parsing runs after debounce and only for the current table; unchanged table nodes and header recognition use caches. Earlier edits retain unrelated chart mounts. Complete Engine parsing costs more than a lightweight splitter, so cold rendering of large tables is not promised to match the former adapter. See [ARCHITECTURE.md](./ARCHITECTURE.md#table-chart-parsing) for compatibility and performance verification.

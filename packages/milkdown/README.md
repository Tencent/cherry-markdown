# @cherry-markdown/milkdown

An out-of-the-box Milkdown/ProseMirror WYSIWYG Markdown editor that reuses Cherry Markdown parsing, rendered HTML, and visual styles. It does not create a Cherry editor or Previewer and is independent from Cherry's editor modes.

Requires Node.js 22+ and `cherry-markdown >=0.11.11 <0.12.0`. The Cherry minimum includes the injected ECharts map-registry fix; map loading, cancellation and retry remain in Milkdown. See [release setup](./RELEASING.md) for versioning and npm publisher configuration.

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

The package creates a default `CherryEngine`. Pass `engine` only when reusing custom Cherry Engine hooks or rendering configuration.

## API

- `cherryMilkdown(options)` creates an independent editor.
- `getMarkdown()` reads Markdown.
- `setMarkdown(markdown, { emit? })` remains a full replacement outside IME and emits by default. During composition, the latest external write is rebased after commit when non-conflicting, preserving input, caret and undo history. Same-value echoes neither replay preedit text nor cancel other queued updates. Overlapping or unsafe updates preserve local input and report `onError(error, 'parse')`; this is not a collaborative-editing protocol. `emit: false` silences the external edit, not concurrently committed local input, whose `onChange` contains the merged result.
- `setTheme(theme)` switches the Cherry theme without changing Markdown or history. ECharts reuses Cherry's lightweight theme update without replacing chart data; Mermaid redraws inside its node without replacing the source editor.
- `focus()` focuses the editor.
- `destroy()` releases the editor, overlays, NodeViews, and renderer resources.
- `bubble` enables the selection Bubble (default `true`), initially with bold, italic, underline, and strikethrough.
- `readonly` creates a read-only surface.
- `theme` selects a Cherry theme and defaults to `default`; `dark`, `abyss`, `green`, `red`, `gray`, `violet`, and `blue` are supported.
- `plugins` adds Milkdown plugins.
- `renderers` registers optional renderers by fenced-code language. Matching fences automatically gain source expansion and live updates; `tableChart` is reserved for table-chart previews.
- When formulas are enabled, import `mathlive/fonts.css` in the application. The base stylesheet does not require the optional MathLive peer.
- `plugins` are applied alongside the built-in Milkdown plugins. Plugins that replace schemas, keymaps, or NodeViews may conflict; compatibility with arbitrary third-party plugins is not guaranteed.
- `fileUpload` optionally uploads a selected image. The returned URL and image attributes are written only after the user confirms Save.

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
    upload(file, { signal }).then(({ url }) => done(url, { name: file.name, width: '100%' }));
  },
});
```

## Boundaries

Editable code highlighting follows Cherry's language list, including TypeScript, JSON, Python and aliases. Live editing, language selection and copy controls remain available; unknown languages fall back to JavaScript.

- Markdown is the only persistent data format.
- CommonMark/GFM content is structurally edited by Milkdown.
- Cherry-specific syntax uses CherryEngine or a configured renderer. Only syntax with deterministic parsing and serialization is structurally edited; complex and recognized custom blocks use whole-block source editing. Byte-for-byte preservation is not guaranteed for Cherry extensions the adapter does not recognize.
- Cherry Engine and its table-chart addon are imported through package-local adapters that isolate the current published dist paths. Recheck those adapters and Cherry's CSS path when upgrading Cherry.
- Custom renderers may mutate the supplied `container`. Returned HTML strings are sanitized before insertion; do not concatenate untrusted Markdown into executable HTML.
- Selection, link, and image UI belongs to this package and does not call Cherry editor internals.
- The stylesheet imports Cherry's published CSS and scopes editing-only additions under `.cherry-milkdown` to reduce upgrade coupling.
- `mathlive`, `mermaid`, and `echarts` are capability peers. Install the matching dependency when enabling formulas, Mermaid, or ECharts; runtime renderer failures stay isolated to the affected node and report through `onError` without blocking ordinary Markdown.
- Fenced ECharts configuration accepts JSON5 data only and never executes JavaScript. Maps still require consumer-provided map data or a custom renderer.
- Standalone table charts keep Milkdown's native GFM table as their editable source of truth; a package-owned derived preview hot-updates from its cells. Cherry-owned compound blocks such as Columns and Tabs remain whole-block renders and whole-block source editors; this package never injects child controls or chart mount points into Cherry-generated DOM.
- Generic drag handles cover top-level paragraphs and blockquotes only. Headings keep Cherry's native anchor interaction; lists and compound Cherry nodes retain selection/cut/paste semantics so their internal controls are not intercepted.

Run the demo with `yarn workspace @cherry-markdown/milkdown dev:demo`.

### Table-chart syntax and performance boundaries

Cherry Engine owns table-chart recognition, option parsing and column padding; Milkdown retains live cell editing, selection and undo. Prefer standard JSON such as `:line:{"title":"Trend"}`, without trailing commas. Cherry's deprecated legacy format, such as `:line:{title: My Chart}`, remains supported with upstream warnings. Table options no longer use a separate JSON5 dialect; invalid standard JSON follows Cherry's fallback and diagnostics. Fenced ECharts code still uses Cherry's data-only JSON5 parser and never executes JavaScript.

Cell splitting and escaping follow Cherry: escape a cell pipe as `\|` rather than relying on backticks around a bare pipe. Full parsing runs after debounce and only for the current table; unchanged table nodes and header recognition use caches. Earlier edits retain unrelated chart mounts. Complete Engine parsing costs more than a lightweight splitter, so cold rendering of large tables is not promised to match the former adapter. See [ARCHITECTURE.md](./ARCHITECTURE.md#table-chart-parsing) for compatibility and performance verification.

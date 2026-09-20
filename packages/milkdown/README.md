# @cherry-markdown/milkdown

An out-of-the-box Milkdown/ProseMirror WYSIWYG Markdown editor that reuses Cherry Markdown parsing, rendered HTML, and visual styles. It does not create a Cherry editor or Previewer and is independent from Cherry's editor modes.

## Minimal React setup

```tsx
import { useEffect, useRef } from 'react';
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core.esm.js';
import { cherryMilkdown } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/style.css';

export function Editor() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const engine = new CherryEngine({});
    let disposed = false;
    let instance: Awaited<ReturnType<typeof cherryMilkdown>> | undefined;
    void cherryMilkdown({
      root: root.current!,
      engine,
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

Omit `engine` to let the package create a default `CherryEngine`, or pass an existing instance to share Engine hooks and rendering configuration.

## API

- `cherryMilkdown(options)` creates an independent editor.
- `getMarkdown()` reads Markdown.
- `setMarkdown(markdown, { emit? })` updates Markdown and emits by default.
- `setTheme(theme)` switches the Cherry theme without changing Markdown or history.
- `focus()` focuses the editor.
- `destroy()` releases the editor, overlays, NodeViews, and renderer resources.
- `bubble` enables the selection Bubble (default `true`), initially with bold, italic, underline, and strikethrough.
- `readonly` creates a read-only surface.
- `theme` selects a Cherry theme and defaults to `default`; `dark`, `abyss`, `green`, `red`, `gray`, `violet`, and `blue` are supported.
- `plugins` adds Milkdown plugins.
- `renderers` provides optional ECharts/table-chart renderers.
- `fileUpload` optionally uploads a selected image. The returned URL and image attributes are written only after the user confirms Save.

```ts
import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts';
await cherryMilkdown({ root: '#markdown', value: markdown, renderers: { echarts, tableChart } });
```

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

- Markdown is the only persistent data format.
- CommonMark/GFM content is structurally edited by Milkdown.
- Cherry-specific syntax prefers HTML produced by CherryEngine. Safely editable nodes expose live source or property controls; unknown syntax preserves source instead of being rewritten incorrectly.
- Selection, link, and image UI belongs to this package and does not call Cherry editor internals.
- The stylesheet imports Cherry's published CSS and scopes editing-only additions under `.cherry-milkdown` to reduce upgrade coupling.
- `mathlive`, `mermaid`, and `echarts` are capability peers. Install the matching dependency when enabling formulas, Mermaid, or ECharts; runtime renderer failures stay isolated to the affected node and report through `onError` without blocking ordinary Markdown.
- ECharts configuration accepts JSON5 data only and never executes JavaScript. Maps still require consumer-provided map data or a custom renderer.
- Standalone table charts hot-update through their own NodeView. Cherry-owned compound blocks such as Columns and Tabs remain whole-block renders and whole-block source editors; this package never injects child controls or chart mount points into Cherry-generated DOM.
- Generic drag handles cover top-level paragraphs, headings, and blockquotes only. Lists and compound Cherry nodes retain selection/cut/paste semantics so their internal controls are not intercepted.

Run the demo with `yarn workspace @cherry-markdown/milkdown dev:demo`.

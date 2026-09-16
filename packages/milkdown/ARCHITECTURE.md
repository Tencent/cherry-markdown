# Runtime plugin boundary

- index.ts: previewOnly runtime mounted by `Cherry.usePlugin()`.
- wysiwyg/: schema, Markdown transforms, native DOM presentation and NodeViews.
- native-bridge.ts: delegates image, table and diagram controls to the current
  Cherry Previewer; no second Cherry is created.
- ui/: editor-local controls; no Cherry top Toolbar imports.
- renderers/: optional renderers with per-node cleanup.
- examples/react/: one standard Cherry previewOnly integration.

Cherry only owns the generic runtime-plugin registry, per-instance mount/destroy
lifecycle and Previewer content-renderer slot. These APIs must contain no
Milkdown-specific branch, parser, style or toolbar behavior. Milkdown owns all
mode eligibility and editing logic. editOnly, edit&preview and CherryStream are
not activated in this release.

## Test migration

The former dual-editor tests exercised APIs removed by this redesign. They are
replaced with plugin lifecycle, actual input, selection boundaries, source
editing, rendering and API update tests. Parser/serializer and full-manual unit
cases remain. A smaller green suite must not be described as the former complete
interaction matrix passing.

## Remaining release gates

- Full-manual DOM/visual comparison for the remaining uncommon combinations,
  not just serialized Markdown equivalence. The blocking Chromium suite already
  covers ordinary text CRUD, Bubble selection, task toggles, heading/TOC links,
  structured Panel/Detail controls, code, formulas, tables, images, native
  source nodes, Mermaid and ECharts.
- All advanced chart options and map data-provider behavior. The optional chart
  renderer is not yet a feature-for-feature replacement of Cherry's chart plugin.
- Bubble color/size/ruby controls and a full keyboard/touch accessibility audit.
- Repeated mount/destroy resource accounting and long-running editing stress.
- Browser runtime verification of the actual npm consumer, beyond its build.

All adapter CSS selectors must remain scoped below `.cherry-milkdown`. Native
content styling belongs to the imported Cherry stylesheet; this package may
style only ProseMirror behavior, editable controls and documented DOM-shape
compensation. The stylesheet ownership test blocks rules that could leak into a
normal Cherry instance.

Do not add Milkdown-specific behavior to Cherry to make these pass. Extend the
package's schema, NodeViews, renderers and controls with failing regression cases
first.

# Standalone editor boundary

- index.ts: one asynchronous lifecycle and public Markdown API.
- wysiwyg/: schema, Markdown transforms, native DOM presentation and NodeViews.
- ui/: editor-local controls; no Cherry Toolbar or Previewer imports.
- renderers/: optional renderers with per-node cleanup.
- examples/react/: one minimal integration; no Cherry mode switching.

Cherry source, types, tests and styles must have zero diff against dev for this PR.
The dependency is its released engine distribution and stylesheet, not src paths
or newly introduced compatibility APIs. The package version stays unchanged.

## Test migration

The former dual-editor tests exercised APIs removed by this redesign. They are
replaced with standalone lifecycle, actual input, selection boundaries, source
editing, rendering and API update tests. Parser/serializer and full-manual unit
cases remain. A smaller green suite must not be described as the former complete
interaction matrix passing.

## Remaining release gates

- Full-manual DOM/visual comparison, not just serialized Markdown equivalence.
  The manual includes non-GFM ordered lists, inline media, mixed HTML tables and
  nested fenced examples that need explicit native-render handling.
- All advanced chart options and map data-provider behavior. The optional chart
  renderer is not yet a feature-for-feature replacement of Cherry's chart plugin.
- Image drag-resizing and full decoration controls; currently width/alignment
  property editing is available.
- Bubble color/size/ruby controls and a full keyboard/touch accessibility audit.
- Repeated mount/destroy resource accounting and long-running editing stress.
- Browser runtime verification of the actual npm consumer, beyond its build.

Do not change Cherry to make these pass. Extend the package's schema, NodeViews,
renderers and controls with failing regression cases first.

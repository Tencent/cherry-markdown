# CodeMirror Markdown Enter patch

`@codemirror/lang-markdown` is pinned to 6.5.0 in Cherry Markdown. The root
Yarn postinstall applies the patch before generating icons and fails if it cannot
be applied. `postinstall-postinstall` also reapplies it after Yarn 1 removes packages.
Install from the workspace root with lifecycle scripts enabled.

The patch keeps CodeMirror's list parsing, numbering, indentation and transaction
construction. It adds two opt-in command options:

- `continueLooseLists: false` stops inserting blank lines when continuing a list.
- `exitParagraphBoundary: true` preserves paragraph separation when leaving an
  outermost list item, including within blockquotes. Nested items still outdent.

The existing `nonTightLists: false` option disables conversion of the second
empty item into a loose list. Read-only handling and document-coordinate cursor
calculation also cover CRLF documents. Both runtime entries and both declaration
entries are patched. Default option values preserve upstream list behavior.

When upgrading CodeMirror, regenerate/review the patch and run
`markdownEnter.spec.ts`, `markdownDependencyPatch.spec.ts` and
`TightListEnter.spec.ts`, followed by the source suite, typecheck, build and
artifact tests. The patch is compiled into Cherry's distributed editor bundles;
package consumers do not need this workspace postinstall or patch files.

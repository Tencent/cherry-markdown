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

## Build and CI requirements

`vp run -F cherry-markdown verify:markdown-patch` checks the exact dependency pin,
installed version, matching patch file, both declarations and actual ESM/CJS
continuation, quoted exit and CRLF cursor behavior. `build:all`, `build:types`
and the direct `build/vite.build.js` entry enforce this check before producing
artifacts. Skipping installation scripts cannot silently produce an unpatched
editor bundle.

The existing PR CI matrix uses a frozen lockfile and runs
`vp run -F cherry-markdown test:markdown-patch` on Node 22, 24 and LTS. This includes
the command/editor contracts, isolated preflight failure tests and TypeScript
NodeNext fixtures for both ESM and CJS declarations. The artifact checks also
exercise Enter and paragraph previews in the built ESM/UMD editors. Keep these
checks enabled.

For an upgrade, update the exact pin and lockfile, regenerate all four patch
entries, then run the contract command, source tests, typecheck and a full build
with artifact tests. Verify a clean frozen install. Never remove the preflight
or weaken tests just to accommodate an unpatched dependency. If the patch grows
beyond these bounded behavior changes, reassess maintaining a source fork.

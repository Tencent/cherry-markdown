---
'@cherry-markdown/client': minor
---

Migrate the client UI shell to TSX and improve the desktop editor experience.

- Convert client UI components from Vue SFCs to TSX while preserving existing file, editor, and status bar behavior.
- Improve the sidebar with resizable panels, icon tooltips, clearer current-file locating, safer context menu positioning, and grouped recent files.
- Support opening associated Markdown/Text files from macOS Finder while keeping Windows file-association launch behavior.

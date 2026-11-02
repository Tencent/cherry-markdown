---
'@cherry-markdown/client': patch
'cherry-markdown': patch
---

Preserve user change notifications after programmatic writes, serialize editor transitions and retain the latest content during asynchronous mounting. Reset Milkdown undo/redo history when opening a different file without resetting unrelated plugin state.

Release Cherry's pending render/TOC updates and global TOC listeners during destruction so rapid client engine switches cannot access a disposed previewer.

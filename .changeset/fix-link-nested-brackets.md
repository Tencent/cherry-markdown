---
'cherry-markdown': patch
---

Fix inline links whose display text contains `][` bracket sequences (e.g. `[[a][b]c](url)`) being left unrendered. The reference-link alternative in the link rule short-circuited such text as an undefined reference before the real `](url)` was reached; it is now removed so the inline URL is matched correctly. Defined references are still handled upstream by `CommentReference`, and undefined references still render as literal text.

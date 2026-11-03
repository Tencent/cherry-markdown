---
'cherry-markdown': patch
---

Cancel pending render, hash navigation and floating TOC updates when destroying an editor. Release the TOC's scroll and resize listeners, and make repeated destruction safe.

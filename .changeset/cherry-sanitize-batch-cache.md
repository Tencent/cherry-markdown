---
'cherry-markdown': patch
---

perf: cache HtmlBlock sanitize batch results so unchanged chunks are not re-sanitized each render (applies to documents with >50 paragraph segments, where unchanged prefix batches can be reused across renders)

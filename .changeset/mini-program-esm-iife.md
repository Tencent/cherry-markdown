---
'@cherry-markdown/miniProgram': patch
---

fix: 精简小程序包 ESM 与 IIFE 输出配置

仅保留当前实际支持的 `miniProgram-stream` ESM/IIFE 产物，移除 CommonJS 导出声明，并补充 IIFE 可用性校验与中英文使用文档。

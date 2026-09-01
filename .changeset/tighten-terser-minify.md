---
"cherry-markdown": patch
---

Tighten terser minify options (`passes`/`toplevel`/`pure_getters`/`unsafe_comps`/`unsafe_math` and toplevel mangle) in `packages/cherry-markdown/build/vite.build.js` to shrink the built bundle (≈ -1.26% esm gzip, ~18KB). No runtime behavior change; all existing tests pass.

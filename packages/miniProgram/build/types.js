import { copyFileSync } from 'node:fs';

// Keep index.d.ts for relative references emitted by TypeScript and preserve the published type entry.
copyFileSync('dist/types/index.d.ts', 'dist/types/miniProgram.d.ts');

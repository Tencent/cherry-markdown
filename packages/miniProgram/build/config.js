import { nativeEntityTables } from '../../cherry-markdown/build/semantic-entities.js';
import { createLibraryBuild } from '../../../build/library.mjs';

export function createMiniProgramBuild(output) {
  return createLibraryBuild(output, {
    plugins: [nativeEntityTables()],
    define: { BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'production') },
    build: {
      rolldownOptions: {
        external: output.format === 'es' ? ['cherry-markdown/semantic', 'cherry-markdown/theme'] : [],
        output: { format: output.format, entryFileNames: output.file, exports: 'named' },
      },
    },
  });
}

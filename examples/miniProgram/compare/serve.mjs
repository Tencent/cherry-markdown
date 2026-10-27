import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('../../../', import.meta.url)),
  server: { host: '127.0.0.1', port: 4179, strictPort: true },
});
await server.listen();
console.log('Cherry Web mobile comparison: http://127.0.0.1:4179/examples/miniProgram/compare/index.html');

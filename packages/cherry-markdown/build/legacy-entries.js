/**
 * @deprecated Remove this complete manifest when Cherry Markdown reaches 1.0.
 * These files preserve the public 0.x artifact names; implementation lives in
 * the responsibility packages and must never be added here.
 */
export const legacyEntries = [
  ['core-umd', 'index.core.umd.js', 'cherry-markdown.core.js', 'umd', 'Cherry'],
  ['core-esm', 'index.core.js', 'cherry-markdown.core.esm.js', 'es'],
  ['engine-esm', 'index.engine.js', 'cherry-markdown.engine.esm.js', 'es'],
  ['engine-umd', 'index.engine.js', 'cherry-markdown.engine.js', 'umd', 'CherryEngine'],
  ['engine-core-esm', 'index.engine.core.js', 'cherry-markdown.engine.core.esm.js', 'es'],
  ['engine-core-umd', 'index.engine.core.js', 'cherry-markdown.engine.core.js', 'umd', 'CherryEngine'],
  ['stream-esm', 'index.stream.js', 'cherry-markdown.stream.esm.js', 'es'],
  ['stream-umd', 'index.stream.umd.js', 'cherry-markdown.stream.js', 'umd', 'Cherry'],
].map(([id, entry, file, format, name]) => ({ id, entry, file, format, name }));

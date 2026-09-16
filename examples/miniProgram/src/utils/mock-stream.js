export function createMockMarkdownChunks(markdown = '', chunkSize = 1) {
  const characters = Array.from(String(markdown || ''));
  const size = Math.max(1, Number(chunkSize) || 1);
  const chunks = [];

  for (let index = 0; index < characters.length; index += size) {
    chunks.push(characters.slice(index, index + size).join(''));
  }

  return chunks;
}

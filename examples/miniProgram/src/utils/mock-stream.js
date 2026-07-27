export function createMockMarkdownChunks(markdown = '') {
  return Array.from(String(markdown || ''));
}

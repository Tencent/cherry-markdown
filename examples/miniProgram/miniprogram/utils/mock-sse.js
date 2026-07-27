export function createMockSseFrames(markdown = '') {
  return Array.from(String(markdown || ''), (chunk) => `data: ${JSON.stringify({ content: chunk })}\n\n`).concat(
    'data: [DONE]\n\n',
  );
}

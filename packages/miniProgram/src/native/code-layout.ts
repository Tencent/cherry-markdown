/** Estimate scroll extent for the default 14px monospace theme and reserve every source line. */
export function nativeCodeLayout(text: string): { codeHeight: number; codeWidth: number } {
  const lines = text.split('\n');
  let longest = 0;
  for (const line of lines) {
    let columns = 0;
    for (const char of line) columns += char === '\t' ? 4 - (columns % 4) : char.codePointAt(0)! > 255 ? 2 : 1;
    longest = Math.max(longest, columns);
  }
  return { codeHeight: lines.length * 21 + 28, codeWidth: Math.ceil(longest * 8.4 + 28) };
}

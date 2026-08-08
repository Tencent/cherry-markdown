export interface TextReplacement {
  startOffset: number;
  endOffset: number;
  text: string;
}

/** Returns the smallest single replacement that transforms currentText into nextText. */
export function calculateTextReplacement(currentText: string, nextText: string): TextReplacement | undefined {
  if (currentText === nextText) return undefined;

  const sharedLimit = Math.min(currentText.length, nextText.length);
  let startOffset = 0;
  while (startOffset < sharedLimit && currentText[startOffset] === nextText[startOffset]) {
    startOffset += 1;
  }

  let currentEnd = currentText.length;
  let nextEnd = nextText.length;
  while (currentEnd > startOffset && nextEnd > startOffset && currentText[currentEnd - 1] === nextText[nextEnd - 1]) {
    currentEnd -= 1;
    nextEnd -= 1;
  }

  return {
    startOffset,
    endOffset: currentEnd,
    text: nextText.slice(startOffset, nextEnd),
  };
}

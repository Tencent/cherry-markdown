import { insertNewlineContinueMarkupCommand } from '@codemirror/lang-markdown';

// The pinned dependency patch adds these options without copying its Enter implementation.
/** @type {import('@codemirror/state').StateCommand} */
export const cherryInsertNewlineContinueMarkup = insertNewlineContinueMarkupCommand({
  nonTightLists: false,
  continueLooseLists: false,
  exitParagraphBoundary: true,
});

import type { StateCommand } from '@codemirror/state';
import { insertNewlineContinueMarkupCommand } from '@codemirror/lang-markdown';

export const command: StateCommand = insertNewlineContinueMarkupCommand({
  nonTightLists: false,
  continueLooseLists: false,
  exitParagraphBoundary: true,
});

import type { CherryMilkdownInstance } from '../src/types';

declare global {
  interface Window {
    cherry?: { getMarkdown(): string };
    milkdownEditor?: CherryMilkdownInstance;
  }
}

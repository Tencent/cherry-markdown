import type { CherryMilkdownInstance } from '../src/types';

declare global {
  interface Window {
    milkdownEditor?: CherryMilkdownInstance;
  }
}

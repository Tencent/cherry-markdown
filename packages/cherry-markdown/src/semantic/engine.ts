import * as runtime from './runtime';
import type { SemanticOptions, SemanticEngine } from './types';
export function createSemanticEngine(options: SemanticOptions = {}): SemanticEngine {
  return runtime.createSemanticEngine(options);
}
export function cloneSemanticBlocks<T>(value: T): T {
  return runtime.cloneSemanticBlocks(value);
}
export function isValidSemanticUrl(value: string, image = false): boolean {
  return runtime.isValidSemanticUrl(value, image);
}

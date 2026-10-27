import type { SemanticOptions, SemanticEngine } from './types';
/** Typed boundary around the existing JavaScript engine; protocol and incremental code stay strict. */
export function createSemanticEngine(options?: SemanticOptions): SemanticEngine;
export function cloneSemanticBlocks<T>(value: T): T;
export function isValidSemanticUrl(value: string, image?: boolean): boolean;

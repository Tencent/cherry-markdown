import type { Code, SfcBlock } from '../../types';
export declare const references: WeakMap<SfcBlock, [version: string, [className: string, offset: number][]]>;
export declare function generateStyleScopedClassReference(block: SfcBlock, className: string, offset: number, fullStart?: number): Generator<Code>;

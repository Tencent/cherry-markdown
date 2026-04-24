import type { Code, VueCodeInformation } from '../../types';
export declare function startBoundary(source: string, startOffset: number, features: VueCodeInformation): Generator<Code, symbol, unknown>;
export declare function endBoundary(token: symbol, endOffset: number): Code;

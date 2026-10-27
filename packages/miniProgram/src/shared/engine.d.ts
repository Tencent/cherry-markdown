import type { MiniProgramBlock, MiniProgramEngine, MiniProgramOptions } from '../types';
/** Typed boundary to Cherry's existing JavaScript engine integration. */
export function createMiniProgramEngine(options?: MiniProgramOptions): MiniProgramEngine;
export function isValidSemanticUrl(value: string, image?: boolean): boolean;
export function cloneSemanticBlocks(blocks: MiniProgramBlock[]): MiniProgramBlock[];

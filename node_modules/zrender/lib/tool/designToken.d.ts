import { Dictionary } from '../core/types';
import type { GradientObject } from '../graphic/Gradient';
import type { PatternObject } from '../graphic/Pattern';
export type DesignTokenValue = string | number;
export interface DesignTokens {
    [key: string]: {
        [key: string]: DesignTokenValue | string;
    };
}
export declare class DesignTokenManager {
    private _designTokens;
    private _resolvedTokens;
    registerTokens(tokens: DesignTokens): void;
    getTokenValue(token: string): DesignTokenValue | string;
    resolveColor(color: string | GradientObject | PatternObject): string | GradientObject | PatternObject;
    getPaintStyle(style: Dictionary<any>): Dictionary<any>;
    resolveStyle(style: Dictionary<any>): Dictionary<any>;
    private _resolveTokens;
    private _resolveTokenValue;
}

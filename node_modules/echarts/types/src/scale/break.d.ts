import { AxisLabelFormatterExtraParams } from '../coord/axisCommonTypes.js';
import type { NullUndefined, ParsedAxisBreak, ParsedAxisBreakList, AxisBreakOption, AxisBreakOptionIdentifierInAxis, ScaleTick, VisualAxisBreak } from '../util/types.js';
import type Scale from './Scale.js';
/**
 * @file The fasade of scale break.
 *  Separate the impl to reduce code size.
 *
 * @caution
 *  Must not import `scale/breakImpl.ts` directly or indirectly.
 *  Must not implement anything in this file.
 */
export interface ScaleBreakContext {
    readonly breaks: ParsedAxisBreakList;
    setBreaks(parsed: AxisBreakParsingResult): void;
    update(scaleExtent: [number, number]): void;
    hasBreaks(): boolean;
    calcNiceTickMultiple(tickVal: number, estimateNiceMultiple: (tickVal: number, brkEnd: number) => number): number;
    getExtentSpan(): number;
    normalize(val: number): number;
    scale(val: number): number;
    elapse(val: number): number;
    unelapse(elapsedVal: number): number;
}
export declare type AxisBreakParsingResult = {
    breaks: ParsedAxisBreakList;
};
/**
 * Whether to remove any normal ticks that are too close to axis breaks.
 *  - 'auto': Default. Remove any normal ticks that are too close to axis breaks.
 *  - 'no': Do nothing pruning.
 *  - 'exclude_scale_bound': Prune but keep scale extent boundary.
 * For example:
 *  - For splitLine, if remove the tick on extent, split line on the bounary of cartesian
 *   will not be displayed, causing werid effect.
 *  - For labels, scale extent boundary should be pruned if in break, otherwise duplicated
 *   labels will displayed.
 */
export declare type ParamPruneByBreak = 'auto' | 'no' | 'preserve_extent_bound' | NullUndefined;
export declare type ScaleBreakHelper = {
    createScaleBreakContext(): ScaleBreakContext;
    pruneTicksByBreak<TItem extends ScaleTick | number>(pruneByBreak: ParamPruneByBreak, ticks: TItem[], breaks: ParsedAxisBreakList, getValue: (item: TItem) => number, interval: number, scaleExtent: [number, number]): void;
    addBreaksToTicks(ticks: ScaleTick[], breaks: ParsedAxisBreakList, scaleExtent: [number, number], getTimeProps?: (clampedBrk: ParsedAxisBreak) => ScaleTick['time']): void;
    parseAxisBreakOption(breakOptionList: AxisBreakOption[] | NullUndefined, parse: Scale['parse'], opt?: {
        noNegative: boolean;
    }): AxisBreakParsingResult;
    identifyAxisBreak(brk: AxisBreakOption, identifier: AxisBreakOptionIdentifierInAxis): boolean;
    serializeAxisBreakIdentifier(identifier: AxisBreakOptionIdentifierInAxis): string;
    retrieveAxisBreakPairs<TItem, TReturnIdx extends boolean>(itemList: TItem[], getVisualAxisBreak: (item: TItem) => VisualAxisBreak | NullUndefined, returnIdx: TReturnIdx): (TReturnIdx extends false ? TItem[][] : number[][]);
    getTicksLogTransformBreak(tick: ScaleTick, logBase: number, logOriginalBreaks: ParsedAxisBreakList, fixRoundingError: (val: number, originalVal: number) => number): {
        brkRoundingCriterion: number | NullUndefined;
        vBreak: VisualAxisBreak | NullUndefined;
    };
    logarithmicParseBreaksFromOption(breakOptionList: AxisBreakOption[], logBase: number, parse: Scale['parse']): {
        parsedOriginal: AxisBreakParsingResult;
        parsedLogged: AxisBreakParsingResult;
    };
    makeAxisLabelFormatterParamBreak(extraParam: AxisLabelFormatterExtraParams | NullUndefined, vBreak: VisualAxisBreak | NullUndefined): AxisLabelFormatterExtraParams | NullUndefined;
};
export declare function registerScaleBreakHelperImpl(impl: ScaleBreakHelper): void;
export declare function getScaleBreakHelper(): ScaleBreakHelper | NullUndefined;

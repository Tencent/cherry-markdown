import * as clazzUtil from '../util/clazz.js';
import { Dictionary } from 'zrender/lib/core/types.js';
import SeriesData from '../data/SeriesData.js';
import { DimensionName, ScaleDataValue, DimensionLoose, ScaleTick, AxisBreakOption, NullUndefined, ParsedAxisBreakList } from '../util/types.js';
import { ScaleCalculator } from './helper.js';
import { ScaleRawExtentInfo } from '../coord/scaleRawExtentInfo.js';
import { ScaleBreakContext, AxisBreakParsingResult, ParamPruneByBreak } from './break.js';
export declare type ScaleGetTicksOpt = {
    expandToNicedExtent?: boolean;
    pruneByBreak?: ParamPruneByBreak;
    breakTicks?: 'only_break' | 'none' | NullUndefined;
};
export declare type ScaleSettingDefault = Dictionary<unknown>;
declare abstract class Scale<SETTING extends ScaleSettingDefault = ScaleSettingDefault> {
    type: string;
    private _setting;
    protected _extent: [number, number];
    protected _brkCtx: ScaleBreakContext | NullUndefined;
    protected _calculator: ScaleCalculator;
    private _isBlank;
    readonly rawExtentInfo: ScaleRawExtentInfo;
    constructor(setting?: SETTING);
    getSetting<KEY extends keyof SETTING>(name: KEY): SETTING[KEY];
    /**
     * Parse input val to valid inner number.
     * Notice: This would be a trap here, If the implementation
     * of this method depends on extent, and this method is used
     * before extent set (like in dataZoom), it would be wrong.
     * Nevertheless, parse does not depend on extent generally.
     */
    abstract parse(val: ScaleDataValue): number;
    /**
     * Whether contain the given value.
     */
    abstract contain(val: number): boolean;
    /**
     * Normalize value to linear [0, 1], return 0.5 if extent span is 0.
     */
    abstract normalize(val: number): number;
    /**
     * Scale normalized value to extent.
     */
    abstract scale(val: number): number;
    /**
     * [CAVEAT]: It should not be overridden!
     */
    _innerUnionExtent(other: [number, number]): void;
    /**
     * Set extent from data
     */
    unionExtentFromData(data: SeriesData, dim: DimensionName | DimensionLoose): void;
    /**
     * Get a new slice of extent.
     * Extent is always in increase order.
     */
    getExtent(): [number, number];
    setExtent(start: number, end: number): void;
    /**
     * [CAVEAT]: It should not be overridden!
     */
    protected _innerSetExtent(start: number, end: number): void;
    /**
     * Prerequisite: Scale#parse is ready.
     */
    setBreaksFromOption(breakOptionList: AxisBreakOption[]): void;
    /**
     * [CAVEAT]: It should not be overridden!
     */
    _innerSetBreak(parsed: AxisBreakParsingResult): void;
    /**
     * [CAVEAT]: It should not be overridden!
     */
    _innerGetBreaks(): ParsedAxisBreakList;
    /**
     * Do not expose the internal `_breaks` unless necessary.
     */
    hasBreaks(): boolean;
    protected _getExtentSpanWithBreaks(): number;
    /**
     * If value is in extent range
     */
    isInExtentRange(value: number): boolean;
    /**
     * When axis extent depends on data and no data exists,
     * axis ticks should not be drawn, which is named 'blank'.
     */
    isBlank(): boolean;
    /**
     * When axis extent depends on data and no data exists,
     * axis ticks should not be drawn, which is named 'blank'.
     */
    setBlank(isBlank: boolean): void;
    /**
     * Update interval and extent of intervals for nice ticks
     *
     * @param splitNumber Approximated tick numbers. Optional.
     *        The implementation of `niceTicks` should decide tick numbers
     *        whether `splitNumber` is given.
     * @param minInterval Optional.
     * @param maxInterval Optional.
     */
    abstract calcNiceTicks(splitNumber?: number, minInterval?: number, maxInterval?: number): void;
    abstract calcNiceExtent(opt?: {
        splitNumber?: number;
        fixMin?: boolean;
        fixMax?: boolean;
        minInterval?: number;
        maxInterval?: number;
    }): void;
    /**
     * @return label of the tick.
     */
    abstract getLabel(tick: ScaleTick): string;
    abstract getTicks(opt?: ScaleGetTicksOpt): ScaleTick[];
    abstract getMinorTicks(splitNumber: number): number[][];
    static registerClass: clazzUtil.ClassManager['registerClass'];
    static getClass: clazzUtil.ClassManager['getClass'];
}
export default Scale;

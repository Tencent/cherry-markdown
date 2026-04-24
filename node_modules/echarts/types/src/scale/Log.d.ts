import { ScaleGetTicksOpt } from './Scale.js';
import IntervalScale from './Interval.js';
import { DimensionLoose, DimensionName, ParsedAxisBreakList, AxisBreakOption, ScaleTick } from '../util/types.js';
import SeriesData from '../data/SeriesData.js';
declare class LogScale extends IntervalScale {
    static type: string;
    readonly type = "log";
    base: number;
    private _originalScale;
    private _fixMin;
    private _fixMax;
    /**
     * @param Whether expand the ticks to niced extent.
     */
    getTicks(opt?: ScaleGetTicksOpt): ScaleTick[];
    protected _getNonTransBreaks(): ParsedAxisBreakList;
    setExtent(start: number, end: number): void;
    /**
     * @return {number} end
     */
    getExtent(): [number, number];
    unionExtentFromData(data: SeriesData, dim: DimensionName | DimensionLoose): void;
    /**
     * Update interval and extent of intervals for nice ticks
     * @param approxTickNum default 10 Given approx tick number
     */
    calcNiceTicks(approxTickNum: number): void;
    calcNiceExtent(opt: {
        splitNumber: number;
        fixMin?: boolean;
        fixMax?: boolean;
        minInterval?: number;
        maxInterval?: number;
    }): void;
    contain(val: number): boolean;
    normalize(val: number): number;
    scale(val: number): number;
    setBreaksFromOption(breakOptionList: AxisBreakOption[]): void;
}
export default LogScale;

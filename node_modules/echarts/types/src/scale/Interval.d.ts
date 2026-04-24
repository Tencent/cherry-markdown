import Scale, { ScaleGetTicksOpt, ScaleSettingDefault } from './Scale.js';
import { ScaleTick, ParsedAxisBreakList, ScaleDataValue } from '../util/types.js';
declare class IntervalScale<SETTING extends ScaleSettingDefault = ScaleSettingDefault> extends Scale<SETTING> {
    static type: string;
    type: string;
    protected _interval: number;
    protected _niceExtent: [number, number];
    protected _intervalPrecision: number;
    parse(val: ScaleDataValue): number;
    contain(val: number): boolean;
    normalize(val: number): number;
    scale(val: number): number;
    getInterval(): number;
    setInterval(interval: number): void;
    /**
     * @override
     */
    getTicks(opt?: ScaleGetTicksOpt): ScaleTick[];
    getMinorTicks(splitNumber: number): number[][];
    protected _getNonTransBreaks(): ParsedAxisBreakList;
    /**
     * @param opt.precision If 'auto', use nice presision.
     * @param opt.pad returns 1.50 but not 1.5 if precision is 2.
     */
    getLabel(data: ScaleTick, opt?: {
        precision?: 'auto' | number;
        pad?: boolean;
    }): string;
    /**
     * FIXME: refactor - disallow override, use composition instead.
     *
     * The override of `calcNiceTicks` should ensure these members are provided:
     *  this._intervalPrecision
     *  this._interval
     *
     * @param splitNumber By default `5`.
     */
    calcNiceTicks(splitNumber?: number, minInterval?: number, maxInterval?: number): void;
    calcNiceExtent(opt: {
        splitNumber: number;
        fixMin?: boolean;
        fixMax?: boolean;
        minInterval?: number;
        maxInterval?: number;
    }): void;
    setNiceExtent(min: number, max: number): void;
}
export default IntervalScale;

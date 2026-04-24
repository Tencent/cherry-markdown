import IntervalScale from './Interval.js';
import { ScaleGetTicksOpt } from './Scale.js';
import { TimeScaleTick, ScaleTick, AxisBreakOption } from '../util/types.js';
import { TimeAxisLabelFormatterParsed } from '../coord/axisCommonTypes.js';
import { LocaleOption } from '../core/locale.js';
import Model from '../model/Model.js';
declare type TimeScaleSetting = {
    locale: Model<LocaleOption>;
    useUTC: boolean;
    modelAxisBreaks?: AxisBreakOption[];
};
declare class TimeScale extends IntervalScale<TimeScaleSetting> {
    static type: string;
    readonly type = "time";
    private _approxInterval;
    private _minLevelUnit;
    constructor(settings?: TimeScaleSetting);
    /**
     * Get label is mainly for other components like dataZoom, tooltip.
     */
    getLabel(tick: TimeScaleTick): string;
    getFormattedLabel(tick: ScaleTick, idx: number, labelFormatter: TimeAxisLabelFormatterParsed): string;
    /**
     * @override
     */
    getTicks(opt?: ScaleGetTicksOpt): TimeScaleTick[];
    calcNiceExtent(opt?: {
        splitNumber?: number;
        fixMin?: boolean;
        fixMax?: boolean;
        minInterval?: number;
        maxInterval?: number;
    }): void;
    calcNiceTicks(approxTickNum: number, minInterval: number, maxInterval: number): void;
    parse(val: number | string | Date): number;
    contain(val: number): boolean;
    normalize(val: number): number;
    scale(val: number): number;
}
export default TimeScale;

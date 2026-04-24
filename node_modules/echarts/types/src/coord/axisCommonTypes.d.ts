import { TextAlign, TextVerticalAlign } from 'zrender/lib/core/types.js';
import { TextCommonOption, LineStyleOption, OrdinalRawValue, ZRColor, AreaStyleOption, ComponentOption, ColorString, AnimationOptionMixin, ScaleDataValue, CommonAxisPointerOption, AxisBreakOption, ItemStyleOption, NullUndefined, AxisLabelFormatterExtraBreakPart, TimeScaleTick, RichTextOption, LabelCommonOption } from '../util/types.js';
import type { PrimaryTimeUnit } from '../util/time.js';
export declare const AXIS_TYPES: {
    readonly value: 1;
    readonly category: 1;
    readonly time: 1;
    readonly log: 1;
};
export declare type OptionAxisType = keyof typeof AXIS_TYPES;
export interface AxisBaseOptionCommon extends ComponentOption, AnimationOptionMixin {
    type?: OptionAxisType;
    show?: boolean;
    inverse?: boolean;
    name?: string;
    /**
     * - 'start': place name based on axis.extent[0].
     * - 'end': place name based on axis.extent[1].
     * - 'middle': place name based on the center of the axis.
     * - 'center': ='middle'.
     */
    nameLocation?: 'start' | 'middle' | 'center' | 'end';
    nameRotate?: number;
    nameTruncate?: {
        maxWidth?: number;
        ellipsis?: string;
        placeholder?: string;
    };
    nameTextStyle?: AxisNameTextStyleOption;
    /**
     * This is the offset of axis name from:
     * - If `nameMoveOverlap: false`: offset from axisLine.
     * - If `nameMoveOverlap: true`: offset from axisLine+axisLabels.
     *
     * PENDING: should it named as "nameOffset" or support `[offsetX, offsetY]`?
     */
    nameGap?: number;
    /**
     * Whether to auto move axis name to avoid overlap with axis labels.
     * The procedure of axis name layout:
     * 1. Firstly apply `nameRotate`, `nameTruncate`, `nameLocation`, `nameGap`.
     *  Note that if `nameGap` is applied after the overlap handling, it may still
     *  cause overlap and confuse users.
     * 2. If `nameMoveOverlap: true`, move the name util it does not overlap with
     *  axis lables. `nameTextStyle.textMargin` can be used to adjust its gap from
     *  others in this case.
     * - If 'auto'/null/undefined, use `nameMoveOverlap`, except when `grid.containLabel` is
     *  true. This is for backward compat - users have tuned the position based on no name moved.
     */
    nameMoveOverlap?: boolean | 'auto' | NullUndefined;
    silent?: boolean;
    triggerEvent?: boolean;
    tooltip?: {
        show?: boolean;
    };
    axisLabel?: AxisLabelBaseOption;
    axisPointer?: CommonAxisPointerOption;
    axisLine?: AxisLineOption;
    axisTick?: AxisTickOption;
    minorTick?: MinorTickOption;
    splitLine?: SplitLineOption;
    minorSplitLine?: MinorSplitLineOption;
    splitArea?: SplitAreaOption;
    /**
     * Min value of the axis. can be:
     * + ScaleDataValue
     * + 'dataMin': use the min value in data.
     * + null/undefined: auto decide min value (consider pretty look and boundaryGap).
     */
    min?: ScaleDataValue | 'dataMin' | ((extent: {
        min: number;
        max: number;
    }) => ScaleDataValue);
    /**
     * Max value of the axis. can be:
     * + ScaleDataValue
     * + 'dataMax': use the max value in data.
     * + null/undefined: auto decide max value (consider pretty look and boundaryGap).
     */
    max?: ScaleDataValue | 'dataMax' | ((extent: {
        min: number;
        max: number;
    }) => ScaleDataValue);
    startValue?: number;
    jitter?: number;
    jitterOverlap?: boolean;
    jitterMargin?: number;
    breaks?: AxisBreakOption[];
    breakArea?: {
        show?: boolean;
        itemStyle?: ItemStyleOption;
        zigzagAmplitude?: number;
        zigzagMinSpan?: number;
        zigzagMaxSpan?: number;
        zigzagZ: number;
        expandOnClick?: boolean;
    };
    breakLabelLayout?: {
        moveOverlap?: 'auto' | boolean;
    };
}
export interface NumericAxisBaseOptionCommon extends AxisBaseOptionCommon {
    boundaryGap?: [number | string, number | string];
    /**
     * AxisTick and axisLabel and splitLine are calculated based on splitNumber.
     */
    splitNumber?: number;
    /**
     * Interval specifies the span of the ticks is mandatorily.
     */
    interval?: number;
    /**
     * Specify min interval when auto calculate tick interval.
     */
    minInterval?: number;
    /**
     * Specify max interval when auto calculate tick interval.
     */
    maxInterval?: number;
    /**
     * If align ticks to the first axis that is not use alignTicks
     * If all axes has alignTicks: true. The first one will be applied.
     *
     * Will be ignored if interval is set.
     */
    alignTicks?: boolean;
}
export interface CategoryAxisBaseOption extends AxisBaseOptionCommon {
    type?: 'category';
    boundaryGap?: boolean;
    axisLabel?: AxisLabelOption<'category'>;
    data?: (OrdinalRawValue | {
        value: OrdinalRawValue;
        textStyle?: TextCommonOption;
    })[];
    deduplication?: boolean;
    axisTick?: AxisBaseOptionCommon['axisTick'] & {
        alignWithLabel?: boolean;
        interval?: 'auto' | number | ((index: number, value: string) => boolean);
    };
}
export interface ValueAxisBaseOption extends NumericAxisBaseOptionCommon {
    type?: 'value';
    axisLabel?: AxisLabelOption<'value'>;
    /**
     * Optional value can be:
     * + `false`: always include value 0.
     * + `true`: the axis may not contain zero position.
     */
    scale?: boolean;
}
export interface LogAxisBaseOption extends NumericAxisBaseOptionCommon {
    type?: 'log';
    axisLabel?: AxisLabelOption<'log'>;
    logBase?: number;
}
export interface TimeAxisBaseOption extends NumericAxisBaseOptionCommon {
    type?: 'time';
    axisLabel?: AxisLabelOption<'time'>;
}
interface AxisNameTextStyleOption extends LabelCommonOption {
    rich?: RichTextOption;
}
interface AxisLineOption {
    show?: boolean | 'auto';
    onZero?: boolean;
    onZeroAxisIndex?: number;
    symbol?: string | [string, string];
    symbolSize?: number[];
    symbolOffset?: string | number | (string | number)[];
    lineStyle?: LineStyleOption;
    breakLine?: boolean;
}
interface AxisTickOption {
    show?: boolean | 'auto';
    inside?: boolean;
    length?: number;
    lineStyle?: LineStyleOption;
    customValues?: (number | string | Date)[];
}
export declare type AxisLabelValueFormatter = (value: number, index: number, extra: AxisLabelFormatterExtraParams | NullUndefined) => string;
export declare type AxisLabelCategoryFormatter = (value: string, index: number, extra: NullUndefined) => string;
export declare type AxisLabelTimeFormatter = (value: number, index: number, extra: TimeAxisLabelFormatterExtraParams) => string;
export declare type AxisLabelFormatterExtraParams = {} & AxisLabelFormatterExtraBreakPart;
export declare type TimeAxisLabelFormatterExtraParams = {
    time: TimeScaleTick['time'];
    /**
     * @deprecated Refactored to `time.level`, and keep it for backward compat,
     *  although `level` is never published in doc since it is introduced.
     */
    level: number;
} & AxisLabelFormatterExtraParams;
export declare type TimeAxisLabelLeveledFormatterOption = string[] | string;
export declare type TimeAxisLabelFormatterUpperDictionaryOption = {
    [key in PrimaryTimeUnit]?: TimeAxisLabelLeveledFormatterOption;
};
/**
 * @see {parseTimeAxisLabelFormatterDictionary}
 */
export declare type TimeAxisLabelFormatterDictionaryOption = {
    [key in PrimaryTimeUnit]?: TimeAxisLabelLeveledFormatterOption | TimeAxisLabelFormatterUpperDictionaryOption;
};
export declare type TimeAxisLabelFormatterOption = string | AxisLabelTimeFormatter | TimeAxisLabelFormatterDictionaryOption;
export declare type TimeAxisLabelFormatterParsed = string | AxisLabelTimeFormatter | TimeAxisLabelFormatterDictionary;
export declare type TimeAxisLabelFormatterDictionary = {
    [key in PrimaryTimeUnit]: TimeAxisLabelFormatterUpperDictionary;
};
export declare type TimeAxisLabelFormatterUpperDictionary = {
    [key in PrimaryTimeUnit]: string[];
};
declare type LabelFormatters = {
    value: AxisLabelValueFormatter | string;
    log: AxisLabelValueFormatter | string;
    category: AxisLabelCategoryFormatter | string;
    time: TimeAxisLabelFormatterOption;
};
export declare type AxisLabelBaseOptionNuance = {
    color?: ColorString | ((value?: string | number, index?: number) => ColorString);
};
interface AxisLabelBaseOption extends LabelCommonOption<AxisLabelBaseOptionNuance> {
    show?: boolean;
    inside?: boolean;
    rotate?: number;
    showMinLabel?: boolean;
    showMaxLabel?: boolean;
    alignMinLabel?: TextAlign;
    alignMaxLabel?: TextAlign;
    verticalAlignMinLabel?: TextVerticalAlign;
    verticalAlignMaxLabel?: TextVerticalAlign;
    margin?: number;
    /**
     * If hide overlapping labels.
     */
    hideOverlap?: boolean;
    customValues?: (number | string | Date)[];
}
interface AxisLabelOption<TType extends OptionAxisType> extends AxisLabelBaseOption {
    formatter?: LabelFormatters[TType];
    interval?: TType extends 'category' ? ('auto' | number | ((index: number, value: string) => boolean)) : unknown;
}
interface MinorTickOption {
    show?: boolean;
    splitNumber?: number;
    length?: number;
    lineStyle?: LineStyleOption;
}
interface SplitLineOption {
    show?: boolean;
    interval?: 'auto' | number | ((index: number, value: string) => boolean);
    showMinLine?: boolean;
    showMaxLine?: boolean;
    lineStyle?: LineStyleOption<ZRColor | ZRColor[]>;
}
interface MinorSplitLineOption {
    show?: boolean;
    lineStyle?: LineStyleOption;
}
interface SplitAreaOption {
    show?: boolean;
    interval?: 'auto' | number | ((index: number, value: string) => boolean);
    areaStyle?: AreaStyleOption<ZRColor[]>;
}
export declare type AxisBaseOption = ValueAxisBaseOption | LogAxisBaseOption | CategoryAxisBaseOption | TimeAxisBaseOption;
export {};

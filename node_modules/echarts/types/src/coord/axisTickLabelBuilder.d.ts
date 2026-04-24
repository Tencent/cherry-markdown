import Axis from './Axis.js';
import { AxisBaseModel } from './AxisBaseModel.js';
import { NullUndefined, ScaleTick, VisualAxisBreak } from '../util/types.js';
import { ScaleGetTicksOpt } from '../scale/Scale.js';
declare type AxisLabelInfoDetermined = {
    formattedLabel: string;
    rawLabel: string;
    tickValue: number;
    time: ScaleTick['time'] | NullUndefined;
    break: VisualAxisBreak | NullUndefined;
};
export declare const AxisTickLabelComputingKind: {
    readonly estimate: 1;
    readonly determine: 2;
};
export declare type AxisTickLabelComputingKind = (typeof AxisTickLabelComputingKind)[keyof typeof AxisTickLabelComputingKind];
export interface AxisLabelsComputingContext {
    out: {
        noPxChangeTryDetermine: (() => boolean)[];
    };
    kind: AxisTickLabelComputingKind;
}
export declare function createAxisLabelsComputingContext(kind: AxisTickLabelComputingKind): AxisLabelsComputingContext;
export declare function createAxisLabels(axis: Axis, ctx: AxisLabelsComputingContext): {
    labels: AxisLabelInfoDetermined[];
};
/**
 * @param tickModel For example, can be axisTick, splitLine, splitArea.
 */
export declare function createAxisTicks(axis: Axis, tickModel: AxisBaseModel, opt?: Pick<ScaleGetTicksOpt, 'breakTicks' | 'pruneByBreak'>): {
    ticks: number[];
    tickCategoryInterval?: number;
};
/**
 * Calculate interval for category axis ticks and labels.
 * Use a stretegy to try to avoid overlapping.
 * To get precise result, at least one of `getRotate` and `isHorizontal`
 * should be implemented in axis.
 */
export declare function calculateCategoryInterval(axis: Axis, ctx: AxisLabelsComputingContext): number;
export {};

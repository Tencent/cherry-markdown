import Scale from '../scale/Scale.js';
import Model from '../model/Model.js';
import { AxisBaseModel } from './AxisBaseModel.js';
import type Axis from './Axis.js';
import { AxisBaseOption, CategoryAxisBaseOption, AxisBaseOptionCommon } from './axisCommonTypes.js';
import SeriesData from '../data/SeriesData.js';
import { DimensionName, ScaleTick } from '../util/types.js';
/**
 * Get axis scale extent before niced.
 * Item of returned array can only be number (including Infinity and NaN).
 *
 * Caution:
 * Precondition of calling this method:
 * The scale extent has been initialized using series data extent via
 * `scale.setExtent` or `scale.unionExtentFromData`;
 */
export declare function getScaleExtent(scale: Scale, model: AxisBaseModel): {
    extent: number[];
    fixMin: boolean;
    fixMax: boolean;
};
export declare function niceScaleExtent(scale: Scale, inModel: AxisBaseModel): void;
/**
 * @param axisType Default retrieve from model.type
 */
export declare function createScaleByModel(model: AxisBaseModel, axisType?: string): Scale;
/**
 * Check if the axis cross 0
 */
export declare function ifAxisCrossZero(axis: Axis): boolean;
/**
 * @param axis
 * @return Label formatter function.
 *         param: {number} tickValue,
 *         param: {number} idx, the index in all ticks.
 *                         If category axis, this param is not required.
 *         return: {string} label string.
 */
export declare function makeLabelFormatter(axis: Axis): (tick: ScaleTick, idx?: number) => string;
export declare function getAxisRawValue<TIsCategory extends boolean>(axis: Axis, tick: ScaleTick): TIsCategory extends true ? string : number;
/**
 * @param model axisLabelModel or axisTickModel
 * @return {number|String} Can be null|'auto'|number|function
 */
export declare function getOptionCategoryInterval(model: Model<AxisBaseOption['axisLabel']>): CategoryAxisBaseOption['axisLabel']['interval'];
/**
 * Set `categoryInterval` as 0 implicitly indicates that
 * show all labels regardless of overlap.
 * @param {Object} axis axisModel.axis
 */
export declare function shouldShowAllLabels(axis: Axis): boolean;
export declare function getDataDimensionsOnAxis(data: SeriesData, axisDim: string): DimensionName[];
export declare function unionAxisExtentFromData(dataExtent: number[], data: SeriesData, axisDim: string): void;
export declare function isNameLocationCenter(nameLocation: AxisBaseOptionCommon['nameLocation']): boolean;
export declare function shouldAxisShow(axisModel: AxisBaseModel): boolean;
export declare function retrieveAxisBreaksOption(model: AxisBaseModel): AxisBaseOptionCommon['breaks'];

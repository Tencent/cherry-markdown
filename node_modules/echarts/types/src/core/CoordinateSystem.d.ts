import type GlobalModel from '../model/Global.js';
import type ExtensionAPI from './ExtensionAPI.js';
import type { CoordinateSystem, CoordinateSystemCreator, CoordinateSystemMaster } from '../coord/CoordinateSystem.js';
import ComponentModel from '../model/Component.js';
import { CoordinateSystemDataCoord, NullUndefined } from '../util/types.js';
declare class CoordinateSystemManager {
    private _normalMasterList;
    private _nonSeriesBoxMasterList;
    /**
     * Typically,
     *  - in `create`, a coord sys lays out based on a given rect;
     *  - in `update`, update the pixel and data extent of there axes (if any) based on processed `series.data`.
     * After that, a coord sys can serve (typically by `dataToPoint`/`dataToLayout`/`pointToData`).
     * If the coordinate system do not lay out based on `series.data`, `update` is not needed.
     */
    create(ecModel: GlobalModel, api: ExtensionAPI): void;
    /**
     * @see CoordinateSystem['create']
     */
    update(ecModel: GlobalModel, api: ExtensionAPI): void;
    getCoordinateSystems(): CoordinateSystemMaster[];
    static register: (type: string, creator: CoordinateSystemCreator) => void;
    static get: (type: string) => CoordinateSystemCreator;
}
export declare const BoxCoordinateSystemCoordFrom: {
    readonly coord: 1;
    readonly coord2: 2;
};
export declare type BoxCoordinateSystemCoordFrom = (typeof BoxCoordinateSystemCoordFrom)[keyof typeof BoxCoordinateSystemCoordFrom];
declare type BoxCoordinateSystemGetCoord2 = (model: ComponentModel) => CoordinateSystemDataCoord;
/**
 * @see_also `createBoxLayoutReference`
 * @see_also `injectCoordSysByOption`
 */
export declare function registerLayOutOnCoordSysUsage(opt: {
    fullType: ComponentModel['type'];
    getCoord2?: BoxCoordinateSystemGetCoord2;
}): void;
/**
 * @return Be an object, but never be NullUndefined.
 */
export declare function getCoordForBoxCoordSys(model: ComponentModel): {
    coord: CoordinateSystemDataCoord | NullUndefined;
    from: BoxCoordinateSystemCoordFrom;
};
/**
 * - "dataCoordSys": each data item is laid out based on a coord sys.
 * - "boxCoordSys": the overall bounding rect or anchor point is calculated based on a coord sys.
 *   e.g.,
 *      grid rect (cartesian rect) is calculate based on matrix/calendar coord sys;
 *      pie center is calculated based on calendar/cartesian;
 *
 * The default value (if not declared in option `coordinateSystemUsage`):
 *  For series, use `dataCoordSys`, since this is the most case and backward compatible.
 *  For non-series components, use `boxCoordSys`, since `dataCoordSys` is not applicable.
 */
export declare const CoordinateSystemUsageKind: {
    readonly none: 0;
    readonly dataCoordSys: 1;
    readonly boxCoordSys: 2;
};
export declare type CoordinateSystemUsageKind = (typeof CoordinateSystemUsageKind)[keyof typeof CoordinateSystemUsageKind];
export declare function decideCoordSysUsageKind(model: ComponentModel, printError?: boolean): {
    kind: CoordinateSystemUsageKind;
    coordSysType: string | NullUndefined;
};
/**
 * These cases are considered:
 *  (A) Most series can use only "dataCoordSys", but "boxCoordSys" is not applicable:
 *    - e.g., series.heatmap, series.line, series.bar, series.scatter, ...
 *  (B) Some series and most components can use only "boxCoordSys", but "dataCoordSys" is not applicable:
 *    - e.g., series.pie, series.funnel, ...
 *    - e.g., grid, polar, geo, title, ...
 *  (C) Several series can use both "boxCoordSys" and "dataCoordSys", even at the same time:
 *    - e.g., series.graph, series.map
 *      - If graph or map series use a "boxCoordSys", it creates a internal "dataCoordSys" to lay out its data.
 *      - Graph series can use matrix coord sys as either the "dataCoordSys" (each item layout on one cell)
 *        or "boxCoordSys" (the entire series are layout within one cell).
 *    - To achieve this effect,
 *      `series.coordinateSystemUsage: 'box'` needs to be specified explicitly.
 *
 * Check these echarts option settings:
 *  - If `series: {type: 'bar'}`:
 *      dataCoordSys: "cartesian2d", boxCoordSys: "none".
 *      (since `coordinateSystem: 'cartesian2d'` is the default option in bar.)
 *  - If `grid: {coordinateSystem: 'matrix'}`
 *      dataCoordSys: "none", boxCoordSys: "matrix".
 *  - If `series: {type: 'pie', coordinateSystem: 'matrix'}`:
 *      dataCoordSys: "none", boxCoordSys: "matrix".
 *      (since `coordinateSystemUsage: 'box'` is the default option in pie.)
 *  - If `series: {type: 'graph', coordinateSystem: 'matrix'}`:
 *      dataCoordSys: "matrix", boxCoordSys: "none"
 *  - If `series: {type: 'graph', coordinateSystem: 'matrix', coordinateSystemUsage: 'box'}`:
 *      dataCoordSys: "an internal view", boxCoordSys: "the internal view is laid out on a matrix"
 *  - If `series: {type: 'map'}`:
 *      dataCoordSys: "a internal geo", boxCoordSys: "none"
 *  - If `series: {type: 'map', coordinateSystem: 'geo', geoIndex: 0}`:
 *      dataCoordSys: "a geo", boxCoordSys: "none"
 *  - If `series: {type: 'map', coordinateSystem: 'matrix'}`:
 *      not_applicable
 *  - If `series: {type: 'map', coordinateSystem: 'matrix', coordinateSystemUsage: 'box'}`:
 *      dataCoordSys: "an internal geo", boxCoordSys: "the internal geo is laid out on a matrix"
 *
 * @usage
 * For case (A) & (B),
 *  call `injectCoordSysByOption({coordSysType: 'aaa', ...})` once for each series/components.
 * For case (C),
 *  call `injectCoordSysByOption({coordSysType: 'aaa', ...})` once for each series/components,
 *  and then call `injectCoordSysByOption({coordSysType: 'bbb', ..., isDefaultDataCoordSys: true})`
 *  once for each series/components.
 *
 * @return Whether injected.
 */
export declare function injectCoordSysByOption(opt: {
    targetModel: ComponentModel;
    coordSysType: string;
    coordSysProvider: CoordSysInjectionProvider;
    isDefaultDataCoordSys?: boolean;
    allowNotFound?: boolean;
}): boolean;
declare type CoordSysInjectionProvider = (coordSysType: string, injectTargetModel: ComponentModel) => CoordinateSystem | NullUndefined;
export declare const simpleCoordSysInjectionProvider: CoordSysInjectionProvider;
export default CoordinateSystemManager;

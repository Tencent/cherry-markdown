import * as matrix from 'zrender/lib/core/matrix.js';
import BoundingRect from 'zrender/lib/core/BoundingRect.js';
import Transformable from 'zrender/lib/core/Transformable.js';
import { CoordinateSystemMaster, CoordinateSystem } from './CoordinateSystem.js';
import GlobalModel from '../model/Global.js';
import { ParsedModelFinder } from '../util/model.js';
import { RoamOptionMixin } from '../util/types.js';
import ExtensionAPI from '../core/ExtensionAPI.js';
import { ZoomLimit } from '../component/helper/roamHelper.js';
export declare type ViewCoordSysTransformInfoPart = Pick<Transformable, 'x' | 'y' | 'scaleX' | 'scaleY'>;
declare class View extends Transformable implements CoordinateSystemMaster, CoordinateSystem {
    readonly type: string;
    static dimensions: string[];
    readonly dimensions: string[];
    readonly name: string;
    zoomLimit: ZoomLimit;
    /**
     * Represents the transform brought by roam/zoom.
     * If `View['_viewRect']` applies roam transform,
     * we can get the final displayed rect.
     */
    private _roamTransformable;
    /**
     * Represents the transform from `View['_rect']` to `View['_viewRect']`.
     */
    protected _rawTransformable: Transformable;
    private _rawTransform;
    /**
     * This is a user specified point on the source, which will be
     * located to the center of the `View['_viewRect']`.
     * The unit and the origin of this point is the same as that of `[View['_rect']`.
     */
    private _center;
    private _centerOption;
    private _zoom;
    /**
     * The rect of the source, where the measure is used by "data" and "center".
     * Has nothing to do with roam/zoom.
     * The unit is defined by the source. For example,
     *  - for geo source the unit is lat/lng,
     *  - for SVG source the unit is the same as the width/height defined in SVG.
     *  - for series.graph/series.tree/series.sankey the uiit is px.
     */
    private _rect;
    /**
     * The visible rect on the canvas. Has nothing to do with roam/zoom.
     * The unit of `View['_viewRect']` is pixel of the canvas.
     */
    private _viewRect;
    private _opt;
    constructor(name?: string, opt?: {
        ecModel: GlobalModel;
        api: ExtensionAPI;
    });
    setBoundingRect(x: number, y: number, width: number, height: number): BoundingRect;
    getBoundingRect(): BoundingRect;
    /**
     * If no need to transform `View['_rect']` to `View['_viewRect']`, the calling of
     * `setViewRect` can be omitted.
     */
    setViewRect(x: number, y: number, width: number, height: number): void;
    /**
     * Transformed to particular position and size
     */
    protected _transformTo(x: number, y: number, width: number, height: number): void;
    /**
     * [NOTICE]
     *  The definition of this center has always been irrelevant to some other series center like
     *  'series-pie.center' - this center is a point on the same coord sys as `View['_rect'].x/y`,
     *  rather than canvas viewport, and the unit is not necessarily pixel (e.g., in geo case).
     *  @see {View['_center']} for details.
     */
    setCenter(centerCoord: RoamOptionMixin['center']): void;
    setZoom(zoom: number): void;
    /**
     * Get default center without roam
     */
    getDefaultCenter(): number[];
    getCenter(): number[];
    getZoom(): number;
    getRoamTransform(): matrix.MatrixArray;
    /**
     * Ensure this method is idempotent, since it should be called when
     * every relevant prop (e.g. _centerOption/_zoom/_rect/_viewRect) changed.
     */
    private _updateCenterAndZoom;
    /**
     * Update transform props on `this` based on the current
     * `this._roamTransformable` and `this._rawTransformable`.
     */
    protected _updateTransform(): void;
    getTransformInfo(): {
        roam: ViewCoordSysTransformInfoPart;
        raw: ViewCoordSysTransformInfoPart;
    };
    getViewRect(): BoundingRect;
    /**
     * Get view rect after roam transform
     */
    getViewRectAfterRoam(): BoundingRect;
    /**
     * Convert a single (lon, lat) data item to (x, y) point.
     */
    dataToPoint(data: number[], noRoam?: boolean, out?: number[]): number[];
    /**
     * Convert a (x, y) point to (lon, lat) data
     */
    pointToData(point: number[], reserved?: unknown, out?: number[]): number[];
    convertToPixel(ecModel: GlobalModel, finder: ParsedModelFinder, value: number[]): number[];
    convertFromPixel(ecModel: GlobalModel, finder: ParsedModelFinder, pixel: number[]): number[];
    /**
     * @implements
     */
    containPoint(point: number[]): boolean;
}
export default View;

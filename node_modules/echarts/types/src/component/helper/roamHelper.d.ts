import Element from 'zrender/lib/Element.js';
import type SeriesModel from '../../model/Series.js';
import ExtensionAPI from '../../core/ExtensionAPI.js';
import Group from 'zrender/lib/graphic/Group.js';
import RoamController from './RoamController.js';
import type { SeriesOption } from '../../export/option.js';
import type View from '../../coord/View.js';
import type { NullUndefined, RoamOptionMixin, Payload } from '../../util/types.js';
import { BoundingRect } from '../../util/graphic.js';
export interface ZoomLimit {
    max?: number;
    min?: number;
}
export interface RoamControllerHost {
    target: Element;
    zoom?: number;
    zoomLimit?: ZoomLimit;
}
/**
 * [CAVEAT] `updateViewOnPan` and `updateViewOnZoom` modifies the group transform directly,
 *  but the 'center' and 'zoom' in echarts option and 'View' coordinate system are not updated yet,
 *  which must be performed later in 'xxxRoam' action by calling `updateCenterAndZoom`.
 * @see {updateCenterAndZoomInAction}
 */
export declare function updateViewOnPan(controllerHost: RoamControllerHost, dx: number, dy: number): void;
export declare function updateViewOnZoom(controllerHost: RoamControllerHost, zoomDelta: number, zoomX: number, zoomY: number): void;
/**
 * A abstraction for some similar impl in roaming.
 */
export declare function updateController(seriesModel: SeriesModel<SeriesOption & RoamOptionMixin>, api: ExtensionAPI, pointerCheckerEl: Group, controller: RoamController, controllerHost: RoamControllerHost, clipRect: BoundingRect | NullUndefined): void;
export interface RoamPayload extends Payload {
    dx: number;
    dy: number;
    zoom: number;
    originX: number;
    originY: number;
}
/**
 * Should be called only in action handler.
 * @see {updateViewOnPan|updateViewOnZoom}
 */
export declare function updateCenterAndZoomInAction(view: View, payload: RoamPayload, zoomLimit?: ZoomLimit): {
    center: number[];
    zoom: number;
};
export declare function clampByZoomLimit(zoom: number, zoomLimit: ZoomLimit | NullUndefined): number;

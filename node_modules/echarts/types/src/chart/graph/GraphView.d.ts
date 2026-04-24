import { RoamPayload } from '../../component/helper/roamHelper.js';
import ChartView from '../../view/Chart.js';
import GlobalModel from '../../model/Global.js';
import ExtensionAPI from '../../core/ExtensionAPI.js';
import GraphSeriesModel from './GraphSeries.js';
declare class GraphView extends ChartView {
    static readonly type = "graph";
    readonly type = "graph";
    private _symbolDraw;
    private _lineDraw;
    private _controller;
    private _controllerHost;
    private _firstRender;
    private _model;
    private _api;
    private _layoutTimeout;
    private _layouting;
    private _mainGroup;
    private _active;
    init(ecModel: GlobalModel, api: ExtensionAPI): void;
    render(seriesModel: GraphSeriesModel, ecModel: GlobalModel, api: ExtensionAPI): void;
    dispose(): void;
    private _startForceLayoutIteration;
    private _updateController;
    /**
     * A performance shortcut - called by action handler to update the view directly
     * without any data/visual processing (which are assumed to be unchanged), while
     * ensuring consistent behavior between internal and external action triggers.
     */
    updateViewOnPan(seriesModel: GraphSeriesModel, api: ExtensionAPI, params: Pick<RoamPayload, 'dx' | 'dy'>): void;
    /**
     * A performance shortcut - called by action handler to update the view directly
     * without any data/visual processing (which are assumed to be unchanged), while
     * ensuring consistent behavior between internal and external action triggers.
     */
    updateViewOnZoom(seriesModel: GraphSeriesModel, api: ExtensionAPI, params: Pick<RoamPayload, 'zoom' | 'originX' | 'originY'>): void;
    private _updateNodeAndLinkScale;
    updateLayout(seriesModel: GraphSeriesModel): void;
    remove(): void;
    /**
     * Get thumbnail data structure only if supported.
     */
    private _getThumbnailInfo;
    private _updateThumbnailWindow;
    private _renderThumbnail;
}
export default GraphView;

import SankeySeriesModel from './SankeySeries.js';
import ChartView from '../../view/Chart.js';
import GlobalModel from '../../model/Global.js';
import ExtensionAPI from '../../core/ExtensionAPI.js';
declare class SankeyView extends ChartView {
    static readonly type = "sankey";
    readonly type = "sankey";
    private _model;
    private _mainGroup;
    private _focusAdjacencyDisabled;
    private _data;
    private _controller;
    private _controllerHost;
    init(ecModel: GlobalModel, api: ExtensionAPI): void;
    render(seriesModel: SankeySeriesModel, ecModel: GlobalModel, api: ExtensionAPI): void;
    dispose(): void;
    private _updateViewCoordSys;
}
export default SankeyView;

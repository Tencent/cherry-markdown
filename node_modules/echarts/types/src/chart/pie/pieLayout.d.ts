import GlobalModel from '../../model/Global.js';
import ExtensionAPI from '../../core/ExtensionAPI.js';
import PieSeriesModel from './PieSeries.js';
export default function pieLayout(seriesType: 'pie', ecModel: GlobalModel, api: ExtensionAPI): void;
export declare const getSeriesLayoutData: (hostObj: PieSeriesModel) => {
    startAngle: number;
    endAngle: number;
    clockwise: boolean;
    cx: number;
    cy: number;
    r: number;
    r0: number;
};

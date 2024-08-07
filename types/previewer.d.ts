import Cherry from '../src/Cherry.js';
export type AfterUpdateCallbackFunc = () => void;

export interface PreviewerOptions {
  /** previewer 绑定的 DOM */
  previewerDom: HTMLDivElement;
  /** editor或previewer所占宽度比例的最小值 */
  minBlockPercentage: number;
  /**  */
  value: string;
  /**  */
  afterUpdateCallBack: AfterUpdateCallbackFunc[];
  /** */
  isPreviewOnly: boolean;
  /**  */
  previewerCache: {
    html: string;
    htmlChanged: boolean;
    layout: Record<string, any>;
  };
  /** */
  virtualDragLineDom: HTMLDivElement;
  /** */
  editorMaskDom: HTMLDivElement;
  /** */
  previewerMaskDom: HTMLDivElement;
  /** 是否开启预览区域菜单 */
  enablePreviewerBubble?: boolean;
  $cherry?: Cherry;
  // 配置图片懒加载的逻辑
  lazyLoadImg: {
    // 加载图片时如果需要展示loaing图，则配置loading图的地址
    loadingImgPath: string;
    // 同一时间最多有几个图片请求，最大同时加载6张图片
    maxNumPerTime: 1 | 2 | 3 | 4 | 5 | 6,
    // 不进行懒加载处理的图片数量，如果为0，即所有图片都进行懒加载处理， 如果设置为-1，则所有图片都不进行懒加载处理
    noLoadImgNum: number,
    // 首次自动加载几张图片（不论图片是否滚动到视野内），autoLoadImgNum = -1 表示会自动加载完所有图片
    autoLoadImgNum: -1 | number;
    // 针对加载失败的图片 或 beforeLoadOneImgCallback 返回false 的图片，最多尝试加载几次，为了防止死循环，最多5次。以图片的src为纬度统计重试次数
    maxTryTimesPerSrc: 0 | 1 | 2 | 3 | 4 | 5,
    // 加载一张图片之前的回调函数，函数return false 会终止加载操作
    beforeLoadOneImgCallback: (img: HTMLImageElement) => void | boolean;
    // 加载一张图片失败之后的回调函数
    failLoadOneImgCallback: (img: HTMLImageElement) => void;
    // 加载一张图片之后的回调函数，如果图片加载失败，则不会回调该函数
    afterLoadOneImgCallback: (img: HTMLImageElement) => void;
    // 加载完所有图片后调用的回调函数
    afterLoadAllImgCallback: () => void;
  };
}

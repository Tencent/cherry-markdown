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
}

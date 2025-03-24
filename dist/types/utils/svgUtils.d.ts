/**
 * @typedef {Object} Svg2ImgOptions
 * @property {string=} filename 文件名
 * @property {number=} width 宽度
 * @property {number=} height 高度
 * @property {number=} scale 缩放比例
 * @property {number=} quality 图片质量
 * @property {string=} backgroundColor 背景颜色
 * @property {"svg" | "png" | "jpg"=} format 图片格式
 * @property {string=} encoderOptions 编码器选项
 * @property {string=} mimeType mime类型
 * @property {string=} type 类型
 * @property {string=} crossOrigin 跨域
 */
/**
 * svg转img
 * @param {SVGSVGElement} svgElement
 * @param {Svg2ImgOptions} options
 */
export function svg2img(svgElement: SVGSVGElement, options?: Svg2ImgOptions): void;
/**
 * 获取带xmlns的svg字符串
 * @param {SVGSVGElement} svgElement svg元素
 * @returns {string}
 */
export function getSvgString(svgElement: SVGSVGElement): string;
/**
 * 下载svg
 * @param {SVGSVGElement} svgElement svg元素
 * @param {string} filename 文件名
 */
export function downloadSvg(svgElement: SVGSVGElement, filename: string): void;
export type Svg2ImgOptions = {
    /**
     * 文件名
     */
    filename?: string | undefined;
    /**
     * 宽度
     */
    width?: number | undefined;
    /**
     * 高度
     */
    height?: number | undefined;
    /**
     * 缩放比例
     */
    scale?: number | undefined;
    /**
     * 图片质量
     */
    quality?: number | undefined;
    /**
     * 背景颜色
     */
    backgroundColor?: string | undefined;
    /**
     * 图片格式
     */
    format?: ("svg" | "png" | "jpg") | undefined;
    /**
     * 编码器选项
     */
    encoderOptions?: string | undefined;
    /**
     * mime类型
     */
    mimeType?: string | undefined;
    /**
     * 类型
     */
    type?: string | undefined;
    /**
     * 跨域
     */
    crossOrigin?: string | undefined;
};

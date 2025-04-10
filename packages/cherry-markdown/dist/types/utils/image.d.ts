export default imgAltHelper;
declare namespace imgAltHelper {
    /**
     * 提取alt部分的扩展属性
     * @param {string} alt 图片引用中的alt部分
     * @returns
     */
    function processExtendAttributesInAlt(alt: string): string;
    /**
     * 提取alt部分的扩展属性
     * @param {string} alt 图片引用中的alt部分
     * @returns
     */
    function processExtendAttributesInAlt(alt: string): string;
    /**
     * 提取alt部分的扩展样式
     * @param {string} alt 图片引用中的alt部分
     * @returns {{extendStyles:string, extendClasses:string}}
     */
    function processExtendStyleInAlt(alt: string): {
        extendStyles: string;
        extendClasses: string;
    };
    /**
     * 提取alt部分的扩展样式
     * @param {string} alt 图片引用中的alt部分
     * @returns {{extendStyles:string, extendClasses:string}}
     */
    function processExtendStyleInAlt(alt: string): {
        extendStyles: string;
        extendClasses: string;
    };
    /**
     * 从alt中提取对齐方式信息
     * @param {string} alt
     * @returns {string}
     */
    function $getAlignment(alt: string): string;
    /**
     * 从alt中提取对齐方式信息
     * @param {string} alt
     * @returns {string}
     */
    function $getAlignment(alt: string): string;
}

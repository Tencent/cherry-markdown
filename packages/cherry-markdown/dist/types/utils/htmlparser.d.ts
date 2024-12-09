export default htmlParser;
declare namespace htmlParser {
    /**
     * 入口函数，负责将传入的html字符串转成对应的markdown源码
     * @param {string} htmlStr
     * @returns {string} 对应的markdown源码
     */
    function run(htmlStr: string): string;
    /**
     * 入口函数，负责将传入的html字符串转成对应的markdown源码
     * @param {string} htmlStr
     * @returns {string} 对应的markdown源码
     */
    function run(htmlStr: string): string;
    /**
     * 解析html语法树
     * @param {Array} arr
     * @returns {string} 对应的markdown源码
     */
    function $dealHtml(arr: any[]): string;
    /**
     * 解析html语法树
     * @param {Array} arr
     * @returns {string} 对应的markdown源码
     */
    function $dealHtml(arr: any[]): string;
    /**
     * 处理html标签内容
     * @param {object} temObj
     * @param {string} returnString
     */
    function $handleTagObject(temObj: any, returnString: string): string;
    /**
     * 处理html标签内容
     * @param {object} temObj
     * @param {string} returnString
     */
    function $handleTagObject(temObj: any, returnString: string): string;
    /**
     * 解析具体的html标签
     * @param {HTMLElement} obj
     * @returns {string} 对应的markdown源码
     */
    function $dealTag(obj: HTMLElement): string;
    /**
     * 解析具体的html标签
     * @param {HTMLElement} obj
     * @returns {string} 对应的markdown源码
     */
    function $dealTag(obj: HTMLElement): string;
    /**
     * 解析代码块
     * 本函数认为代码块是由text标签和li标签组成的
     * @param {HTMLElement} obj
     * @returns {string} 对应的markdown源码
     */
    function $dealCodeTag(obj: HTMLElement): string;
    /**
     * 解析代码块
     * 本函数认为代码块是由text标签和li标签组成的
     * @param {HTMLElement} obj
     * @returns {string} 对应的markdown源码
     */
    function $dealCodeTag(obj: HTMLElement): string;
    namespace htmlParser {
        const attrRE: RegExp;
        namespace lookup {
            const area: boolean;
            const base: boolean;
            const br: boolean;
            const col: boolean;
            const embed: boolean;
            const hr: boolean;
            const img: boolean;
            const video: boolean;
            const input: boolean;
            const keygen: boolean;
            const link: boolean;
            const menuitem: boolean;
            const meta: boolean;
            const param: boolean;
            const source: boolean;
            const track: boolean;
            const wbr: boolean;
        }
        const tagRE: RegExp;
        const empty: any;
        function parseTags(tag: any): {
            type: string;
            name: string;
            voidElement: boolean;
            attrs: {};
            children: any[];
        };
        function parseTags(tag: any): {
            type: string;
            name: string;
            voidElement: boolean;
            attrs: {};
            children: any[];
        };
        function parseHtml(html: any, options: any): any[];
        function parseHtml(html: any, options: any): any[];
    }
    namespace tagParser {
        const formatEngine: {};
        /**
         * 解析p标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function pParser(obj: HTMLElement, str: string): string;
        /**
         * 解析p标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function pParser(obj: HTMLElement, str: string): string;
        /**
         * 解析div标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function divParser(obj: HTMLElement, str: string): string;
        /**
         * 解析div标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function divParser(obj: HTMLElement, str: string): string;
        /**
         * 解析span标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function spanParser(obj: HTMLElement, str: string): string;
        /**
         * 解析span标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function spanParser(obj: HTMLElement, str: string): string;
        /**
         * 解析code标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @param {boolean} isBlock 是否强制为代码块
         * @returns {string} str
         */
        function codeParser(obj: HTMLElement, str: string, isBlock?: boolean): string;
        /**
         * 解析code标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @param {boolean} isBlock 是否强制为代码块
         * @returns {string} str
         */
        function codeParser(obj: HTMLElement, str: string, isBlock?: boolean): string;
        /**
         * 解析br标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function brParser(obj: HTMLElement, str: string): string;
        /**
         * 解析br标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function brParser(obj: HTMLElement, str: string): string;
        /**
         * 解析img标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function imgParser(obj: HTMLElement, str: string): string;
        /**
         * 解析img标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function imgParser(obj: HTMLElement, str: string): string;
        /**
         * 解析video标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function videoParser(obj: HTMLElement, str: string): string;
        /**
         * 解析video标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function videoParser(obj: HTMLElement, str: string): string;
        /**
         * 解析b标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function bParser(obj: HTMLElement, str: string): string;
        /**
         * 解析b标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function bParser(obj: HTMLElement, str: string): string;
        /**
         * 解析i标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function iParser(obj: HTMLElement, str: string): string;
        /**
         * 解析i标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function iParser(obj: HTMLElement, str: string): string;
        /**
         * 解析strike标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function strikeParser(obj: HTMLElement, str: string): string;
        /**
         * 解析strike标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function strikeParser(obj: HTMLElement, str: string): string;
        /**
         * 解析del标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function delParser(obj: HTMLElement, str: string): string;
        /**
         * 解析del标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function delParser(obj: HTMLElement, str: string): string;
        /**
         * 解析u标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function uParser(obj: HTMLElement, str: string): string;
        /**
         * 解析u标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function uParser(obj: HTMLElement, str: string): string;
        /**
         * 解析a标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function aParser(obj: HTMLElement, str: string): string;
        /**
         * 解析a标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function aParser(obj: HTMLElement, str: string): string;
        /**
         * 解析sup标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function supParser(obj: HTMLElement, str: string): string;
        /**
         * 解析sup标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function supParser(obj: HTMLElement, str: string): string;
        /**
         * 解析sub标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function subParser(obj: HTMLElement, str: string): string;
        /**
         * 解析sub标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function subParser(obj: HTMLElement, str: string): string;
        /**
         * 解析td标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function tdParser(obj: HTMLElement, str: string): string;
        /**
         * 解析td标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function tdParser(obj: HTMLElement, str: string): string;
        /**
         * 解析tr标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function trParser(obj: HTMLElement, str: string): string;
        /**
         * 解析tr标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function trParser(obj: HTMLElement, str: string): string;
        /**
         * 解析th标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function thParser(obj: HTMLElement, str: string): string;
        /**
         * 解析th标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function thParser(obj: HTMLElement, str: string): string;
        /**
         * 解析thead标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function theadParser(obj: HTMLElement, str: string): string;
        /**
         * 解析thead标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function theadParser(obj: HTMLElement, str: string): string;
        /**
         * 解析table标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function tableParser(obj: HTMLElement, str: string): string;
        /**
         * 解析table标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function tableParser(obj: HTMLElement, str: string): string;
        /**
         * 解析li标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function liParser(obj: HTMLElement, str: string): string;
        /**
         * 解析li标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function liParser(obj: HTMLElement, str: string): string;
        /**
         * 解析ul标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function ulParser(obj: HTMLElement, str: string): string;
        /**
         * 解析ul标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function ulParser(obj: HTMLElement, str: string): string;
        /**
         * 解析ol标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function olParser(obj: HTMLElement, str: string): string;
        /**
         * 解析ol标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function olParser(obj: HTMLElement, str: string): string;
        /**
         * 解析strong标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function strongParser(obj: HTMLElement, str: string): string;
        /**
         * 解析strong标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function strongParser(obj: HTMLElement, str: string): string;
        /**
         * 解析hr标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function hrParser(obj: HTMLElement, str: string): string;
        /**
         * 解析hr标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function hrParser(obj: HTMLElement, str: string): string;
        /**
         * 解析h1标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function h1Parser(obj: HTMLElement, str: string): string;
        /**
         * 解析h1标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function h1Parser(obj: HTMLElement, str: string): string;
        /**
         * 解析h2标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function h2Parser(obj: HTMLElement, str: string): string;
        /**
         * 解析h2标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function h2Parser(obj: HTMLElement, str: string): string;
        /**
         * 解析h3标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function h3Parser(obj: HTMLElement, str: string): string;
        /**
         * 解析h3标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function h3Parser(obj: HTMLElement, str: string): string;
        /**
         * 解析h4标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function h4Parser(obj: HTMLElement, str: string): string;
        /**
         * 解析h4标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function h4Parser(obj: HTMLElement, str: string): string;
        /**
         * 解析h5标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function h5Parser(obj: HTMLElement, str: string): string;
        /**
         * 解析h5标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function h5Parser(obj: HTMLElement, str: string): string;
        /**
         * 解析h6标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function h6Parser(obj: HTMLElement, str: string): string;
        /**
         * 解析h6标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function h6Parser(obj: HTMLElement, str: string): string;
        /**
         * 解析blockquote标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function blockquoteParser(obj: HTMLElement, str: string): string;
        /**
         * 解析blockquote标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function blockquoteParser(obj: HTMLElement, str: string): string;
        /**
         * 解析address标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function addressParser(obj: HTMLElement, str: string): string;
        /**
         * 解析address标签
         * @param {HTMLElement} obj
         * @param {string} str 需要回填的字符串
         * @returns {string} str
         */
        function addressParser(obj: HTMLElement, str: string): string;
        namespace styleParser {
            function colorAttrParser(style: any): any;
            function colorAttrParser(style: any): any;
            function sizeAttrParser(style: any): number | "";
            function sizeAttrParser(style: any): number | "";
            function bgColorAttrParser(style: any): string;
            function bgColorAttrParser(style: any): string;
        }
    }
    namespace mdFormatEngine {
        function convertColor(str: any, attr: any): any;
        function convertColor(str: any, attr: any): any;
        function convertSize(str: any, attr: any): any;
        function convertSize(str: any, attr: any): any;
        function convertBgColor(str: any, attr: any): any;
        function convertBgColor(str: any, attr: any): any;
        function convertBr(str: any, attr: any): any;
        function convertBr(str: any, attr: any): any;
        function convertCode(str: any, isBlock?: boolean): string;
        function convertCode(str: any, isBlock?: boolean): string;
        function convertB(str: any): string;
        function convertB(str: any): string;
        function convertI(str: any): string;
        function convertI(str: any): string;
        function convertU(str: any): string;
        function convertU(str: any): string;
        function convertImg(alt: any, src: any): string;
        function convertImg(alt: any, src: any): string;
        function convertGraph(str: any, attr: any, data: any, obj: any): string;
        function convertGraph(str: any, attr: any, data: any, obj: any): string;
        function convertVideo(str: any, src: any, poster: any, title: any): string;
        function convertVideo(str: any, src: any, poster: any, title: any): string;
        function convertA(str: any, attr: any): any;
        function convertA(str: any, attr: any): any;
        function convertSup(str: any): string;
        function convertSup(str: any): string;
        function convertSub(str: any): string;
        function convertSub(str: any): string;
        function convertTd(str: any): string;
        function convertTd(str: any): string;
        function convertTh(str: any): string;
        function convertTh(str: any): string;
        function convertTr(str: any): string;
        function convertTr(str: any): string;
        function convertThead(str: any): string;
        function convertThead(str: any): string;
        function convertTable(str: any): string;
        function convertTable(str: any): string;
        function convertLi(str: any): string;
        function convertLi(str: any): string;
        function convertUl(str: any): string;
        function convertUl(str: any): string;
        function convertOl(str: any): string;
        function convertOl(str: any): string;
        function convertStrong(str: any): string;
        function convertStrong(str: any): string;
        function convertStrike(str: any): string;
        function convertStrike(str: any): string;
        function convertDel(str: any): string;
        function convertDel(str: any): string;
        function convertHr(str: any): string;
        function convertHr(str: any): string;
        function convertH1(str: any): string;
        function convertH1(str: any): string;
        function convertH2(str: any): string;
        function convertH2(str: any): string;
        function convertH3(str: any): string;
        function convertH3(str: any): string;
        function convertH4(str: any): string;
        function convertH4(str: any): string;
        function convertH5(str: any): string;
        function convertH5(str: any): string;
        function convertH6(str: any): string;
        function convertH6(str: any): string;
        function convertBlockquote(str: any): string;
        function convertBlockquote(str: any): string;
        function convertAddress(str: any): string;
        function convertAddress(str: any): string;
    }
    /**
     * 清除整段的样式、方便编辑
     * 暂时先屏蔽字体色和背景色
     * @param {Array} htmlparsedArrays 由HTMLElement组成的数组
     */
    function paragraphStyleClear(htmlparsedArrays: any[]): any[];
    /**
     * 清除整段的样式、方便编辑
     * 暂时先屏蔽字体色和背景色
     * @param {Array} htmlparsedArrays 由HTMLElement组成的数组
     */
    function paragraphStyleClear(htmlparsedArrays: any[]): any[];
    /**
     * 非空子元素数量
     */
    function notEmptyTagCount(htmlItem: any): number;
    /**
     * 非空子元素数量
     */
    function notEmptyTagCount(htmlItem: any): number;
    function clearChildColorAttrs(htmlItems: any): void;
    function clearChildColorAttrs(htmlItems: any): void;
    function clearSelfNodeColorAttrs(htmlItem: any): void;
    function clearSelfNodeColorAttrs(htmlItem: any): void;
    function forEachHtmlParsedItems(htmlItems: any, cb: any): void;
    function forEachHtmlParsedItems(htmlItems: any, cb: any): void;
}

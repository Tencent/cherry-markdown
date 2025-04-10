/**
 * 搜索功能
 */
export default class Search extends MenuBase {
    constructor($cherry: any);
    shortcutKeyMap: {
        [x: string]: {
            hookName: string;
            aliasName: any;
        };
    };
    searchBox: SearchBox;
    searchBoxInit: boolean;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @param {string} shortKey 快捷键参数，本函数不处理这个参数
     */
    onClick(selection: string, shortKey?: string): void;
}
import MenuBase from "@/toolbars/MenuBase";
import SearchBox from "@/utils/cm-search-replace";

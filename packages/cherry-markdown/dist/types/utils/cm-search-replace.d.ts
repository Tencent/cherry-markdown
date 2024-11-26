/**
 * Search and replace widget
 * https://github.com/L-Focus/cm-search-replace
 * 自己魔改下，从而实现关掉快捷键的功能
 */
export default class SearchBox {
    init(cm: any): void;
    cm: any;
    element: ChildNode;
    activeInput: any;
    commands: {
        toggleRegexpMode: () => void;
        toggleCaseSensitive: () => void;
        toggleWholeWords: () => void;
    };
    addHtml(): ChildNode;
    addStyle(): void;
    initElements(el: any): void;
    searchBox: any;
    replaceBox: any;
    searchOptions: any;
    regExpOption: any;
    caseSensitiveOption: any;
    wholeWordOption: any;
    searchInput: any;
    replaceInput: any;
    bindKeys(): void;
    $syncOptions(): void;
    find(skipCurrent: any, backwards: any): void;
    $find(value: any, options: any, callback: any): void;
    findNext(): void;
    findPrev(): void;
    findAll(): void;
    replace(): void;
    replaceAndFindNext(): void;
    replaceAll(): void;
    toggleReplace(): void;
    isReplace: any;
    hide(): void;
    isVisible(): boolean;
    show(value: any, isReplace: any): void;
    isFocused(): boolean;
    doSearch(cm: any, value: any, caseSensitive: any): void;
    parseString(string: any): any;
    parseQuery(query: any): any;
    startSearch(cm: any, state: any, query: any, caseSensitive: any): void;
    queryCaseInsensitive(query: any, caseSensitive: any): boolean;
    searchOverlay(query: any, caseInsensitive: any): {
        token(stream: any): string;
    };
    getSearchState(cm: any): any;
    clearSearch(cm: any): void;
    updateCount(): void;
}

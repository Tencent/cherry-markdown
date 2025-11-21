/**
 * Search and replace widget
 *  Redevelopment Based : https://github.com/L-Focus/cm-search-replace, License:None  =>
 * https://github.com/zhuhs/codemirror-search-replace, License:None  =>
 * https://github.com/coderaiser/cm-searchbox, License: https://github.com/coderaiser/cm-searchbox/blob/master/LICENSE =>
 * https://github.com/ajaxorg/ace License: https://github.com/ajaxorg/ace/blob/master/LICENSE
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
export default class SearchBox {
    /**
     * @param {object} $cherry Cherry实例
     */
    constructor($cherry: object);
    $cherry: any;
    init(cm: any): void;
    cm: any;
    element: ChildNode;
    activeInput: any;
    commands: {
        toggleRegexpMode: () => void;
        toggleCaseSensitive: () => void;
        toggleWholeWords: () => void;
    };
    addEventListeners(): void;
    addHtml(): ChildNode;
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
    updateLocaleStrings(): void;
}

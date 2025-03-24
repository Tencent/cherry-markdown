/**
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @typedef Formula
 * @property {string} name
 * @property {string} latex 为空则表示分类
 * @property {string=} description 可选值，如果不传，则不显示描述
 * @property {string=} formulaStyle 可选值，如果不传，则显示默认样式
 * @property {string=} formulaClass 可选值，如果不传，则显示默认样式
 * @property {string=} img 可选值，如果不传，则显示name，否则显示img
 * @property {string=} imgStyle 可选值，如果不传，则显示默认样式
 * @property {string=} imgClass 可选值，如果不传，则显示默认样式
 */
/**
 * @typedef FormulaSubCategory
 * @property {string} title
 * @property {string=} img
 * @property {Formula[]} formulas
 */
/**
 * @typedef FormulaMenu
 * @property {string} title
 * @property {Object.<string, FormulaSubCategory>} subCategory
 */
export default class BubbleFormula {
    constructor(options?: {});
    /**
     * @type {Object.<string, FormulaMenu>}
     * @see https://github.com/QianJianTech/LaTeXLive/blob/master/json/map_input.json
     */
    formulaConfig: {
        [x: string]: FormulaMenu;
    };
    /**
     * 是否显示 www.latexlive.com 的外链
     */
    showLatexLive: boolean;
    /**
     * 点击具体公式后的回调函数
     * @param {string} latex
     */
    afterClick(latex: string): void;
    generateBubbleFormulaHtmlStr(): string;
    init(): void;
    dom: HTMLDivElement;
    /**
     * 显示插入公式面板
     * @param {function(string): void} callback
     */
    show(callback: (arg0: string) => void): void;
    hide(): void;
    isShow(): boolean;
    isHide(): boolean;
    initEventListeners(): void;
    /**
     * 处理tabs点击事件
     * @param {Event} evt
     */
    handleClickFormulaTabs(evt: Event): void;
    /**
     * 处理二级分类点击事件
     * @param {Event} evt
     */
    handleClickFormulaSelect(evt: Event): void;
}
export type Formula = {
    name: string;
    /**
     * 为空则表示分类
     */
    latex: string;
    /**
     * 可选值，如果不传，则不显示描述
     */
    description?: string | undefined;
    /**
     * 可选值，如果不传，则显示默认样式
     */
    formulaStyle?: string | undefined;
    /**
     * 可选值，如果不传，则显示默认样式
     */
    formulaClass?: string | undefined;
    /**
     * 可选值，如果不传，则显示name，否则显示img
     */
    img?: string | undefined;
    /**
     * 可选值，如果不传，则显示默认样式
     */
    imgStyle?: string | undefined;
    /**
     * 可选值，如果不传，则显示默认样式
     */
    imgClass?: string | undefined;
};
export type FormulaSubCategory = {
    title: string;
    img?: string | undefined;
    formulas: Formula[];
};
export type FormulaMenu = {
    title: string;
    subCategory: {
        [x: string]: FormulaSubCategory;
    };
};

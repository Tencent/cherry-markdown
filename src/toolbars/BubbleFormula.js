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
  /**
   * @type {Object.<string, FormulaMenu>}
   */
  formulaConfig = {};

  /**
   * 点击具体公式后的回调函数
   * @param {string} latex
   */
  afterClick(latex) {}

  constructor() {
    this.init();
    this.initEventListeners();
  }

  generateBubbleFormulaHtmlStr() {
    const entries = Object.entries(this.formulaConfig || {});
    const liStr = entries
      .map(
        ([menuKey, { title }], index) =>
          `<li class="cherry-insert-formula-tab${
            index === 0 ? ' active' : ''
          }" data-name="${menuKey}"><span>${title}</span></li>`,
      )
      .join('');
    const ulStr = `<ul class="cherry-insert-formula-tabs">${liStr}</ul>`;
    const formulaSelect = entries
      .map(([formulaMenuKey, formulaMenu], index) => {
        const formulaMenuStr = Object.entries(formulaMenu?.subCategory || {})
          ?.map(([subCategoryKey, subCategory]) => {
            const formulaCategaryFuncInnerStr = subCategory?.formulas
              ?.map((formula) => {
                if (formula.latex === '') {
                  return `<div class="cherry-insert-formula-categary__func-categary">${formula.name}</div>`;
                }
                let imgStr = '';
                if (formula.img) {
                  imgStr = `<img src="${formula.img}" class="formula-func-img${
                    formula.imgClass ? ` ${formula.imgClass}` : ''
                  }"  alt="${formula.name}" ${formula.imgStyle ? `style="${formula.imgStyle}"` : ''}>`;
                }
                return `<div class="cherry-insert-formula-categary__func-item${
                  formula.formulaClass ? formula.formulaClass : ''
                }" data-formula-code="${formula.latex}" ${
                  formula.formulaStyle ? `style="${formula.formulaStyle}"` : ''
                }>${imgStr || formula.name}</div>`;
              })
              .join('');
            const formulaCategaryFuncStr = `<div class="cherry-insert-formula-categary__func no-scrollbar" data-name="${subCategoryKey}">${formulaCategaryFuncInnerStr}</div>`;
            const formulaCategaryBtnStr = `<button class="cherry-insert-formula-categary__btn btn-light" data-name="${subCategoryKey}">${subCategory.title}</button>`;
            return `<div class="cherry-insert-formula-categary" data-name="${subCategoryKey}" title="${subCategory.title}">${formulaCategaryBtnStr}${formulaCategaryFuncStr}</div>`;
          })
          .join('');
        return `<div class="cherry-insert-formula-select formula-${formulaMenuKey} no-scrollbar${
          index === 0 ? ' active' : ''
        }" data-name="${formulaMenuKey}">${formulaMenuStr}</div>`;
      })
      .join('');
    return `${ulStr}${formulaSelect}`;
  }

  init() {
    this.dom = document.createElement('div');
    this.dom.className = ['cherry-insert-formula', 'cherry-insert-formula-wrappler'].join(' ');
    this.dom.innerHTML = this.generateBubbleFormulaHtmlStr();
    // 实例化后，将容器插入到富文本编辑器中，默认隐藏
    this.dom.style.display = 'none';
  }

  /**
   * 显示插入公式面板
   * @param {function(string): void} callback
   */
  show(callback) {
    this.dom.style.removeProperty('display');
    this.afterClick = callback;
  }

  hide() {
    this.dom.style.display = 'none';
  }

  isShow() {
    return this.dom.style.display === 'block';
  }

  isHide() {
    return this.dom.style.display === 'none';
  }

  initEventListeners() {
    this.dom
      .querySelector('.cherry-insert-formula-tabs')
      ?.addEventListener('click', this.handleClickFormulaTabs.bind(this));
    this.dom
      .querySelectorAll('.cherry-insert-formula-select')
      ?.forEach((element) => element?.addEventListener('click', this.handleClickFormulaSelect.bind(this)));
  }

  /**
   * 处理tabs点击事件
   * @param {Event} evt
   */
  handleClickFormulaTabs(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const { target } = evt;
    // 只需要 li 和 span 标签的点击事件，过滤掉ul自身的点击事件
    if (target instanceof HTMLLIElement || target instanceof HTMLSpanElement) {
      /** @type {HTMLElement} */
      const tab = target instanceof HTMLSpanElement ? target.parentElement : target;
      const tabName = tab.dataset.name;
      const select = document.querySelector(`.cherry-insert-formula-select[data-name=${tabName}]`);
      const activeTab = document.querySelector('.cherry-insert-formula-tab.active');
      const activeSelect = document.querySelector('.cherry-insert-formula-select.active');
      activeTab?.classList.remove('active');
      activeSelect?.classList.remove('active');
      tab.classList.add('active');
      select.classList.add('active');
    }
  }

  /**
   * 处理二级分类点击事件
   * @param {Event} evt
   */
  handleClickFormulaSelect(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const { target } = evt;
    /** @type {HTMLDivElement} */
    let targetElement = null;
    if (target instanceof HTMLImageElement && target.parentElement instanceof HTMLDivElement) {
      if (target.parentElement.classList?.contains('cherry-insert-formula-categary__func-item')) {
        targetElement = target.parentElement;
      }
    } else if (target instanceof HTMLDivElement) {
      if (target?.classList.contains('cherry-insert-formula-categary__func-item')) {
        targetElement = target;
      }
    }

    if (targetElement !== null) {
      const { formulaCode = '' } = targetElement.dataset;
      this.afterClick(formulaCode);
      this.hide();
    }
  }
}

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
const createTableItem = (dataset, className) => {
  const dom = document.createElement('td');
  dom.className = className || 'table-item';
  Object.keys(dataset).forEach((prop) => {
    dom.dataset[prop] = dataset[prop];
  });
  return dom;
};

/**
 * 插入表格的辅助面板
 */
export default class BubbleTableMenu {
  constructor({ row, col }, className) {
    this.init(row, col, className);
    this.initEventListeners();
    this.afterClick = (...args) => {};
  }

  init(row, col, className) {
    const container = document.createElement('table');
    const cellArr = [];
    const classNames = ['cherry-insert-table-menu', 'cherry-dropdown'];
    container.className = classNames.join(' ');
    for (let r = 1; r <= row; r++) {
      const rowContainer = document.createElement('tr');
      rowContainer.className = 'cherry-insert-table-menu-row';
      cellArr[r - 1] = [];
      for (let c = 1; c <= col; c++) {
        const cell = createTableItem({ row: r, col: c }, 'cherry-insert-table-menu-item');
        rowContainer.appendChild(cell);
        cellArr[r - 1][c - 1] = cell;
      }
      container.appendChild(rowContainer);
    }
    container.style.display = 'none';
    container.addEventListener('EditorHideToolbarSubMenu', () => {
      this.hide();
    });
    this.dom = container;
    this.cell = cellArr;
    this.maxRow = row;
    this.maxCol = col;
    this.activeRow = 0;
    this.activeCol = 0;
    return this.dom;
  }

  initEventListeners() {
    this.dom.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
    // 不能用click
    this.dom.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  setActiveCell(row, col) {
    if (this.activeRow === row && this.activeCol === col) {
      return;
    }
    const minRow = Math.min(this.activeRow, row);
    const maxRow = Math.max(this.activeRow, row);
    if (minRow !== maxRow) {
      // 先清空或按照历史列数增减active类
      for (let r = maxRow; r > minRow; r--) {
        for (let c = 1; c <= this.activeCol; c++) {
          this.cell[r - 1][c - 1].classList.toggle('active');
        }
      }
    }
    const minCol = Math.min(this.activeCol, col);
    const maxCol = Math.max(this.activeCol, col);
    if (minCol !== maxCol) {
      for (let c = maxCol; c > minCol; c--) {
        for (let r = 1; r <= row; r++) {
          this.cell[r - 1][c - 1].classList.toggle('active');
        }
      }
    }
    this.activeRow = row;
    this.activeCol = col;
  }

  handleMouseMove(event) {
    let { target } = event;
    if (target === this.dom) {
      return;
    }
    if (!target.classList.contains('cherry-insert-table-menu-item')) {
      target = target.querySelector('.cherry-insert-table-menu-item');
    }
    if (!target) {
      return;
    }
    this.setActiveCell(target.dataset.row, target.dataset.col);
  }

  handleMouseUp(event) {
    let { target } = event;
    if (target === this.dom) {
      this.afterClick(this.activeRow, this.activeCol);
      this.hide();
      return;
    }
    if (!target.classList.contains('cherry-insert-table-menu-item')) {
      target = target.querySelector('.cherry-insert-table-menu-item');
    }
    if (!target) {
      this.afterClick(this.activeRow, this.activeCol);
      this.hide();
      return;
    }
    // 正中单元格时才使用target的dataset
    this.afterClick(this.activeRow, this.activeCol);
    this.hide();
  }

  show(callback) {
    this.dom.style.display = 'block';
    this.afterClick = callback;
  }

  hide() {
    this.dom.style.display = 'none';
    // reset active status
    for (let r = 0; r < this.maxRow; r++) {
      for (let c = 0; c < this.maxCol; c++) {
        this.cell[r][c].classList.remove('active');
      }
    }
    this.activeRow = 0;
    this.activeCol = 0;
  }
}

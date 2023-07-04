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
 * Myers' Diff 算法
 * 用来对两个数列/字符串做diff,得到增/删元素的最简形式
 * 参考文献: http://www.xmailserver.org/diff2.pdf
 */

import Logger from '@/Logger';

export default class MyersDiff {
  constructor(newObj, oldObj, getElement) {
    this.options = {
      newObj, // 用于diff的新列表/字符串
      oldObj, // 用于diff的旧列表/字符串
      getElement, // 获取用于比较的元素的函数
    };
  }

  /**
   * 执行diff操作
   */
  doDiff() {
    const snakes = this.findSnakes(this.options.newObj, this.options.oldObj);
    const result = this.assembleResult(snakes, this.options.newObj, this.options.oldObj);
    return result;
  }

  /**
   * 用于判断列表/字符串元素是否相等的判据函数
   */
  getElement(obj, index) {
    if (typeof this.options.getElement === 'function') {
      // 支持传入自定义的比较函数
      return this.options.getElement(obj, index);
    }
    return obj[index];
  }

  /**
   * 寻找从起点到终点的折线
   */
  findSnakes(newObj, oldObj) {
    const newLen = newObj.length || 0; // 新diff对象的长度
    const oldLen = oldObj.length || 0; // 旧diff对象的长度
    const lengthSum = newLen + oldLen; // 长度之和
    const v = { 1: 0 }; // "每个节点的深度值"的缓存对象
    const allSnakes = { 0: { 1: 0 } }; // "每个节点对应的折线"的缓存对象

    // d是起点到对应节点的编辑距离,简而言之,若把新增一个节点或删除一个节点都视作一次"操作",那么通过d次操作可以从起点到达对应节点
    for (let d = 0; d <= lengthSum; d++) {
      const tmp = {};
      for (let k = -d; k <= d; k += 2) {
        // 转换坐标系,k可以视为对应节点(x,y)的x坐标值减y坐标值
        const down = k === -d || (k !== d && v[k - 1] < v[k + 1]);
        const kPrev = down ? k + 1 : k - 1;

        const xStart = v[kPrev];
        // let yStart = xStart - kPrev;
        const xMid = down ? xStart : xStart + 1;
        const yMid = xMid - k;
        let xEnd = xMid;
        let yEnd = yMid;

        while (xEnd < oldLen && yEnd < newLen && this.getElement(oldObj, xEnd) === this.getElement(newObj, yEnd)) {
          xEnd += 1;
          yEnd += 1;
        }

        v[k] = xEnd;
        tmp[k] = xEnd;

        if (xEnd >= oldLen && yEnd >= newLen) {
          // 成功抵达终点
          allSnakes[d] = tmp;
          return this.$backtraceSnakes(allSnakes, newLen, oldLen, d);
        }
      }
      allSnakes[d] = tmp;
    }

    return [];
  }

  /**
   * 回溯,找出关键路径对应的折线
   */
  $backtraceSnakes(allSnakes, newLen, oldLen, d) {
    const keySnakes = [];
    const p = { x: oldLen, y: newLen }; // 模拟节点,从终点开始

    // 执行回溯,倒回起点,找到并记录关键路径
    for (let i = d; i > 0; i--) {
      const v = allSnakes[i];
      const vPrev = allSnakes[i - 1];
      const k = p.x - p.y;

      const xEnd = v[k];
      // let yEnd = xEnd - k;

      const down = k === -i || (k !== i && vPrev[k + 1] > vPrev[k - 1]);
      const kPrev = down ? k + 1 : k - 1;

      const xStart = vPrev[kPrev];
      const yStart = xStart - kPrev;

      const xMid = down ? xStart : xStart + 1;
      // let yMid = xMid - k;

      keySnakes.unshift({ xStart, xMid, xEnd });

      p.x = xStart;
      p.y = yStart;
    }

    return keySnakes;
  }

  /**
   * 组装出返回值
   */
  assembleResult(snakes, newObj, oldObj) {
    const grayColor = 'color: gray';
    const redColor = 'color: red';
    const greenColor = 'color: green';
    const blueColor = 'color: blue';
    let consoleStr = '';
    const args = [];
    let yOffset = 0;
    const result = []; // 返回的操作集
    let change = {}; // 本次操作
    let lastChange = {}; // 缓存上一次操作
    let firstDeleteChange = {}; // 连续删除时用来缓存最初的删除
    snakes.forEach((snake, index) => {
      let currentPos = snake.xStart;

      if (index === 0 && snake.xStart !== 0) {
        for (let j = 0; j < snake.xStart; j++) {
          consoleStr += `%c${this.getElement(oldObj, j)}, `;
          args.push(grayColor);
          yOffset += 1;
        }
      }

      if (snake.xMid - snake.xStart === 1) {
        // 删除
        change = {
          type: 'delete',
          oldIndex: snake.xStart,
          newIndex: 0,
        };
        if (lastChange.type === 'delete' && lastChange.oldIndex === change.oldIndex - 1) {
          // 检测到连续删除,缓存最初的删除
          firstDeleteChange = firstDeleteChange ? lastChange : firstDeleteChange;
        }
        result.push(change);
        lastChange = change;
        consoleStr += `%c${this.getElement(oldObj, snake.xStart)}, `;
        args.push(redColor);
        currentPos = snake.xMid;
      } else {
        // 添加
        change = {
          type: 'insert',
          oldIndex: snake.xStart,
          newIndex: yOffset,
        };
        if (lastChange.type === 'delete' && lastChange.oldIndex === change.oldIndex - 1) {
          // 和上一条删除合并为"更新"
          result.pop();
          firstDeleteChange = firstDeleteChange ? lastChange : firstDeleteChange;
          change = {
            type: 'update',
            oldIndex: firstDeleteChange.oldIndex, // 合并时,更新目标定位连续删除块中的首个元素
            newIndex: yOffset,
          };
          args.push(blueColor);
        } else {
          args.push(greenColor);
        }
        firstDeleteChange = {};
        result.push(change);
        lastChange = change;
        consoleStr += `%c${this.getElement(newObj, yOffset)}, `;
        yOffset += 1;
      }

      // 不变
      for (let i = 0; i < snake.xEnd - currentPos; i++) {
        consoleStr += `%c${this.getElement(oldObj, currentPos + i)}, `;
        args.push(grayColor);
        yOffset += 1;
      }
    });
    // Logger.log(consoleStr, ...args);
    return result;
  }
}

/**
 * Copyright (C) 2021 Tencent.
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
 * Myers' Diff algorithm — ported from packages/cherry-markdown/src/utils/myersDiff.js
 * Reference: http://www.xmailserver.org/diff2.pdf
 */

export type DiffChangeType = 'insert' | 'delete' | 'update';

export interface DiffChange {
  type: DiffChangeType;
  oldIndex: number;
  newIndex: number;
}

interface Snake {
  xStart: number;
  xMid: number;
  xEnd: number;
}

type Indexable<T> = ArrayLike<T>;

export type GetElementFn<T> = (obj: Indexable<T>, index: number) => T;

interface MyersDiffOptions<T> {
  newObj: Indexable<T>;
  oldObj: Indexable<T>;
  getElement?: GetElementFn<T>;
}

export default class MyersDiff<T = unknown> {
  private options: MyersDiffOptions<T>;

  constructor(newObj: Indexable<T>, oldObj: Indexable<T>, getElement?: GetElementFn<T>) {
    this.options = { newObj, oldObj, getElement };
  }

  /** Execute the diff and return a list of change operations. */
  doDiff(): DiffChange[] {
    const snakes = this.findSnakes(this.options.newObj, this.options.oldObj);
    return this.assembleResult(snakes, this.options.newObj, this.options.oldObj);
  }

  /** Retrieve the comparable element for a given index. */
  private getElement(obj: Indexable<T>, index: number): T {
    if (typeof this.options.getElement === 'function') {
      return this.options.getElement(obj, index);
    }
    return (obj as ArrayLike<T>)[index];
  }

  /** Find the shortest edit path (snakes) from source to target. */
  private findSnakes(newObj: Indexable<T>, oldObj: Indexable<T>): Snake[] {
    const newLen = newObj.length || 0;
    const oldLen = oldObj.length || 0;
    const lengthSum = newLen + oldLen;
    const v: Record<number, number> = { 1: 0 };
    const allSnakes: Record<number, Record<number, number>> = { 0: { 1: 0 } };

    for (let d = 0; d <= lengthSum; d++) {
      const tmp: Record<number, number> = {};
      for (let k = -d; k <= d; k += 2) {
        const down = k === -d || (k !== d && v[k - 1] < v[k + 1]);
        const kPrev = down ? k + 1 : k - 1;

        const xStart = v[kPrev];
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
          allSnakes[d] = tmp;
          return this.backtraceSnakes(allSnakes, newLen, oldLen, d);
        }
      }
      allSnakes[d] = tmp;
    }

    return [];
  }

  /** Backtrace the recorded frontier to reconstruct the key path snakes. */
  private backtraceSnakes(
    allSnakes: Record<number, Record<number, number>>,
    newLen: number,
    oldLen: number,
    d: number,
  ): Snake[] {
    const keySnakes: Snake[] = [];
    const p = { x: oldLen, y: newLen };

    for (let i = d; i > 0; i--) {
      const v = allSnakes[i];
      const vPrev = allSnakes[i - 1];
      const k = p.x - p.y;

      const xEnd = v[k];

      const down = k === -i || (k !== i && vPrev[k + 1] > vPrev[k - 1]);
      const kPrev = down ? k + 1 : k - 1;

      const xStart = vPrev[kPrev];
      const yStart = xStart - kPrev;

      const xMid = down ? xStart : xStart + 1;

      keySnakes.unshift({ xStart, xMid, xEnd });

      p.x = xStart;
      p.y = yStart;
    }

    return keySnakes;
  }

  /** Turn the snake list into a compact change set. */
  private assembleResult(snakes: Snake[], _newObj: Indexable<T>, _oldObj: Indexable<T>): DiffChange[] {
    let yOffset = 0;
    const result: DiffChange[] = [];
    let change: DiffChange = { type: 'insert', oldIndex: 0, newIndex: 0 };
    let lastChange: DiffChange | Record<string, never> = {};
    let firstDeleteChange: DiffChange | Record<string, never> = {};

    snakes.forEach((snake, index) => {
      let currentPos = snake.xStart;

      if (index === 0 && snake.xStart !== 0) {
        for (let j = 0; j < snake.xStart; j++) {
          yOffset += 1;
        }
      }

      if (snake.xMid - snake.xStart === 1) {
        // delete
        change = { type: 'delete', oldIndex: snake.xStart, newIndex: 0 };
        if (
          (lastChange as DiffChange).type === 'delete' &&
          (lastChange as DiffChange).oldIndex === change.oldIndex - 1
        ) {
          firstDeleteChange =
            firstDeleteChange && (firstDeleteChange as DiffChange).type ? firstDeleteChange : lastChange;
        }
        result.push(change);
        lastChange = change;
        currentPos = snake.xMid;
      } else {
        // insert
        change = { type: 'insert', oldIndex: snake.xStart, newIndex: yOffset };
        if (
          (lastChange as DiffChange).type === 'delete' &&
          (lastChange as DiffChange).oldIndex === change.oldIndex - 1
        ) {
          // merge previous delete + this insert → update
          result.pop();
          firstDeleteChange =
            firstDeleteChange && (firstDeleteChange as DiffChange).type ? firstDeleteChange : lastChange;
          change = {
            type: 'update',
            oldIndex: (firstDeleteChange as DiffChange).oldIndex,
            newIndex: yOffset,
          };
        }
        firstDeleteChange = {};
        result.push(change);
        lastChange = change;
        yOffset += 1;
      }

      // unchanged block
      for (let i = 0; i < snake.xEnd - currentPos; i++) {
        yOffset += 1;
      }
    });
    return result;
  }
}

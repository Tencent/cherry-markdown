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
 * 三个地方的错误异常校验
 *  1. markdown 对象参数校验
 *  2. editText 用户输入校验，执行engine过程以防异常
 *  3. 自定义hook校验 对外开发者开发标准校验
 */

export const $expectTarget = (target, Constructor) => {
  if (
    (!Array.isArray(target) && typeof target !== Constructor.name.toLowerCase()) ||
    (!Array.isArray(target) && Constructor.name.toLowerCase() === 'array')
  ) {
    throw new TypeError(`parameter given must be ${Constructor.name}`);
  }

  return true;
};

export const $expectInherit = (target, parent) => {
  if (!(target instanceof parent)) {
    throw new Error('the hook does not correctly inherit');
  }
  return true;
};

export const $expectInstance = (target) => {
  if (typeof target !== 'object') {
    throw new Error('the hook must be a instance, not a class');
  }
  return true;
};

// ref: https://github.com/mdlavin/nested-error-stacks
export default class NestedError extends Error {
  constructor(message, nested) {
    super(message);
    this.name = 'Error';
    this.stack = this.buildStackTrace(nested);
  }

  buildStackTrace(nested) {
    const stack = nested && nested.stack ? nested.stack : '';
    const newStack = `${this.stack}\nCaused By: ${stack}`;
    return newStack;
  }
}

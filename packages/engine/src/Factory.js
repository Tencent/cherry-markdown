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
import SyntaxBase, { HOOKS_TYPE_LIST } from './syntax/SyntaxBase';
import ParagraphBase from './syntax/ParagraphBase';

/**
 * 属性类型匹配
 * @param {object} obj 待匹配的对象
 * @param {string} key 待匹配的属性名
 * @param {any} type 匹配的类型
 */
function matchPropTypes(obj, key, type) {
  if (typeof obj !== 'object' || !obj) {
    throw TypeError(`first argument must be a object, but get ${typeof obj}`);
  }
  if (
    !Array.isArray(type) &&
    typeof type === 'object' &&
    type !== null &&
    typeof obj[key] === 'object' &&
    obj[key] !== null
  ) {
    return Object.keys(obj[key]).every((objKey) => matchPropTypes(obj[key], objKey, type[objKey]));
  }
  if (typeof type === 'string' && typeof obj[key] === type) {
    return true;
  }
  if (typeof type === 'function' && obj[key] instanceof type) {
    return true;
  }
  if (Array.isArray(type)) {
    return type.some((type) => matchPropTypes(obj, key, type));
  }
  return false;
}

function filterOptions(options, whiteList, propTypes) {
  const filteredOptions = {};
  Object.keys(options).forEach((key) => {
    if (whiteList.indexOf(key) === -1) {
      return;
    }
    if (typeof propTypes === 'object') {
      if (matchPropTypes(options, key, propTypes[key])) {
        filteredOptions[key] = options[key];
      }
    } else if (typeof propTypes === 'string') {
      if (typeof options[key] === propTypes) {
        filteredOptions[key] = options[key];
      }
    }
  });
  return filteredOptions;
}

export function createSyntaxHook(name, type, options) {
  const BaseClass = type === HOOKS_TYPE_LIST.PAR ? ParagraphBase : SyntaxBase;
  const optionsWhiteList = ['beforeMakeHtml', 'makeHtml', 'afterMakeHtml', 'rule', 'test'];
  const filteredOptions = filterOptions(options, optionsWhiteList, 'function');
  const paragraphConfig = { needCache: options.needCache, defaultCache: options.defaultCache };
  return class CustomSyntax extends BaseClass {
    static HOOK_NAME = name;

    constructor(editorConfig = {}) {
      if (type === HOOKS_TYPE_LIST.PAR) {
        super({ needCache: !!paragraphConfig.needCache, defaultCache: paragraphConfig.defaultCache });
      } else {
        super();
      }

      this.config = editorConfig.config;
    }

    beforeMakeHtml(...args) {
      if (filteredOptions.beforeMakeHtml) {
        return filteredOptions.beforeMakeHtml.apply(this, args);
      }
      return super.beforeMakeHtml(...args);
    }

    makeHtml(...args) {
      if (filteredOptions.makeHtml) {
        return filteredOptions.makeHtml.apply(this, args);
      }
      return super.makeHtml(...args);
    }

    afterMakeHtml(...args) {
      if (filteredOptions.afterMakeHtml) {
        return filteredOptions.afterMakeHtml.apply(this, args);
      }
      return super.afterMakeHtml(...args);
    }

    test(...args) {
      if (filteredOptions.test) {
        return filteredOptions.test.apply(this, args);
      }
      return super.test(...args);
    }

    rule(...args) {
      if (filteredOptions.rule) {
        return filteredOptions.rule.apply(this, args);
      }
      return super.rule(...args);
    }
  };
}

export default createSyntaxHook;

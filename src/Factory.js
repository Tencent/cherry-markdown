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
import SyntaxBase, { HOOKS_TYPE_LIST } from './core/SyntaxBase';
import ParagraphBase from './core/ParagraphBase';
import MenuBase from './toolbars/MenuBase';

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
  // 不用检测，会存在 undefined 的情况
  // if (!Object.keys(obj).includes(key))
  // 递归
  if (
    !Array.isArray(type) &&
    typeof type === 'object' &&
    type !== null &&
    typeof obj[key] === 'object' &&
    obj[key] !== null
  ) {
    // 递归时，取对象里每个属性进行匹配，必须全部匹配才返回true
    return Object.keys(obj[key]).every((objKey) => matchPropTypes(obj[key], objKey, type[objKey]));
  }
  if (typeof type === 'string' && typeof obj[key] === type) {
    return true;
  }
  if (typeof type === 'function' && obj[key] instanceof type) {
    return true;
  }
  // 联合类型
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

export function createMenuHook(name, options) {
  const optionsWhiteList = ['subMenuConfig', 'onClick', 'shortcutKeys', 'iconName', 'icon'];
  const propTypes = {
    subMenuConfig: Array,
    onClick: 'function',
    shortcutKeys: Array,
    iconName: 'string',
    icon: [
      'string',
      {
        type: 'string',
        content: 'string',
        iconStyle: ['string', 'undefined'],
        iconClassName: ['string', 'undefined'],
      },
    ],
  };
  const filteredOptions = filterOptions(options, optionsWhiteList, propTypes);
  return class CustomMenu extends MenuBase {
    constructor(editorInstance) {
      super(editorInstance);
      if (!filteredOptions.iconName && !filteredOptions.icon) {
        this.noIcon = true;
      }
      if (filteredOptions.icon) {
        this.$currentMenuOptions.icon = filteredOptions.icon;
        this.name = name;
      } else {
        this.setName(name, filteredOptions.iconName);
      }
      this.subMenuConfig = filteredOptions.subMenuConfig || [];
    }

    onClick(...args) {
      if (filteredOptions.onClick) {
        return filteredOptions.onClick.apply(this, args);
      }
      return super.onClick(...args);
    }

    get shortcutKeys() {
      console.warn(
        'shortcutKeys will deprecated in the future, please use shortcutKeyMap instead, get more info at https://github.com/Tencent/cherry-markdown/wiki',
      );
      if (filteredOptions.shortcutKeys) {
        return filteredOptions.shortcutKeys;
      }
      return [];
    }
  };
}

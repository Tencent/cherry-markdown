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
import SyntaxBase from './SyntaxBase';
import ParagraphBase from './ParagraphBase';
import { $expectTarget } from '@/utils/error';
import Logger from '@/Logger';

/**
 * @typedef {import('~types/cherry').CherryOptions} CherryOptions
 * @typedef {import('~types/cherry').CherryEngineOptions} CherryEngineOptions
 * @typedef {import('~types/cherry').CustomSyntaxRegConfig} CustomSyntaxRegConfig
 * @typedef { (SyntaxBase | ParagraphBase) & { Cherry$$CUSTOM: true } } CustomSyntax
 * @typedef { (typeof SyntaxBase | typeof ParagraphBase) & { Cherry$$CUSTOM: true } } CustomSyntaxClass
 */

const WARN_DUPLICATED = -1;
const WARN_NOT_A_VALID_HOOK = -2;

/**
 * 处理报错信息，在dev模式下才会输出报错信息
 * @param {number} type
 * @param {any} objClass
 * @param {number} index
 */
function processWarning(type, objClass, index) {
  if (type === WARN_DUPLICATED) {
    Logger.warn(
      `Duplicate hook name [${objClass.HOOK_NAME}] found, hook [${objClass.toString()}] ${
        isNaN(index) ? '' : `at index [${index}] `
      }will not take effect.`,
    );
  } else if (type === WARN_NOT_A_VALID_HOOK) {
    Logger.warn(
      `Hook [${objClass.toString()}] ${
        isNaN(index) ? '' : `at index [${index}] `
      }is not a valid hook, and will not take effect.`,
    );
  }
}

/**
 * 是否一个合法的 HookClass
 * @param {any} HookClass
 * @returns { HookClass is (typeof SyntaxBase | typeof ParagraphBase) }
 */
function isHookValid(HookClass) {
  return isProtoOfSyntaxBase(HookClass) || isProtoOfParagraphBase(HookClass);
}

/**
 * 传入的类是否 SyntaxBase 的子类
 * @param {any} value
 * @returns { value is typeof SyntaxBase }
 */
function isProtoOfSyntaxBase(value) {
  return Object.prototype.isPrototypeOf.call(SyntaxBase, value);
}

/**
 * 传入的类是否 ParagraphBase 的子类
 * @param {any} value
 * @returns { value is typeof ParagraphBase }
 */
function isProtoOfParagraphBase(value) {
  return Object.prototype.isPrototypeOf.call(ParagraphBase, value);
}

/**
 * 是否一个配置型的自定义语法
 * @param {any} value
 * @returns { value is CustomSyntaxRegConfig }
 */
function isCustomSyntaxConfig(value) {
  const syntaxClass = /** @type {any} */ (/** @type {CustomSyntaxRegConfig} */ (value)?.syntaxClass);
  return isProtoOfSyntaxBase(syntaxClass) || isProtoOfParagraphBase(syntaxClass);
}

/**
 * 是否一个已注册的自定义语法hook类
 * @param {any} value
 * @returns { value is CustomSyntaxClass }
 */
function isRegisteredCustomSyntaxClass(value) {
  return isHookValid(value) && /** @type {CustomSyntaxClass} */ (value)?.Cherry$$CUSTOM === true;
}

/**
 * 语法注册中心
 */
export default class HookCenter {
  /**
   *
   * @param {(typeof SyntaxBase)[]} hooksConfig
   * @param {Partial<CherryOptions>} editorConfig
   */
  constructor(hooksConfig, editorConfig, cherry) {
    this.$locale = cherry.locale;
    /**
     * @property
     * @type {Record<import('./SyntaxBase').HookType, SyntaxBase[]>} hookList hook 名称 -> hook 类型的映射
     */
    this.hookList = /** @type {any} */ ({});

    /**
     * @property
     * @type {Record<string, { type: import('./SyntaxBase').HookType }>} hookNameList hook 名称 -> hook 类型的映射
     */
    this.hookNameList = {};

    $expectTarget(hooksConfig, Array);
    this.registerInternalHooks(hooksConfig, editorConfig);
    this.registerCustomHooks(editorConfig.engine.customSyntax, editorConfig);
  }

  /**
   * 注册系统默认的语法hook
   * @param {any[]} hooksConfig 在hookconfig.js里定义的配置
   * @param {Partial<CherryOptions>} editorConfig 编辑器配置
   */
  registerInternalHooks(hooksConfig, editorConfig) {
    hooksConfig.forEach(
      /**
       *
       * @param {typeof SyntaxBase} HookClass
       * @param {number} index
       */
      (HookClass, index) => {
        const result = this.register(HookClass, editorConfig);
        processWarning(result, HookClass, index);
      },
    );
  }

  /**
   * 注册第三方的语法hook
   * @param {CherryEngineOptions['customSyntax']} customHooks 用户传入的配置
   * @param {Partial<CherryOptions>} editorConfig 编辑器配置
   */
  registerCustomHooks(customHooks, editorConfig) {
    if (!customHooks) {
      return;
    }
    const hookNames = Object.keys(customHooks);
    hookNames.forEach((hookName) => {
      /** @type {number} */
      let result;
      /** @type {typeof SyntaxBase} */
      let HookClass;
      const customHookConfig = {};
      const hookClassOrConfig = customHooks[hookName];
      if (isProtoOfSyntaxBase(hookClassOrConfig)) {
        HookClass = hookClassOrConfig;
      } else if (isCustomSyntaxConfig(hookClassOrConfig)) {
        HookClass = hookClassOrConfig.syntaxClass;
        customHookConfig.force = Boolean(hookClassOrConfig.force);
        if (hookClassOrConfig.before) {
          customHookConfig.before = hookClassOrConfig.before;
        } else if (hookClassOrConfig.after) {
          customHookConfig.after = hookClassOrConfig.after;
        }
      } else {
        return;
      }
      if (isHookValid(HookClass)) {
        // 自定义Hook标识
        Object.defineProperty(HookClass, 'Cherry$$CUSTOM', {
          enumerable: false,
          configurable: false,
          writable: false,
          value: true,
        });
        result = this.register(HookClass, editorConfig, customHookConfig);
      } else {
        result = WARN_NOT_A_VALID_HOOK;
      }
      processWarning(result, HookClass, undefined);
    });
  }

  getHookList() {
    return this.hookList;
  }

  getHookNameList() {
    return this.hookNameList;
  }

  /**
   *
   * @param {((...args: any[]) => any) | typeof SyntaxBase} HookClass
   * @param {Partial<CherryOptions>} editorConfig
   * @param {Omit<CustomSyntaxRegConfig, 'syntaxClass'>} [customHookConfig]
   * @returns
   */
  register(HookClass, editorConfig, customHookConfig) {
    // filter Configs Here
    const { externals, engine } = editorConfig;
    const { syntax } = engine;

    /** @type {SyntaxBase | CustomSyntax} */
    let instance;

    /** @type {string} */
    let hookName;

    // 首先校验Hook是否合法
    if (!isHookValid(HookClass)) {
      // 可能是一个function hook
      if (typeof HookClass === 'function') {
        const funcHook = HookClass;
        instance = funcHook(editorConfig);
        if (!instance || !isHookValid(instance.constructor)) {
          return WARN_NOT_A_VALID_HOOK;
        }
        hookName = instance.getName();
      } else {
        return WARN_NOT_A_VALID_HOOK;
      }
    } else {
      hookName = HookClass.HOOK_NAME;
      // TODO: 需要考虑自定义 hook 配置的传入方式
      const config = syntax?.[hookName] || {};
      instance = new HookClass({ externals, config, globalConfig: engine.global });
      instance.afterInit(() => {
        instance.setLocale(this.$locale);
      });
    }
    // TODO: 待校验是否需要跳过禁用的自定义 hook
    // Skip Disabled Internal Hooks
    if (syntax[hookName] === false && !isRegisteredCustomSyntaxClass(HookClass)) {
      return;
    }
    // 下面处理的都是 CustomSyntax
    const hookType = instance.getType();
    if (this.hookNameList[hookName]) {
      // 内置 hook 重名
      if (!isRegisteredCustomSyntaxClass(HookClass)) {
        return WARN_DUPLICATED;
      }
      // 自定义 hook 重名且没有开启覆盖的选项
      if (!customHookConfig.force) {
        return WARN_DUPLICATED;
      }
      // 强制覆盖以前的Hook，所以需要移除
      const duplicateHookType = this.hookNameList[hookName].type;
      this.hookList[duplicateHookType] = this.hookList[duplicateHookType].filter((hook) => hook.getName() !== hookName);
    }
    this.hookNameList[hookName] = { type: hookType };
    this.hookList[hookType] = this.hookList[hookType] || [];
    // 内置Hook直接push到结尾
    if (!isRegisteredCustomSyntaxClass(HookClass)) {
      this.hookList[hookType].push(instance);
      return;
    }
    // 插入自定义Hook
    let insertIndex = -1;
    if (customHookConfig.before) {
      insertIndex = this.hookList[hookType].findIndex((hook) => hook.getName() === customHookConfig.before);
      if (insertIndex === -1) {
        Logger.warn(
          `Cannot find hook named [${customHookConfig.before}],
            custom hook [${hookName}] will append to the end of the hooks.`,
        );
      }
    } else if (customHookConfig.after) {
      insertIndex = this.hookList[hookType].findIndex((hook) => hook.getName() === customHookConfig.after);
      insertIndex === -1
        ? Logger.warn(
            `Cannot find hook named [${customHookConfig.after}],
              custom hook [${hookName}] will append to the end of the hooks.`,
          )
        : (insertIndex += 1); // 统一处理往前插入的逻辑，所以要插入某Hook之后，索引需要加一
    }
    // 无需插入或目标索引为数组结尾
    if (insertIndex < 0 || insertIndex >= this.hookList[hookType].length) {
      this.hookList[hookType].push(instance);
    } else {
      this.hookList[hookType].splice(insertIndex, 0, instance);
    }
    // console.log(this.hookList[hookType]);
  }
}

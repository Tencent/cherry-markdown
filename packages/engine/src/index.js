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
import mergeWith from './utils/toolkit/mergeWith';
import cloneDeep from './utils/toolkit/cloneDeep';

import Engine from './Engine';
import { CherryStatic } from './CherryStatic';
import SyntaxHookBase, { HOOKS_TYPE_LIST } from './core/SyntaxBase';
import defaultConfig from './Cherry.config';
import { customizer } from './utils/config';
import { urlProcessorProxy } from './UrlCache';
import { createSyntaxHook } from './Factory';
import ParagraphBase from './core/ParagraphBase';
import HookCenter from './core/HookCenter';
import hooksConfig from './core/HooksConfig';
import Logger from './Logger';
import { sanitizer as Sanitizer } from './Sanitizer';
import UrlCache from './UrlCache';

class CherryEngine extends CherryStatic {
  /**
   * @private
   */
  static initialized = false;
  // TODO: 共用config
  /**
   * @readonly
   */
  static config = {
    defaults: defaultConfig,
  };

  /**
   * @param {any} options
   */
  constructor(options) {
    super();
    CherryEngine.initialized = true;
    const defaultConfigCopy = cloneDeep(CherryEngine.config.defaults);
    const opts = mergeWith({}, defaultConfigCopy, options, customizer);

    if (typeof opts.engine.global.urlProcessor === 'function') {
      opts.engine.global.urlProcessor = urlProcessorProxy(opts.engine.global.urlProcessor);
      opts.callback.urlProcessor = opts.engine.global.urlProcessor;
    } else {
      opts.callback.urlProcessor = urlProcessorProxy(opts.callback.urlProcessor);
    }

    // 构造器返回 Engine 实例以兼容历史 API
    return new Engine(opts, { options: opts });
  }
}

export {
  SyntaxHookBase,
  HOOKS_TYPE_LIST,
  Engine,
  CherryStatic,
  createSyntaxHook,
  ParagraphBase,
  HookCenter,
  hooksConfig,
  Logger,
  Sanitizer,
  UrlCache,
  urlProcessorProxy,
  defaultConfig,
};

export { default as AiFlowAutoClose } from './core/hooks/AiFlowAutoClose';
export { default as AutoLink } from './core/hooks/AutoLink';
export { default as BackgroundColor } from './core/hooks/BackgroundColor';
export { default as Blockquote } from './core/hooks/Blockquote';
export { default as Br } from './core/hooks/Br';
export { default as CodeBlock } from './core/hooks/CodeBlock';
export { default as Color } from './core/hooks/Color';
export { default as CommentReference } from './core/hooks/CommentReference';
export { default as Detail } from './core/hooks/Detail';
export { default as Emoji } from './core/hooks/Emoji';
export { default as Emphasis } from './core/hooks/Emphasis';
export { default as Footnote } from './core/hooks/Footnote';
export { default as FrontMatter } from './core/hooks/FrontMatter';
export { default as Header } from './core/hooks/Header';
export { default as HighLight } from './core/hooks/HighLight';
export { default as Hr } from './core/hooks/Hr';
export { default as HtmlBlock } from './core/hooks/HtmlBlock';
export { default as Image } from './core/hooks/Image';
export { default as InlineCode } from './core/hooks/InlineCode';
export { default as InlineMath } from './core/hooks/InlineMath';
export { default as Link } from './core/hooks/Link';
export { default as List } from './core/hooks/List';
export { default as MathBlock } from './core/hooks/MathBlock';
export { default as Panel } from './core/hooks/Panel';
export { default as Paragraph } from './core/hooks/Paragraph';
export { default as Ruby } from './core/hooks/Ruby';
export { default as Size } from './core/hooks/Size';
export { default as Space } from './core/hooks/Space';
export { default as Strikethrough } from './core/hooks/Strikethrough';
export { default as Sub } from './core/hooks/Sub';
export { default as Suggester } from './core/hooks/Suggester';
export { default as Sup } from './core/hooks/Sup';
export { default as Table } from './core/hooks/Table';
export { default as Toc } from './core/hooks/Toc';
export { default as Transfer } from './core/hooks/Transfer';
export { default as Underline } from './core/hooks/Underline';

/**
 * @typedef {typeof CherryStatic & (new (options: Partial<import('../types/cherry').CherryOptions>) => Engine)}
 */
const CherryEngineExport = CherryEngine;

export default CherryEngineExport;

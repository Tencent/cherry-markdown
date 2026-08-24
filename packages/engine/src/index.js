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
import SyntaxHookBase, { HOOKS_TYPE_LIST } from './syntax/SyntaxBase';
import defaultConfig from './Cherry.config';
import { customizer } from './utils/config';
import { urlProcessorProxy } from './UrlCache';
import { createSyntaxHook } from './Factory';
import ParagraphBase from './syntax/ParagraphBase';
import SentenceBase from './syntax/SentenceBase';
import HookCenter from './syntax/HookCenter';
import hooksConfig from './syntax/HooksConfig';
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
  SentenceBase,
  HookCenter,
  hooksConfig,
  Logger,
  Sanitizer,
  UrlCache,
  urlProcessorProxy,
  defaultConfig,
};

export { default as AiFlowAutoClose } from './syntax/hooks/AiFlowAutoClose';
export { default as AutoLink } from './syntax/hooks/AutoLink';
export { default as BackgroundColor } from './syntax/hooks/BackgroundColor';
export { default as Blockquote } from './syntax/hooks/Blockquote';
export { default as Br } from './syntax/hooks/Br';
export { default as CodeBlock } from './syntax/hooks/CodeBlock';
export { default as Color } from './syntax/hooks/Color';
export { default as CommentReference } from './syntax/hooks/CommentReference';
export { default as Detail } from './syntax/hooks/Detail';
export { default as Emoji } from './syntax/hooks/Emoji';
export { default as Emphasis } from './syntax/hooks/Emphasis';
export { default as Footnote } from './syntax/hooks/Footnote';
export { default as FrontMatter } from './syntax/hooks/FrontMatter';
export { default as Header } from './syntax/hooks/Header';
export { default as HighLight } from './syntax/hooks/HighLight';
export { default as Hr } from './syntax/hooks/Hr';
export { default as HtmlBlock } from './syntax/hooks/HtmlBlock';
export { default as Image } from './syntax/hooks/Image';
export { default as InlineCode } from './syntax/hooks/InlineCode';
export { default as InlineMath } from './syntax/hooks/InlineMath';
export { default as Link } from './syntax/hooks/Link';
export { default as List } from './syntax/hooks/List';
export { default as MathBlock } from './syntax/hooks/MathBlock';
export { default as Panel } from './syntax/hooks/Panel';
export { default as Paragraph } from './syntax/hooks/Paragraph';
export { default as Ruby } from './syntax/hooks/Ruby';
export { default as Size } from './syntax/hooks/Size';
export { default as Space } from './syntax/hooks/Space';
export { default as Strikethrough } from './syntax/hooks/Strikethrough';
export { default as Sub } from './syntax/hooks/Sub';
export { default as Suggester } from './syntax/hooks/Suggester';
export { default as Sup } from './syntax/hooks/Sup';
export { default as Table } from './syntax/hooks/Table';
export { default as Toc } from './syntax/hooks/Toc';
export { default as Transfer } from './syntax/hooks/Transfer';
export { default as Underline } from './syntax/hooks/Underline';
export * from './syntax/hooks/SuggestList';
export * from './syntax/hooks/Emoji.config';

/**
 * @typedef {typeof CherryStatic & (new (options: Partial<import('../types/cherry').CherryOptions>) => Engine)}
 */
const CherryEngineExport = CherryEngine;

export default CherryEngineExport;

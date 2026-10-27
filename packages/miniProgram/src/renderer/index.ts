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
import type {
  MiniProgramBlock,
  MiniProgramEngine,
  MiniProgramOptions,
  MiniProgramRenderOptions,
  MiniProgramTransformOptions,
} from '../types';
import { parseDocument } from 'htmlparser2';
import { createMiniProgramEngine, cloneSemanticBlocks } from '../shared/engine';
import type { SemanticParseStats } from '../semantic/parser';
import { SemanticParser } from '../semantic/parser';
import { blocksToMiniProgramView } from '../shared/view';

export function markdownToHtml(markdown: string, options: MiniProgramOptions = {}) {
  return createMiniProgramEngine({
    ...options,
    engine: {
      ...options.engine,
      global: {
        ...options.engine?.global,
        flowSessionContext: options.engine?.global?.flowSessionContext ?? true,
      },
    },
  }).makeHtml(markdown || '', 'string', true);
}

export default class CherryStream {
  static readonly config = {
    defaults: {},
  };

  options: MiniProgramOptions;
  lastMarkdownText: string;
  engine: MiniProgramEngine;
  private readonly semantic: SemanticParser;

  constructor(options: MiniProgramOptions = {}) {
    this.options = {
      ...options,
      engine: {
        ...options.engine,
        global: {
          ...options.engine?.global,
          flowSessionContext: options.engine?.global?.flowSessionContext ?? true,
        },
      },
    };
    this.lastMarkdownText = this.options.value || '';
    this.engine = createMiniProgramEngine(this.options);
    this.semantic = new SemanticParser(this.engine, this.options);
  }

  makeHtml(markdown: string, returnType?: 'string', forceNoCursor?: boolean): string;
  makeHtml(markdown: string, returnType: 'object', forceNoCursor?: boolean): ReturnType<typeof parseDocument>;
  makeHtml(markdown: string, returnType: 'miniProgramBlocks', forceNoCursor?: boolean): MiniProgramBlock[];
  makeHtml(markdown: string, returnType = 'string', forceNoCursor = true) {
    if (returnType === 'miniProgramBlocks') return this.makeBlocks(markdown || '', { forceNoCursor });
    const html = this.engine.makeHtml(markdown || '', 'string', forceNoCursor);
    if (returnType === 'object') {
      return parseDocument(html.replace(/\n/g, ''));
    }
    return html;
  }

  makeBlocks(markdown: string, options: MiniProgramTransformOptions = {}) {
    const forceNoCursor = options.forceNoCursor !== false;
    return cloneSemanticBlocks(this.semantic.parse(markdown || '', { ...options, forceNoCursor }).blocks);
  }

  setMarkdown(content: string, options: MiniProgramRenderOptions = {}) {
    this.lastMarkdownText = content || '';
    return this.makeView(this.lastMarkdownText, options);
  }

  setMarkdownView(content: string, options: MiniProgramRenderOptions = {}) {
    return this.setMarkdown(content, options);
  }

  makeView(markdown: string, options: MiniProgramRenderOptions = {}) {
    return blocksToMiniProgramView(this.semantic.parse(markdown || '', options).blocks, options);
  }

  getParseStats(): Readonly<SemanticParseStats> {
    return { ...this.semantic.stats };
  }

  getMarkdown() {
    return this.lastMarkdownText;
  }

  clearFlowSessionCursor() {}
}

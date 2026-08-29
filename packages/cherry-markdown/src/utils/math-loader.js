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
import { isBrowser } from './env';
import { getExternal } from './external';
import { configureMathJax, renderMathFallback } from './mathjax';
import { loadCSS, loadScript, getHTML } from './dom';

/**
 * 通用的「占位符回填」流程：扫描 DOM、替换 asyncRenderHandler.md、触发 done、更新预览缓存
 * @param {import('../Engine').default} engine Engine 实例
 * @param {Object} options
 * @param {string} options.className 占位符的 class 名称（如 cherry-katex-need-render）
 * @param {(content: string, isDisplayMode: boolean) => string} options.render 渲染函数
 */
function rerenderPendingMath(engine, { className, render }) {
  // 1. 先更新预览区域 DOM
  engine.$cherry.previewer
    .getDom()
    .querySelectorAll(`.${className}`)
    .forEach((el) => {
      const isDisplayMode = el.classList.contains('Cherry-Math');
      el.innerHTML = render(decodeURIComponent(el.getAttribute('data-content')), isDisplayMode);
      el.classList.remove(className);
    });
  // 2. 再更新 asyncRenderHandler 中缓存的 md（实际为 html）
  const needDoneKeys = [];
  const placeholderReg = new RegExp(
    `<(div|span) data-sign="([^"]+?)" class="([^"]+?) ${className}" ([^>]+? data-lines="[^"]+?") data-content="([\\s\\S]+?)"><\\/\\1>`,
    'g',
  );
  engine.asyncRenderHandler.md = engine.asyncRenderHandler.md.replace(
    placeholderReg,
    (match, domName, sign, originClass, attrs, content) => {
      const isDisplayMode = domName === 'div';
      const key = isDisplayMode ? `math-block-${sign}` : `math-inline-${sign}`;
      const html = render(decodeURIComponent(content), isDisplayMode);
      needDoneKeys.push(key);
      return `<${domName} data-sign="${sign}" class="${originClass}" ${attrs}>${html}</${domName}>`;
    },
  );
  needDoneKeys.forEach((key) => {
    engine.asyncRenderHandler.done(key);
  });
  // 3. 当预览区隐藏时，同步更新预览区缓存
  if (engine.$cherry.previewer.isPreviewerHidden()) {
    engine.$cherry.previewer.options.previewerCache.html = engine.asyncRenderHandler.md;
  }
}

/**
 * @typedef {{ engine?: 'katex' | 'MathJax'; src?: string; css?: string; plugins?: boolean; selfClosing?: boolean }} MathBlockOptions
 * @typedef {{ engine?: 'katex' | 'MathJax'; src?: string; selfClosing?: boolean }} InlineMathOptions
 * @typedef {{ mathBlock: MathBlockOptions; inlineMath: InlineMathOptions }} ResolvedMathSyntax
 */

/**
 * 加载 MathJax 并在加载完成后回填渲染所有占位符
 * @param {import('../Engine').default} engine Engine 实例
 * @param {ResolvedMathSyntax} syntax syntax 配置（mathBlock / inlineMath 已确保不是 false）
 */
function setupMathJax(engine, syntax) {
  // 已经加载过 MathJax
  if (getExternal('MathJax')) {
    return;
  }
  const { plugins } = syntax.mathBlock;
  configureMathJax(plugins);
  const mathJaxSrc = syntax.mathBlock.src ? syntax.mathBlock.src : syntax.inlineMath.src;
  if (!mathJaxSrc) {
    return;
  }
  loadScript(mathJaxSrc, 'mathjax-js').then(() => {
    const resolvedMathJax =
      /** @type {{ tex2svg?: Function, startup?: { promise?: Promise<unknown> } } | undefined} */ (
        getExternal('MathJax')
      );
    if (!resolvedMathJax) {
      return;
    }
    // MathJax 通过 startup.promise 表示就绪；若不存在则视为同步可用
    const ready = resolvedMathJax.startup?.promise || Promise.resolve();
    ready.then(() => {
      const mathJaxInstance = /** @type {{ tex2svg?: Function } | undefined} */ (getExternal('MathJax'));
      if (!mathJaxInstance || !mathJaxInstance.tex2svg) {
        return;
      }
      const render = (content, isDisplayMode) => {
        try {
          return getHTML(
            isDisplayMode
              ? mathJaxInstance.tex2svg(content)
              : mathJaxInstance.tex2svg(content, { em: 12, ex: 6, display: false }),
            true,
          );
        } catch (e) {
          return renderMathFallback(content, isDisplayMode);
        }
      };
      rerenderPendingMath(engine, { className: 'cherry-mathjax-need-render', render });
    });
  });
}

/**
 * 加载 katex 并在加载完成后回填渲染所有占位符
 * @param {import('../Engine').default} engine Engine 实例
 * @param {ResolvedMathSyntax} syntax syntax 配置（mathBlock / inlineMath 已确保不是 false）
 */
function setupKatex(engine, syntax) {
  // 已经加载过 katex
  if (getExternal('katex')) {
    return;
  }
  syntax.mathBlock.css && loadCSS(syntax.mathBlock.css, 'katex-css');
  if (!syntax.mathBlock.src) {
    return;
  }
  loadScript(syntax.mathBlock.src, 'katex-js').then(() => {
    const resolvedKatex = /** @type {import('katex').default | undefined} */ (getExternal('katex'));
    if (!resolvedKatex) {
      return;
    }
    const render = (content, isDisplayMode) => {
      try {
        return resolvedKatex.renderToString(content, {
          throwOnError: false,
          displayMode: isDisplayMode,
        });
      } catch (e) {
        return renderMathFallback(content, isDisplayMode);
      }
    };
    rerenderPendingMath(engine, { className: 'cherry-katex-need-render', render });
  });
}

/**
 * 公式引擎初始化入口（按需加载 MathJax / katex 并在加载完成后回填渲染）
 * @param {import('../Engine').default} engine Engine 实例
 * @param {Partial<import('../Cherry').CherryOptions>} opts 初始化选项
 */
export function initMathEngines(engine, opts) {
  if (!isBrowser()) {
    return;
  }
  const { externals, engine: engineOpts } = opts;
  const { syntax } = engineOpts;
  // mathBlock / inlineMath 都可能配置为 false 用以关闭，先做类型收窄
  const mathBlock = syntax.mathBlock ? syntax.mathBlock : {};
  const inlineMath = syntax.inlineMath ? syntax.inlineMath : {};
  // 未开启任何公式语法，直接退出
  if (!mathBlock.src && !inlineMath.src && !mathBlock.engine && !inlineMath.engine) {
    return;
  }
  /** @type {ResolvedMathSyntax} */
  const resolvedSyntax = { mathBlock, inlineMath };
  if (mathBlock.engine === 'MathJax' || inlineMath.engine === 'MathJax') {
    // 外部已注入 MathJax 时跳过加载
    if (!externals.MathJax) {
      setupMathJax(engine, resolvedSyntax);
    }
  }
  if (mathBlock.engine === 'katex' || inlineMath.engine === 'katex') {
    setupKatex(engine, resolvedSyntax);
  }
}

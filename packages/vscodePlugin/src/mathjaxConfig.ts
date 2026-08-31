export const MATHJAX_MODULE = 'mathjax/es5/tex-svg-full.js';
export interface VSCodeMathJaxConfig {
  loader: {
    load: string[];
  };
  tex: {
    inlineMath: string[][];
    displayMath: string[][];
    tags: 'ams';
    packages: { '[+]': string[] };
    macros: {
      bm: [string, 1];
    };
  };
  options: {
    skipHtmlTags: string[];
    ignoreHtmlClass: string;
    processHtmlClass: string;
    enableMenu: boolean;
  };
}

export function getVSCodeMathJaxConfig(): VSCodeMathJaxConfig {
  return {
    loader: {
      load: [],
    },
    tex: {
      inlineMath: [
        ['$', '$'],
        ['\\(', '\\)'],
      ],
      displayMath: [
        ['$$', '$$'],
        ['\\[', '\\]'],
      ],
      tags: 'ams',
      packages: { '[+]': ['noerrors', 'cancel', 'color', 'boldsymbol'] },
      macros: {
        bm: ['{\\boldsymbol{#1}}', 1],
      },
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'a'],
      ignoreHtmlClass: 'tex2jax_ignore',
      processHtmlClass: 'tex2jax_process',
      enableMenu: false,
    },
  };
}

export async function waitForMathJax(mathJax: {
  startup?: { promise?: Promise<unknown> };
}): Promise<void> {
  try {
    await (mathJax.startup?.promise ?? Promise.resolve());
  } catch {
    // Keep the preview available even when an optional MathJax extension fails.
  }
}

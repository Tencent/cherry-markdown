import type { ReactNode } from 'react';
import { CONFIG_SOURCE_URL } from '../constants';
import { CHERRY_CONFIG_SOURCE, SOURCE_CODE_MAP } from '../data/config-data';
import CodeBlock from './CodeBlock';

interface SourceViewerProps {
  /** 当前要查看的配置项 key；为 null 时展示 Cherry.config.js 完整源码 */
  sourceKey: string | null;
}

/** 配置参考面板：展示配置项对应的 Cherry.config.js 源码片段，并提供跳转到 GitHub 源文件的链接 */
export default function SourceViewer({ sourceKey }: SourceViewerProps) {
  let body: ReactNode;

  if (sourceKey === null) {
    body = (
      <div className="full-source">
        <CodeBlock code={CHERRY_CONFIG_SOURCE} className="text-sm leading-relaxed" />
      </div>
    );
  } else {
    const snippet = SOURCE_CODE_MAP[sourceKey];
    body = snippet ? (
      <>
        <div className="mb-3 flex items-center gap-2">
          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">{sourceKey}</span>
          <span className="text-gray-500 text-xs">配置项源码</span>
        </div>
        <CodeBlock code={snippet} className="text-sm leading-relaxed" />
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-500 mb-2">完整配置文件参考：</div>
          <a
            href={CONFIG_SOURCE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <i className="fa-brands fa-github mr-1" />
            Cherry.config.js on GitHub →
          </a>
        </div>
      </>
    ) : (
      <div className="text-center py-12 text-gray-500">
        <i className="fa-solid fa-file-code text-4xl mb-4 text-gray-600" />
        <p>暂无该配置项的源码片段</p>
        <a
          href={CONFIG_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-red-400 hover:text-red-300 mt-2 inline-block"
        >
          查看 Cherry.config.js 完整源码 →
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          <i className="fa-solid fa-book mr-2" />
          Cherry.config.js 配置参考
        </h3>
        <a
          href={CONFIG_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-red-500 hover:text-red-600 transition-colors"
        >
          <i className="fa-brands fa-github mr-1" /> 在 GitHub 上查看源文件
          <i className="fa-solid fa-arrow-up-right-from-square ml-1 text-[10px]" />
        </a>
      </div>
      <div className="bg-gray-900 rounded-xl p-6 text-sm font-mono text-gray-300 overflow-auto">{body}</div>
    </div>
  );
}

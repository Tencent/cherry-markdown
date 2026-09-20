import { REPO_URL } from '../constants';

export default function Footer() {
  return (
    <footer className="shrink-0 text-center py-2.5 text-gray-400 text-xs border-t border-gray-100 bg-gray-50">
      <p>
        Cherry Markdown 配置生成器 · 基于{' '}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="text-red-400 hover:text-red-500 transition-colors"
        >
          Cherry Markdown
        </a>{' '}
        开源项目
      </p>
    </footer>
  );
}

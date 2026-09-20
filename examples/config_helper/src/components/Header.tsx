import { REPO_URL } from '../constants';

interface HeaderProps {
  onReset: () => void;
  onExport: () => void;
}

export default function Header({ onReset, onExport }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-pink-600 via-red-500 to-orange-500 text-white shadow-lg shrink-0 relative z-50">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <img src="./logo_icon.png" alt="Cherry Markdown" className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cherry Markdown 配置生成器</h1>
            <p className="text-xs text-white/70">可视化配置 · 实时预览 · 一键导出</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            title="在 GitHub 上查看 Cherry Markdown 项目"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-all backdrop-blur-sm border border-white/20 inline-flex items-center"
          >
            <i className="fa-brands fa-github mr-1.5" /> GitHub
            <i className="fa-solid fa-arrow-up-right-from-square ml-1.5 text-[10px] opacity-70" />
          </a>
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-all backdrop-blur-sm border border-white/20"
          >
            <i className="fa-solid fa-rotate-right mr-1" /> 重置配置
          </button>
          <button
            type="button"
            onClick={onExport}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-red-600 rounded-lg text-sm font-medium transition-all shadow-sm"
          >
            <i className="fa-solid fa-code mr-1" /> 导出配置
          </button>
        </div>
      </div>
    </header>
  );
}

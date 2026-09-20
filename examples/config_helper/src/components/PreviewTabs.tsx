import type { GeneratedConfig, TabName } from '../types';
import CherryPreview from './CherryPreview';
import CodeBlock from './CodeBlock';
import SourceViewer from './SourceViewer';

interface PreviewTabsProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  config: GeneratedConfig;
  markdown: string;
  exportCode: string;
  onCopyCode: () => void;
  /** 配置参考面板当前聚焦的配置项；null 表示展示完整源码 */
  sourceKey: string | null;
}

const TABS: { name: TabName; icon: string; label: string }[] = [
  { name: 'preview', icon: 'fa-solid fa-eye', label: '实时预览' },
  { name: 'code', icon: 'fa-solid fa-code', label: '配置代码' },
  { name: 'source', icon: 'fa-solid fa-book', label: '配置参考' },
];

/**
 * 面板内容区通用类：桌面端撑满卡片剩余高度；小屏给一个最小高度以免塌陷
 */
const PANEL_CLASS = 'tab-panel relative flex-1 min-h-[600px] lg:min-h-0';

/** 右侧：实时预览 / 配置代码 / 配置参考 三个标签页，卡片高度撑满父容器 */
export default function PreviewTabs({
  activeTab,
  onTabChange,
  config,
  markdown,
  exportCode,
  onCopyCode,
  sourceKey,
}: PreviewTabsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1 min-h-0">
      <div className="flex border-b border-gray-100 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.name}
            type="button"
            className={`tab-btn flex-1 py-3 text-sm font-medium text-center transition-all relative${
              activeTab === tab.name ? ' active' : ''
            }`}
            onClick={() => onTabChange(tab.name)}
          >
            <i className={`${tab.icon} mr-1`} /> {tab.label}
          </button>
        ))}
      </div>

      {/* 预览面板：始终挂载，避免切换标签时反复重建编辑器 */}
      <div className={`${PANEL_CLASS}${activeTab === 'preview' ? ' active flex flex-col' : ' hidden'}`}>
        <CherryPreview config={config} markdown={markdown} />
      </div>

      {activeTab === 'code' && (
        <div className={`${PANEL_CLASS} active`}>
          <button
            type="button"
            onClick={onCopyCode}
            className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-all"
          >
            <i className="fa-regular fa-copy mr-1" /> 复制代码
          </button>
          <CodeBlock
            code={exportCode}
            className="absolute inset-0 p-6 bg-gray-900 text-green-400 text-sm font-mono overflow-auto"
          />
        </div>
      )}

      {activeTab === 'source' && (
        <div className={`${PANEL_CLASS} active`}>
          <div className="absolute inset-0 overflow-y-auto">
            <SourceViewer sourceKey={sourceKey} />
          </div>
        </div>
      )}
    </div>
  );
}

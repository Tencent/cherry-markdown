import { useEffect, useState } from 'react';
import type { ConfigActions } from '../hooks/useConfigState';
import type { ConfigCategoryDef, ConfigState, PresetName } from '../types';
import { matchQuery } from '../utils/search';
import ConfigCategory from './ConfigCategory';
import PresetButtons from './PresetButtons';

interface ConfigPanelProps {
  categories: ConfigCategoryDef[];
  state: ConfigState;
  actions: ConfigActions;
  onShowSource: (key: string) => void;
  onApplyPreset: (name: PresetName) => void;
  /** 每次变化时递增，用于在重置 / 应用预设后收起所有分类 */
  resetSignal: number;
}

/**
 * 左侧配置面板：搜索 + 快捷预设 + 手风琴式分类列表。
 * 分类互斥展开（同一时间最多展开一项），默认全部收起。
 * 桌面端面板高度撑满，仅分类列表区域滚动；小屏则随页面整体滚动。
 */
export default function ConfigPanel({
  categories,
  state,
  actions,
  onShowSource,
  onApplyPreset,
  resetSignal,
}: ConfigPanelProps) {
  const [rawQuery, setRawQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const query = rawQuery.toLowerCase().trim();

  // 重置 / 预设：收起所有分类
  useEffect(() => {
    setOpenId(null);
  }, [resetSignal]);

  // 搜索：自动展开第一个包含匹配项的分类；清空搜索时收起
  useEffect(() => {
    if (!query) {
      setOpenId(null);
      return;
    }
    const firstMatched = categories.find((cat) => cat.items.some((item) => matchQuery(item, query)));
    setOpenId(firstMatched ? firstMatched.id : null);
  }, [query, categories]);

  const toggleOpen = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  // 搜索时只保留有匹配项的分类
  const visibleCategories = query
    ? categories.filter((cat) => cat.items.some((item) => matchQuery(item, query)))
    : categories;

  return (
    <aside id="config-panel" className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-3 min-h-0 lg:h-full">
      <div className="shrink-0 space-y-3">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="搜索配置项..."
            className="search-input w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 transition-all"
          />
        </div>
        <PresetButtons onApply={onApplyPreset} />
      </div>

      <div className="config-list flex-1 min-h-0 lg:overflow-y-auto space-y-3 lg:pr-1">
        {visibleCategories.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            <i className="fa-solid fa-magnifying-glass text-2xl mb-3 block text-gray-300" />
            没有找到匹配的配置项
          </div>
        ) : (
          visibleCategories.map((cat, idx) => (
            <ConfigCategory
              key={cat.id}
              category={cat}
              state={state}
              actions={actions}
              open={openId === cat.id}
              onToggleOpen={() => toggleOpen(cat.id)}
              query={query}
              index={idx}
              onShowSource={onShowSource}
            />
          ))
        )}
      </div>
    </aside>
  );
}

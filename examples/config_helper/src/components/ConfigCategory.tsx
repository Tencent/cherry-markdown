import type { ConfigActions } from '../hooks/useConfigState';
import type { ConfigCategoryDef, ConfigState } from '../types';
import { matchQuery } from '../utils/search';
import ConfigItem from './ConfigItem';

interface ConfigCategoryProps {
  category: ConfigCategoryDef;
  state: ConfigState;
  actions: ConfigActions;
  open: boolean;
  onToggleOpen: () => void;
  /** 搜索关键字（小写、已 trim），为空表示不过滤 */
  query: string;
  /** 分类在列表中的序号，用于渐入动画延迟 */
  index: number;
  onShowSource: (key: string) => void;
}

/** 可折叠的配置分类卡片 */
export default function ConfigCategory({
  category,
  state,
  actions,
  open,
  onToggleOpen,
  query,
  index,
  onShowSource,
}: ConfigCategoryProps) {
  const visibleItems = category.items.filter((item) => matchQuery(item, query));

  return (
    <div className={`config-category fade-in${open ? ' open' : ''}`} style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="category-header" onClick={onToggleOpen}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`icon ${category.iconBg}`}>
            <i className={`${category.icon} ${category.iconColor}`} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-800">{category.name}</div>
            <div className="text-xs text-gray-400 truncate">{category.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {query ? (
            <span className="text-xs text-red-500 font-medium whitespace-nowrap">
              命中 {visibleItems.length}/{category.items.length}
            </span>
          ) : (
            <span className="text-xs text-gray-400 whitespace-nowrap">{category.items.length} 项</span>
          )}
          <i className="fa-solid fa-chevron-down chevron" />
        </div>
      </div>
      <div className="category-body">
        <div className="config-items-list">
          {visibleItems.map((item) => (
            <ConfigItem key={item.key} item={item} state={state[item.key]} actions={actions} onShowSource={onShowSource} />
          ))}
        </div>
      </div>
    </div>
  );
}

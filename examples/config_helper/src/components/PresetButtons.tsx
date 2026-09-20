import type { PresetName } from '../types';

interface PresetButtonsProps {
  onApply: (name: PresetName) => void;
}

const PRESET_BUTTONS: {
  name: PresetName;
  icon: string;
  iconColor: string;
  bg: string;
  hoverBg: string;
  title: string;
  subtitle: string;
}[] = [
  {
    name: 'default',
    icon: 'fa-solid fa-sliders',
    iconColor: 'text-blue-500',
    bg: 'bg-blue-50',
    hoverBg: 'group-hover:bg-blue-100',
    title: '默认配置',
    subtitle: '标准编辑器',
  },
  {
    name: 'simple',
    icon: 'fa-solid fa-feather',
    iconColor: 'text-green-500',
    bg: 'bg-green-50',
    hoverBg: 'group-hover:bg-green-100',
    title: '精简模式',
    subtitle: '轻量级编辑',
  },
  {
    name: 'full',
    icon: 'fa-solid fa-maximize',
    iconColor: 'text-purple-500',
    bg: 'bg-purple-50',
    hoverBg: 'group-hover:bg-purple-100',
    title: '完整模式',
    subtitle: '全部功能',
  },
  {
    name: 'preview',
    icon: 'fa-solid fa-book-open',
    iconColor: 'text-orange-500',
    bg: 'bg-orange-50',
    hoverBg: 'group-hover:bg-orange-100',
    title: '纯预览',
    subtitle: '只读模式',
  },
];

/** 快捷预设（紧凑 2×2 布局，放置于左侧搜索框下方） */
export default function PresetButtons({ onApply }: PresetButtonsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
        <i className="fa-solid fa-wand-magic-sparkles" />
        快捷预设
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PRESET_BUTTONS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => onApply(preset.name)}
            title={`${preset.title} · ${preset.subtitle}`}
            className="preset-btn group flex items-center gap-2 px-2.5 py-2 bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 rounded-lg text-left transition-all hover:shadow-sm"
          >
            <div
              className={`w-7 h-7 shrink-0 ${preset.bg} rounded-md flex items-center justify-center ${preset.hoverBg} transition-colors`}
            >
              <i className={`${preset.icon} ${preset.iconColor} text-xs`} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-700 truncate">{preset.title}</div>
              <div className="text-[10px] text-gray-400 truncate">{preset.subtitle}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

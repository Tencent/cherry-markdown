interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** small 用于子配置项 */
  size?: 'normal' | 'small';
  title?: string;
}

const SIZE_CLASS = {
  normal:
    'w-9 h-5 after:top-[2px] after:left-[2px] after:h-4 after:w-4 peer-checked:bg-red-500',
  small: 'w-7 h-4 after:top-[1px] after:left-[1px] after:h-3 after:w-3 peer-checked:bg-red-400',
};

/** Tailwind 风格的开关 */
export default function Toggle({ checked, onChange, size = 'normal', title }: ToggleProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer" title={title}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div
        className={`bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all ${SIZE_CLASS[size]}`}
      />
    </label>
  );
}

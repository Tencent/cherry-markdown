import type { ReactNode } from 'react';
import type { SubItemDef } from '../types';
import Toggle from './Toggle';

interface SubItemInputProps {
  sub: SubItemDef;
  onChange: (value: string | number | boolean) => void;
}

/** 对象类配置项的子字段输入 */
export default function SubItemInput({ sub, onChange }: SubItemInputProps) {
  let input: ReactNode = null;

  if (sub.type === 'boolean') {
    input = <Toggle size="small" checked={Boolean(sub.value)} onChange={onChange} />;
  } else if (sub.type === 'number') {
    input = (
      <input
        type="number"
        className="config-value-input"
        style={{ maxWidth: 80 }}
        value={Number(sub.value)}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      />
    );
  } else if (sub.type === 'string') {
    input = (
      <input
        type="text"
        className="config-value-input"
        value={String(sub.value)}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else if (sub.type === 'select') {
    input = (
      <select className="config-select" value={String(sub.value)} onChange={(e) => onChange(e.target.value)}>
        {(sub.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-xs text-gray-500">{sub.name}</span>
      {input}
    </div>
  );
}

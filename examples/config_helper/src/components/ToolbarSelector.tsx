import { useState, type DragEvent } from 'react';
import { getButtonLabel } from '../utils/toolbarLabels';

interface ToolbarSelectorProps {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onAddSeparator: () => void;
  onRemoveAt: (index: number) => void;
  onMove: (from: number, to: number) => void;
}

/**
 * 工具栏按钮选择器：
 * - 候选区：点击切换按钮是否启用
 * - 分割线按钮：添加一个 '|'
 * - 已选排序区：拖拽排序，分割线可点击删除
 */
export default function ToolbarSelector({
  options,
  selected,
  onToggle,
  onAddSeparator,
  onRemoveAt,
  onMove,
}: ToolbarSelectorProps) {
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const normalOptions = options.filter((opt) => opt !== '|');

  const handleDragStart = (e: DragEvent<HTMLSpanElement>, idx: number) => {
    setDragSrcIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (e: DragEvent<HTMLSpanElement>, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const handleDrop = (e: DragEvent<HTMLSpanElement>, targetIdx: number) => {
    e.preventDefault();
    if (dragSrcIdx !== null && dragSrcIdx !== targetIdx) {
      onMove(dragSrcIdx, targetIdx);
    }
    setDragSrcIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragSrcIdx(null);
    setDragOverIdx(null);
  };

  return (
    <>
      <div className="toolbar-items-grid">
        {normalOptions.map((opt) => (
          <span
            key={opt}
            className={`toolbar-chip${selected.includes(opt) ? ' active' : ''}`}
            title={opt}
            onClick={() => onToggle(opt)}
          >
            {getButtonLabel(opt)}
          </span>
        ))}
        <span className="toolbar-chip separator-add-btn" title="点击添加分割线" onClick={onAddSeparator}>
          <i className="fa-solid fa-grip-lines-vertical" style={{ marginRight: 2 }} /> | 分割线
        </span>
      </div>

      {selected.length > 0 && (
        <>
          <div className="sort-area-label">
            <i className="fa-solid fa-arrow-down-short-wide" style={{ marginRight: 4 }} />
            已选顺序（拖拽排序）：
          </div>
          <div className="toolbar-sort-area">
            {selected.map((val, idx) => {
              const isSep = val === '|';
              const classes = ['sort-item'];
              if (isSep) classes.push('separator-item');
              if (dragSrcIdx === idx) classes.push('dragging');
              if (dragOverIdx === idx && dragSrcIdx !== idx) classes.push('drag-over');
              return (
                <span
                  // 同一个按钮可能出现多次（尤其是分割线），因此用值 + 下标作为 key
                  key={`${val}-${idx}`}
                  className={classes.join(' ')}
                  draggable
                  title={isSep ? '分割线（拖拽排序 / 点击删除）' : `${val}（拖拽排序）`}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragLeave={() => setDragOverIdx((cur) => (cur === idx ? null : cur))}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <i className="fa-solid fa-grip-vertical sort-handle" />
                  <span className="sort-label">{isSep ? '|' : getButtonLabel(val)}</span>
                  {isSep && (
                    <i
                      className="fa-solid fa-xmark sort-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveAt(idx);
                      }}
                    />
                  )}
                </span>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

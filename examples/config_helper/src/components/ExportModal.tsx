import { useEffect } from 'react';
import CodeBlock from './CodeBlock';

interface ExportModalProps {
  open: boolean;
  code: string;
  onClose: () => void;
  onCopy: () => void;
}

/** 导出配置弹窗 */
export default function ExportModal({ open, code, onClose, onCopy }: ExportModalProps) {
  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden pointer-events-auto slide-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">
              <i className="fa-solid fa-file-export mr-2 text-red-500" />
              导出配置代码
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <i className="fa-solid fa-xmark text-gray-500" />
            </button>
          </div>
          <div className="p-6">
            <div className="relative">
              <button
                type="button"
                onClick={onCopy}
                className="absolute top-3 right-3 z-10 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-all"
              >
                <i className="fa-regular fa-copy mr-1" /> 复制
              </button>
              <CodeBlock
                code={code}
                className="bg-gray-900 text-green-400 text-sm font-mono p-6 rounded-xl overflow-auto max-h-[50vh]"
              />
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
              <i className="fa-solid fa-circle-info mr-1" />
              将以上代码粘贴到你的项目中，作为 new Cherry(config) 的参数即可使用
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

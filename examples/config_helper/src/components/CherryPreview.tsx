import { useEffect, useRef, useState } from 'react';
import Cherry from 'cherry-markdown';
import type { GeneratedConfig } from '../types';

type CherryOptions = ConstructorParameters<typeof Cherry>[0];

interface CherryPreviewProps {
  config: GeneratedConfig;
  /** 编辑器初始内容 */
  markdown: string;
}

/** 配置变化后重建编辑器的防抖时间（ms），避免连续输入时频繁重建 */
const REBUILD_DEBOUNCE = 300;

/**
 * 实时预览：每次配置变化都销毁并重建 Cherry 实例，
 * 保证预览与最终导出的配置完全一致。
 */
export default function CherryPreview({ config, markdown }: CherryPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<Cherry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;

      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch {
          // 忽略销毁错误
        }
        instanceRef.current = null;
      }
      el.innerHTML = '';
      setError(null);

      // 预览始终挂载到当前容器，忽略用户配置的 id
      const previewConfig: Record<string, unknown> = { ...config, el, value: markdown };
      delete previewConfig.id;

      try {
        instanceRef.current = new Cherry(previewConfig as unknown as CherryOptions);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }, REBUILD_DEBOUNCE);

    return () => window.clearTimeout(timer);
  }, [config, markdown]);

  // 卸载时销毁实例
  useEffect(
    () => () => {
      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch {
          // 忽略销毁错误
        }
        instanceRef.current = null;
      }
    },
    [],
  );

  return (
    <div className="relative flex-1 min-h-0">
      <div ref={containerRef} id="cherry-editor" className="absolute inset-0" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-500 p-8">
          <div className="text-center">
            <i className="fa-solid fa-triangle-exclamation text-4xl mb-4" />
            <p className="text-lg font-medium">预览加载失败</p>
            <p className="text-sm mt-2 text-red-400">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

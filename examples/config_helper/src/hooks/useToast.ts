import { useCallback, useEffect, useRef, useState } from 'react';

const TOAST_DURATION = 2500;

/** 轻量 Toast 状态管理 */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((text: string) => {
    setMessage(text);
    setVisible(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setVisible(false), TOAST_DURATION);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return { message, visible, showToast };
}

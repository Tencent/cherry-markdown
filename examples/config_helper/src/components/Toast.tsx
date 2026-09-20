interface ToastProps {
  message: string | null;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div className={`toast${visible ? ' show' : ''}`} role="status" aria-live="polite">
      <i className="fa-solid fa-check-circle mr-2 text-green-400" />
      {message}
    </div>
  );
}

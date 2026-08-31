import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

// Fixed-position notification that auto-dismisses without shifting page layout
export const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`} role="status">
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
      <span>{message}</span>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss notification">
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;

import React from 'react';
import { ToastMessage } from '../types/game';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="px-4 py-2.5 rounded font-extrabold text-sm tracking-wide bg-white text-wordle-dark shadow-xl transition-all duration-200 pointer-events-auto animate-in fade-in zoom-in-95"
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
};

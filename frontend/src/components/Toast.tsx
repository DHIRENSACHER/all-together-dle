import React from 'react';
import { ToastMessage } from '../types/game';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide text-white shadow-2xl backdrop-blur-md transition-all duration-200 pointer-events-auto animate-in fade-in zoom-in-95 ${
            toast.type === 'error'
              ? 'bg-red-900/90 border border-red-700/60'
              : toast.type === 'success'
              ? 'bg-emerald-900/90 border border-emerald-700/60'
              : 'bg-wordle-card/95 border border-wordle-borderLight'
          }`}
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
};

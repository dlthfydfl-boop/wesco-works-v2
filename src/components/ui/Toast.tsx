'use client';

import { useEffect, useState } from 'react';
import { useToastStore } from '@/stores/toast';
import type { ToastType } from '@/stores/toast';

const typeStyles: Record<ToastType, { bg: string; icon: string }> = {
  success: {
    bg: 'bg-green-50 border-green-200 text-green-800',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  error: {
    bg: 'bg-red-50 border-red-200 text-red-800',
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
  },
};

function ToastItem({ id, type, message }: { id: string; type: ToastType; message: string }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  const style = typeStyles[type];

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300 ${style.bg} ${
        show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
      </svg>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="flex-shrink-0 p-0.5 rounded hover:bg-black/5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem {...toast} />
        </div>
      ))}
    </div>
  );
}

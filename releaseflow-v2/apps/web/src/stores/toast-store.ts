import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  add: (toast: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  add: (toast) => {
    const id = String(++nextId);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    const dur = toast.duration ?? 4000;
    setTimeout(() => get().remove(id), dur);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  success: (title, message) => get().add({ type: 'success', title, message }),
  error: (title, message) => get().add({ type: 'error', title, message, duration: 6000 }),
  warning: (title, message) => get().add({ type: 'warning', title, message }),
  info: (title, message) => get().add({ type: 'info', title, message }),
}));

export const toast = {
  success: (title: string, message?: string) => useToastStore.getState().success(title, message),
  error: (title: string, message?: string) => useToastStore.getState().error(title, message),
  warning: (title: string, message?: string) => useToastStore.getState().warning(title, message),
  info: (title: string, message?: string) => useToastStore.getState().info(title, message),
};

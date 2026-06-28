'use client';

import { useToastStore } from '@/stores/toast-store';
import { Toast } from '@releaseflow/ui';

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast type={t.type} title={t.title} message={t.message} visible dismissible onDismiss={() => remove(t.id)} />
        </div>
      ))}
    </div>
  );
}

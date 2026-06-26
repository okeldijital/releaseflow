'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/stores/toast-store';

export function useOptimistic<T>(
  initial: T,
  action: () => Promise<void>,
  config: { rollback: T; successMsg?: string; errorMsg?: string },
) {
  const [value, setValue] = useState<T>(initial);
  const [pending, setPending] = useState(false);

  const execute = useCallback(async (optimistic: T) => {
    const prev = value;
    setValue(optimistic);
    setPending(true);
    try {
      await action();
      if (config.successMsg) toast.success(config.successMsg);
    } catch (err) {
      setValue(prev);
      if (config.errorMsg) toast.error(config.errorMsg, (err as Error).message);
    } finally {
      setPending(false);
    }
  }, [value, action, config]);

  return { value, setValue, execute, pending };
}

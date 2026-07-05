'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { getLabelsByOrganization } from '@/lib/label-repository';
import type { LabelRecord } from '@/lib/label-service';
import { toLabelOptions, type LabelOption } from '@/lib/label-field-picker-logic';

export type { LabelOption };

export function useLabels() {
  const [labels, setLabels] = useState<LabelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeOrgId, orgVersion } = useOrgStore();

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!activeOrgId) {
      setLabels([]);
      setLoading(false);
      return;
    }
    if (!opts?.silent) setLoading(true);
    try {
      const data = await getLabelsByOrganization(activeOrgId);
      setLabels(data);
    } catch {
      setLabels([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => { void load(); }, [load, orgVersion]);

  const labelOptions = useMemo(() => toLabelOptions(labels), [labels]);

  const onLabelCreated = useCallback((created: LabelOption) => {
    setLabels((prev) => {
      if (prev.some((l) => l.id === created.id)) return prev;
      return [...prev, { ...created, organizationId: activeOrgId ?? '', createdAt: null } as LabelRecord];
    });
  }, [activeOrgId]);

  return { labels, labelOptions, loading, refresh: load, onLabelCreated };
}

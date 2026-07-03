'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchAsset, fetchAssetsByRelease,
  validateAsset, fetchAssetCompleteness,
} from '@/lib/asset-service';
import type { AssetRecord } from '@/lib/asset-repository';
import type { AssetValidationResult, AssetCompleteness } from '@/lib/asset-service';

export function useAsset(assetId: string | undefined) {
  const [asset, setAsset] = useState<AssetRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!assetId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchAsset(assetId);
      setAsset(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => { load(); }, [load]);

  return { asset, loading, refresh: load };
}

export function useAssetsByRelease(releaseId: string | undefined) {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!releaseId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchAssetsByRelease(releaseId);
      setAssets(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [releaseId]);

  useEffect(() => { load(); }, [load]);

  return { assets, loading, refresh: load };
}

export function useAssetValidation(filename: string, sizeBytes?: number) {
  const [result, setResult] = useState<AssetValidationResult | null>(null);

  const validate = useCallback(async () => {
    if (!filename) { setResult(null); return; }
    const r = await validateAsset(filename, sizeBytes);
    setResult(r);
  }, [filename, sizeBytes]);

  useEffect(() => { validate(); }, [validate]);

  return result;
}

export function useReleaseAssets(releaseId: string | undefined) {
  const { assets, loading, refresh } = useAssetsByRelease(releaseId);
  const [completeness, setCompleteness] = useState<AssetCompleteness | null>(null);

  const loadCompleteness = useCallback(async () => {
    if (!releaseId) return;
    const c = await fetchAssetCompleteness(releaseId);
    setCompleteness(c);
  }, [releaseId]);

  useEffect(() => { loadCompleteness(); }, [loadCompleteness]);

  return { assets, completeness, loading, refresh };
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { search } from '@/lib/search-service';
import type { SearchResult } from '@/lib/search-types';

export interface UseGlobalSearchResult {
  results: SearchResult[];
  searching: boolean;
  error: boolean;
}

export function useGlobalSearch(
  query: string,
  orgId: string | null,
  debounceMs = 300,
): UseGlobalSearchResult {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query || query.length < 2 || !orgId) {
      setResults([]);
      setSearching(false);
      setError(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      setSearching(true);
      setError(false);
      try {
        const data = await search(query, orgId);
        if (!controller.signal.aborted) {
          setResults(data);
          setSearching(false);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('[useGlobalSearch]', err);
          setError(true);
          setSearching(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, orgId, debounceMs]);

  return { results, searching, error };
}
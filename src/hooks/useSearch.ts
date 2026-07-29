import { useCallback, useEffect, useRef, useState } from 'react';
import { dataLoaders } from '../lib/dataService';
import { useAppStore } from '../store/useAppStore';
import type { SearchResults } from '../types';

/** Queries shorter than this are not sent to the backend. */
export const MIN_SEARCH_LENGTH = 2;

const EMPTY: SearchResults = { products: [], services: [], stores: [] };

export interface UseSearchResult {
  results: SearchResults;
  /** products + services + stores */
  total: number;
  loading: boolean;
  /** Message to show when the request failed. `null` when it didn't. */
  error: string | null;
  /** True when the user typed something, but not enough characters yet. */
  tooShort: boolean;
  /** True when the query is blank — nothing has been searched. */
  isEmptyQuery: boolean;
  /** Re-run the current query (used by the error state's "Try again"). */
  retry: () => void;
}

/**
 * Runs a global catalogue search against `GET /search`.
 *
 * Re-fetches whenever the trimmed query or city changes. Stale responses are
 * discarded (last request wins), so fast typing can never render older results.
 */
export function useSearch(query: string, city?: string): UseSearchResult {
  const trackActivity = useAppStore(s => s.trackActivity);

  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Monotonic request id — only the newest in-flight request may write state.
  const requestId = useRef(0);

  const q = query.trim();
  const cityKey = city ?? '';

  useEffect(() => {
    if (q.length < MIN_SEARCH_LENGTH) {
      requestId.current += 1; // invalidate anything still in flight
      setResults(EMPTY);
      setError(null);
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    dataLoaders
      .searchCatalogue(q, cityKey || undefined)
      .then(res => {
        if (id !== requestId.current) return;
        setResults(res);
        setLoading(false);
        trackActivity(
          'search',
          { query: q, results: res.products.length + res.services.length + res.stores.length },
          '/search',
        );
      })
      .catch((e: unknown) => {
        if (id !== requestId.current) return;
        setResults(EMPTY);
        setLoading(false);
        setError((e as Error)?.message || 'Something went wrong while searching.');
      });
  }, [q, cityKey, attempt, trackActivity]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);

  return {
    results,
    total: results.products.length + results.services.length + results.stores.length,
    loading,
    error,
    tooShort: q.length > 0 && q.length < MIN_SEARCH_LENGTH,
    isEmptyQuery: q.length === 0,
    retry,
  };
}

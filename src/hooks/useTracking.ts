import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { ActivityEvent } from '../types';

export const useTracking = () => {
  const { trackActivity } = useAppStore();

  const track = useCallback(
    (event: ActivityEvent, metadata?: Record<string, string | number | boolean>, page?: string) => {
      trackActivity(event, metadata, page);
    },
    [trackActivity]
  );

  return { track };
};

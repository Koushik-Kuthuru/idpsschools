import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAssignments } from '@/hooks/useApi';
import { getSeenHomeworkIds, markHomeworkIdsSeen } from '@/utils/homeworkSeen';

export const homeworkSeenQueryKey = ['homeworkSeen'] as const;

export function useHomeworkUnread() {
  const queryClient = useQueryClient();
  const { data: assignments } = useAssignments();

  const { data: seenIds = new Set<string>() } = useQuery({
    queryKey: homeworkSeenQueryKey,
    queryFn: getSeenHomeworkIds,
  });

  const unreadItems = useMemo(
    () => (assignments ?? []).filter((item) => !seenIds.has(item.id)),
    [assignments, seenIds],
  );

  const markAllSeen = useCallback(async () => {
    const ids = (assignments ?? []).filter((item) => !seenIds.has(item.id)).map((item) => item.id);
    if (ids.length === 0) return;
    await markHomeworkIdsSeen(ids);
    await queryClient.invalidateQueries({ queryKey: homeworkSeenQueryKey });
  }, [assignments, seenIds, queryClient]);

  return {
    unreadCount: unreadItems.length,
    unreadItems,
    markAllSeen,
  };
}

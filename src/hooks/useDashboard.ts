import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDoulaDashboardData,
  fetchPregnantHomeData,
  updateDoulaAvailability,
  acknowledgeRedFlag,
  toggleTaskCompletion,
  DoulaDashboardData,
  PregnantHomeData,
} from '@/services/dashboard';
import { DoulaAvailability, Profile } from '@/types/database';

export const DOULA_DASHBOARD_QUERY_KEY = ['doula-dashboard'];
export const PREGNANT_HOME_QUERY_KEY = ['pregnant-home'];

/**
 * Hook for Doula Dashboard
 */
export function useDoulaDashboard(doulaId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<DoulaDashboardData>({
    queryKey: [...DOULA_DASHBOARD_QUERY_KEY, doulaId || 'default'],
    queryFn: () => fetchDoulaDashboardData(doulaId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, message }: { status: DoulaAvailability; message?: string }) =>
      updateDoulaAvailability(doulaId || '11111111-1111-1111-1111-111111111111', status, message),
    onMutate: async ({ status }) => {
      await queryClient.cancelQueries({ queryKey: [...DOULA_DASHBOARD_QUERY_KEY, doulaId || 'default'] });
      const previousData = queryClient.getQueryData<DoulaDashboardData>([
        ...DOULA_DASHBOARD_QUERY_KEY,
        doulaId || 'default',
      ]);

      if (previousData) {
        queryClient.setQueryData<DoulaDashboardData>([...DOULA_DASHBOARD_QUERY_KEY, doulaId || 'default'], {
          ...previousData,
          doula: {
            ...previousData.doula,
            doula_status: status,
          },
        });
      }
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [...DOULA_DASHBOARD_QUERY_KEY, doulaId || 'default'],
          context.previousData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DOULA_DASHBOARD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PREGNANT_HOME_QUERY_KEY });
    },
  });

  const dismissRedFlagMutation = useMutation({
    mutationFn: (logId: string) => acknowledgeRedFlag(logId),
    onMutate: async (logId: string) => {
      await queryClient.cancelQueries({ queryKey: [...DOULA_DASHBOARD_QUERY_KEY, doulaId || 'default'] });
      const previousData = queryClient.getQueryData<DoulaDashboardData>([
        ...DOULA_DASHBOARD_QUERY_KEY,
        doulaId || 'default',
      ]);

      if (previousData) {
        const updatedAlerts = previousData.activeRedFlags.filter((rf) => rf.logId !== logId);
        const updatedClients = previousData.clients.map((c) => {
          const hasRemainingFlags = updatedAlerts.some((rf) => rf.pregnancyId === c.pregnancyId);
          return {
            ...c,
            hasRedFlag: hasRemainingFlags,
          };
        });

        queryClient.setQueryData<DoulaDashboardData>([...DOULA_DASHBOARD_QUERY_KEY, doulaId || 'default'], {
          ...previousData,
          clients: updatedClients,
          activeRedFlags: updatedAlerts,
          stats: {
            ...previousData.stats,
            redFlagsCount: updatedAlerts.length,
          },
        });
      }
      return { previousData };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DOULA_DASHBOARD_QUERY_KEY });
    },
  });

  return {
    ...query,
    data: query.data,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    dismissRedFlag: dismissRedFlagMutation.mutateAsync,
    isDismissingRedFlag: dismissRedFlagMutation.isPending,
  };
}

/**
 * Hook for Pregnant Home
 */
export function usePregnantHome(profile: Profile | null) {
  const queryClient = useQueryClient();

  const query = useQuery<PregnantHomeData>({
    queryKey: [...PREGNANT_HOME_QUERY_KEY, profile?.id || 'default'],
    queryFn: () => {
      if (!profile) throw new Error('Profile required');
      return fetchPregnantHomeData(profile);
    },
    enabled: Boolean(profile),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ itemId, newStatus }: { itemId: string; newStatus: boolean }) =>
      toggleTaskCompletion(itemId, newStatus),
    onMutate: async ({ itemId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: [...PREGNANT_HOME_QUERY_KEY, profile?.id || 'default'] });
      const previousData = queryClient.getQueryData<PregnantHomeData>([
        ...PREGNANT_HOME_QUERY_KEY,
        profile?.id || 'default',
      ]);

      if (previousData) {
        const updatedTasks = previousData.todayTasks.map((t) =>
          t.id === itemId ? { ...t, is_completed: newStatus } : t
        );
        queryClient.setQueryData<PregnantHomeData>(
          [...PREGNANT_HOME_QUERY_KEY, profile?.id || 'default'],
          {
            ...previousData,
            todayTasks: updatedTasks,
          }
        );
      }
      return { previousData };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PREGNANT_HOME_QUERY_KEY });
    },
  });

  return {
    ...query,
    data: query.data,
    toggleTask: toggleTaskMutation.mutateAsync,
    isTogglingTask: toggleTaskMutation.isPending,
  };
}


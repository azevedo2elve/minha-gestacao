import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDailyLogByDate,
  fetchPregnancyDailyLogs,
  saveDailyLog,
  markLogSeenByDoula,
  fetchClientDossier,
  SaveDailyLogPayload,
  SaveDailyLogResult,
  ClientDossierData,
} from '@/services/diary';
import { DailyLog } from '@/types/database';
import { PREGNANT_HOME_QUERY_KEY, DOULA_DASHBOARD_QUERY_KEY } from './useDashboard';

export const DAILY_LOG_QUERY_KEY = ['daily-log'];
export const PREGNANCY_LOGS_QUERY_KEY = ['pregnancy-logs'];
export const CLIENT_DOSSIER_QUERY_KEY = ['client-dossier'];

/**
 * Hook to fetch a daily log for a specific date
 */
export function useDailyLog(pregnancyId?: string, logDate?: string) {
  return useQuery<DailyLog | null>({
    queryKey: [...DAILY_LOG_QUERY_KEY, pregnancyId || 'none', logDate || 'today'],
    queryFn: () => {
      if (!pregnancyId || !logDate) return null;
      return fetchDailyLogByDate(pregnancyId, logDate);
    },
    enabled: Boolean(pregnancyId && logDate),
  });
}

/**
 * Hook to fetch all logs for a pregnancy
 */
export function usePregnancyDailyLogs(pregnancyId?: string) {
  return useQuery<DailyLog[]>({
    queryKey: [...PREGNANCY_LOGS_QUERY_KEY, pregnancyId || 'none'],
    queryFn: () => {
      if (!pregnancyId) return [];
      return fetchPregnancyDailyLogs(pregnancyId);
    },
    enabled: Boolean(pregnancyId),
  });
}

/**
 * Hook to fetch client dossier for doula view
 */
export function useClientDossier(pregnancyId: string) {
  return useQuery<ClientDossierData>({
    queryKey: [...CLIENT_DOSSIER_QUERY_KEY, pregnancyId],
    queryFn: () => fetchClientDossier(pregnancyId),
    enabled: Boolean(pregnancyId),
  });
}

/**
 * Mutation to save daily log (UPSERT)
 */
export function useSaveDailyLog() {
  const queryClient = useQueryClient();

  return useMutation<SaveDailyLogResult, Error, SaveDailyLogPayload>({
    mutationFn: (payload) => saveDailyLog(payload),
    onSuccess: (result, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: [...DAILY_LOG_QUERY_KEY, variables.pregnancyId, variables.logDate],
      });
      queryClient.invalidateQueries({
        queryKey: [...PREGNANCY_LOGS_QUERY_KEY, variables.pregnancyId],
      });
      queryClient.invalidateQueries({
        queryKey: [...CLIENT_DOSSIER_QUERY_KEY, variables.pregnancyId],
      });
      queryClient.invalidateQueries({ queryKey: PREGNANT_HOME_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DOULA_DASHBOARD_QUERY_KEY });
    },
  });
}

/**
 * Mutation to mark a log as seen by the Doula
 */
export function useMarkLogSeen() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { pregnancyId: string; logId: string }>({
    mutationFn: ({ pregnancyId, logId }) => markLogSeenByDoula(pregnancyId, logId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...CLIENT_DOSSIER_QUERY_KEY, variables.pregnancyId],
      });
      queryClient.invalidateQueries({
        queryKey: [...PREGNANCY_LOGS_QUERY_KEY, variables.pregnancyId],
      });
      queryClient.invalidateQueries({ queryKey: DOULA_DASHBOARD_QUERY_KEY });
    },
  });
}

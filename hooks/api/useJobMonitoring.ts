import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '@/lib/auth';

interface Integration {
  name: string;
  status: string;
  message: string;
  lastRun: string;
  nextRun: string;
  lastStatus: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unavailable';
  timestamp: string;
  integrations?: Integration[];
}

interface JobStatus {
  jobId: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  lastRun: string;
  nextRun: string;
  lastStatus: string;
  lastError: string | null;
}

interface StatusResponse {
  hangfireAvailable: boolean;
  jobs: JobStatus[];
  timestamp: string;
}

async function fetchHealth(): Promise<HealthResponse> {
  const response = await apiCall('/JobMonitoring/health');
  if (!response.ok) {
    throw new Error('Failed to fetch health status');
  }
  return response.json();
}

async function fetchStatus(): Promise<StatusResponse> {
  const response = await apiCall('/JobMonitoring/status');
  if (!response.ok) {
    throw new Error('Failed to fetch job status');
  }
  return response.json();
}

export function useJobHealth(pollInterval: number = 45000) {
  return useQuery({
    queryKey: ['jobHealth'],
    queryFn: fetchHealth,
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useJobStatus(pollInterval: number = 45000) {
  return useQuery({
    queryKey: ['jobStatus'],
    queryFn: fetchStatus,
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

interface TriggerResponse {
  message: string;
}

async function triggerJob(jobId: string): Promise<TriggerResponse> {
  const response = await apiCall(`/JobMonitoring/trigger/${jobId}`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to trigger job' }));
    throw new Error(errorData.message || 'Failed to trigger job');
  }
  return response.json();
}

export function useTriggerJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: triggerJob,
    onSuccess: () => {
      // Invalidate and refetch job status after triggering
      queryClient.invalidateQueries({ queryKey: ['jobStatus'] });
      queryClient.invalidateQueries({ queryKey: ['jobHealth'] });
    },
  });
}


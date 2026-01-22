'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useJobHealth, useJobStatus, useTriggerJob } from '@/hooks/api/useJobMonitoring';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationContainer } from '../components/ui/NotificationToast';

function formatTimeAgo(timestamp: string): string {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function getStatusColor(status: string | undefined | null): { bg: string; text: string; dot: string } {
  if (!status) {
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      dot: 'bg-gray-500',
    };
  }
  switch (status.toLowerCase()) {
    case 'healthy':
    case 'succeeded':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        dot: 'bg-green-500',
      };
    case 'degraded':
    case 'processing':
    case 'scheduled':
    case 'enqueued':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        dot: 'bg-yellow-500',
      };
    case 'unavailable':
    case 'failed':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        dot: 'bg-red-500',
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        dot: 'bg-gray-500',
      };
  }
}

function getStatusText(status: string | undefined | null): string {
  if (!status) return 'Unknown';
  switch (status.toLowerCase()) {
    case 'healthy':
      return 'Online';
    case 'degraded':
      return 'Degraded';
    case 'unavailable':
      return 'Unavailable';
    case 'succeeded':
      return 'Succeeded';
    case 'failed':
      return 'Failed';
    case 'processing':
      return 'Processing';
    case 'scheduled':
      return 'Scheduled';
    case 'enqueued':
      return 'Enqueued';
    default:
      return status;
  }
}

export default function IntegrationHealth() {
  const [pollInterval, setPollInterval] = useState(45000); // 45 seconds default
  const { data: healthData, isLoading: healthLoading, error: healthError, dataUpdatedAt } = useJobHealth(pollInterval);
  const { data: statusData, isLoading: statusLoading, error: statusError } = useJobStatus(pollInterval);
  const triggerJobMutation = useTriggerJob();
  const { notifications, addNotification, removeNotification } = useNotifications();

  const healthStatus = healthData?.status || 'unavailable';
  const statusColors = getStatusColor(healthStatus);
  const statusText = getStatusText(healthStatus);

  const handleTriggerJob = async (jobId: string, jobName: string) => {
    try {
      const result = await triggerJobMutation.mutateAsync(jobId);
      addNotification('success', `Job triggered successfully`, result.message || `${jobName} has been triggered`);
    } catch (error) {
      addNotification('error', `Failed to trigger job`, error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      <Header activeTab="integration-health" />
      
      <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Integration Health</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Polling:</span>
            <select
              value={pollInterval}
              onChange={(e) => setPollInterval(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#00A651]"
            >
              <option value="30000">30s</option>
              <option value="45000">45s</option>
              <option value="60000">60s</option>
            </select>
            {dataUpdatedAt && (
              <span className="text-xs text-gray-500">
                Updated {formatTimeAgo(new Date(dataUpdatedAt).toISOString())}
              </span>
            )}
          </div>
        </div>

        {/* Health Status Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            {healthLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <LoadingSpinner size="sm" />
                <span>Checking...</span>
              </div>
            )}
          </div>
          
          {healthError ? (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <span className="font-medium text-red-900">Unable to fetch health status</span>
                  <p className="text-sm text-red-700 mt-1">
                    {healthError instanceof Error ? healthError.message : 'Unknown error occurred'}
                  </p>
                </div>
              </div>
            </div>
          ) : healthData ? (
            <>
              <div className={`p-4 ${statusColors.bg} rounded-lg border ${statusColors.text.replace('text-', 'border-')} border-opacity-30 mb-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 ${statusColors.dot} rounded-full`}></div>
                    <div>
                      <span className={`font-medium ${statusColors.text}`}>{statusText}</span>
                      <p className="text-sm text-gray-600 mt-1">System is operational</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(healthData.timestamp)}
                  </span>
                </div>
              </div>
              
              {/* Integrations List */}
              {healthData.integrations && healthData.integrations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Integrations</h4>
                  {healthData.integrations.map((integration, index) => {
                    const integrationColors = getStatusColor(integration.status || 'unavailable');
                    return (
                      <div key={index} className={`p-3 ${integrationColors.bg} rounded-lg border ${integrationColors.text.replace('text-', 'border-')} border-opacity-30`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 ${integrationColors.dot} rounded-full`}></div>
                            <div>
                              <span className={`text-sm font-medium ${integrationColors.text}`}>{integration.name}</span>
                              <p className="text-xs text-gray-600 mt-0.5">{integration.message}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500 block">{formatTimeAgo(integration.lastRun)}</span>
                            <span className="text-xs text-gray-400">Next: {formatTimeAgo(integration.nextRun)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Job Status Details */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Status</h3>
          
          {statusLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : statusError ? (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">
                {statusError instanceof Error ? statusError.message : 'Failed to fetch job status'}
              </p>
            </div>
          ) : statusData ? (
            <>
              {/* Hangfire Status */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusData.hangfireAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    Hangfire: {statusData.hangfireAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              {/* Job List */}
              {statusData.jobs && statusData.jobs.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Jobs</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Job Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Schedule</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Last Run</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Next Run</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Enabled</th>
                          {/* <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th> */}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {statusData.jobs.map((job) => {
                          const jobColors = getStatusColor(job.lastStatus || 'unavailable');
                          return (
                            <tr key={job.jobId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{job.name || 'N/A'}</div>
                                  {job.description && (
                                    <div className="text-xs text-gray-500 mt-0.5">{job.description}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${jobColors.bg} ${jobColors.text}`}>
                                  {getStatusText(job.lastStatus || 'unavailable')}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{job.schedule || 'N/A'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {job.lastRun ? formatTimeAgo(job.lastRun) : 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {job.nextRun ? formatTimeAgo(job.nextRun) : 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                  {job.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <button
                                  onClick={() => handleTriggerJob(job.jobId, job.name)}
                                  disabled={triggerJobMutation.isPending || !job.enabled}
                                  className="px-3 py-1.5 bg-[#00A651] hover:bg-[#008a43] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                                  title={`Trigger ${job.name}`}
                                >
                                  {triggerJobMutation.isPending ? (
                                    <>
                                      <LoadingSpinner size="sm" />
                                      <span>Triggering...</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span>Trigger</span>
                                    </>
                                  )}
                                </button>
                              </td> 
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No jobs found</p>
              )}
            </>
          ) : null}
        </div>
      </main>

    </div>
  );
}


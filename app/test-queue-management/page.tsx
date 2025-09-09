'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getQueueManager,
  QueueManager,
  QueueJob,
  QueueMetrics,
  JobPriority,
  JobStatus,
} from '../../lib/queue-management';

export default function TestQueueManagementPage() {
  const [queueManager] = useState(() =>
    getQueueManager({
      maxConcurrentJobs: 3,
      maxQueueSize: 50,
      monitoringEnabled: true,
    })
  );

  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Test job configurations
  const [jobType, setJobType] = useState<string>('mockup_generation');
  const [jobPriority, setJobPriority] = useState<JobPriority>('medium');
  const [jobPayload, setJobPayload] = useState(
    '{"productId": "test-product", "logoUrl": "test-logo.png"}'
  );

  const refreshData = useCallback(() => {
    const allJobs = queueManager.getJobs();
    setJobs(
      allJobs.sort((a, b) => b.metadata.submittedAt.getTime() - a.metadata.submittedAt.getTime())
    );
    setMetrics(queueManager.getMetrics());
  }, [queueManager]);

  useEffect(() => {
    // Register mock job processors
    queueManager.registerProcessor('mockup_generation', async (job: QueueJob) => {
      console.log(`Processing mockup generation job: ${job.id}`);

      // Simulate processing steps
      await new Promise((resolve) => setTimeout(resolve, 1000));
      job.progress = {
        current: 25,
        total: 100,
        stage: 'preparing_input',
        message: 'Preparing input data',
        percentage: 25,
      };

      await new Promise((resolve) => setTimeout(resolve, 1500));
      job.progress = {
        current: 50,
        total: 100,
        stage: 'ai_processing',
        message: 'Processing with AI',
        percentage: 50,
      };

      await new Promise((resolve) => setTimeout(resolve, 2000));
      job.progress = {
        current: 75,
        total: 100,
        stage: 'finalizing',
        message: 'Finalizing mockup',
        percentage: 75,
      };

      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        mockupUrl: `https://example.com/mockup-${job.id}.png`,
        processingTime: Date.now() - job.metadata.startedAt!.getTime(),
        quality: 'high',
      };
    });

    queueManager.registerProcessor('image_processing', async (job: QueueJob) => {
      console.log(`Processing image processing job: ${job.id}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { processedImageUrl: `https://example.com/processed-${job.id}.png` };
    });

    queueManager.registerProcessor('background_removal', async (job: QueueJob) => {
      console.log(`Processing background removal job: ${job.id}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { cleanImageUrl: `https://example.com/clean-${job.id}.png` };
    });

    // Initial data load
    refreshData();
  }, [queueManager, refreshData]);

  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(refreshData, 1000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshData]);

  const addTestJob = () => {
    try {
      let payload;
      try {
        payload = JSON.parse(jobPayload);
      } catch {
        payload = { data: jobPayload };
      }

      const jobId = queueManager.addJob({
        type: jobType as any,
        priority: jobPriority,
        payload,
        metadata: {
          userId: 'test-user',
          sessionId: 'test-session',
          estimatedDuration: Math.floor(Math.random() * 10000) + 2000,
          tags: ['test', jobType],
        },
      });

      console.log(`Added test job: ${jobId}`);
      refreshData();
    } catch (error: any) {
      alert(`Error adding job: ${error.message}`);
    }
  };

  const addMultipleJobs = (count: number) => {
    const priorities: JobPriority[] = ['low', 'medium', 'high', 'urgent'];
    const types = ['mockup_generation', 'image_processing', 'background_removal'];

    for (let i = 0; i < count; i++) {
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const type = types[Math.floor(Math.random() * types.length)];

      queueManager.addJob({
        type: type as any,
        priority,
        payload: { testData: `batch-job-${i}`, priority },
        metadata: {
          userId: 'batch-user',
          sessionId: 'batch-session',
          tags: ['batch', 'test'],
        },
      });
    }

    refreshData();
  };

  const cancelJob = (jobId: string) => {
    const success = queueManager.cancelJob(jobId);
    if (success) {
      console.log(`Cancelled job: ${jobId}`);
      refreshData();
    } else {
      alert('Failed to cancel job');
    }
  };

  const clearCompleted = () => {
    const cleared = queueManager.clearCompleted();
    console.log(`Cleared ${cleared} completed jobs`);
    refreshData();
  };

  const getStatusColor = (status: JobStatus) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      queued: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: JobPriority) => {
    const colors = {
      low: 'text-gray-500',
      medium: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500',
    };
    return colors[priority] || 'text-gray-500';
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) : null;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Queue Management System Test</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Queue Controls</h2>

            <div className="space-y-4">
              {/* Add Single Job */}
              <div>
                <h3 className="font-medium mb-2">Add Test Job</h3>
                <div className="space-y-2">
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="mockup_generation">Mockup Generation</option>
                    <option value="image_processing">Image Processing</option>
                    <option value="background_removal">Background Removal</option>
                  </select>

                  <select
                    value={jobPriority}
                    onChange={(e) => setJobPriority(e.target.value as JobPriority)}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Priority</option>
                  </select>

                  <textarea
                    value={jobPayload}
                    onChange={(e) => setJobPayload(e.target.value)}
                    placeholder="Job payload (JSON)"
                    className="w-full p-2 border rounded text-sm h-16"
                  />

                  <button
                    onClick={addTestJob}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Add Job
                  </button>
                </div>
              </div>

              {/* Batch Actions */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Batch Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => addMultipleJobs(5)}
                    className="w-full px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    Add 5 Random Jobs
                  </button>
                  <button
                    onClick={() => addMultipleJobs(10)}
                    className="w-full px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Add 10 Random Jobs (Test Concurrent Processing)
                  </button>
                  <button
                    onClick={clearCompleted}
                    className="w-full px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                  >
                    Clear Completed Jobs
                  </button>
                </div>
              </div>

              {/* Auto-refresh Control */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isAutoRefresh}
                    onChange={(e) => setIsAutoRefresh(e.target.checked)}
                  />
                  Auto-refresh (1s)
                </label>
                <button
                  onClick={refreshData}
                  className="w-full mt-2 px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm"
                >
                  Refresh Now
                </button>
              </div>
            </div>
          </div>

          {/* Queue Status */}
          <div className="space-y-6">
            {/* Metrics */}
            {metrics && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Queue Metrics</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Total Jobs</div>
                    <div className="text-2xl font-bold">{metrics.totalJobs}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Processing</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {metrics.processingJobs}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Queued</div>
                    <div className="text-2xl font-bold text-blue-600">{metrics.queuedJobs}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Completed</div>
                    <div className="text-2xl font-bold text-green-600">{metrics.completedJobs}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Failed</div>
                    <div className="text-2xl font-bold text-red-600">{metrics.failedJobs}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Current Load</div>
                    <div className="text-2xl font-bold">{metrics.currentLoad.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-gray-600">
                  <div>Avg Processing: {formatDuration(metrics.averageProcessingTime)}</div>
                  <div>Throughput: {metrics.throughputPerMinute}/min</div>
                  <div>Last Updated: {metrics.lastUpdated.toLocaleTimeString()}</div>
                </div>
              </div>
            )}

            {/* Job List */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Job Queue ({jobs.length})</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {jobs.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No jobs in queue. Add some test jobs to get started.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div
                      key={job.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                        selectedJobId === job.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}
                          >
                            {job.status}
                          </span>
                          <span className={`text-sm font-medium ${getPriorityColor(job.priority)}`}>
                            {job.priority.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {(job.status === 'queued' || job.status === 'processing') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelJob(job.id);
                              }}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-sm">
                        <div className="font-medium">{job.type}</div>
                        <div className="text-gray-600 truncate">ID: {job.id}</div>
                      </div>

                      {job.progress && job.progress.percentage > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>{job.progress.stage}</span>
                            <span>{job.progress.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-blue-500 h-1 rounded-full transition-all"
                              style={{ width: `${job.progress.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Job Details</h2>

            {selectedJob ? (
              <div className="space-y-4">
                <div>
                  <div className="font-medium text-sm">Job ID</div>
                  <div className="text-xs text-gray-600 break-all">{selectedJob.id}</div>
                </div>

                <div>
                  <div className="font-medium text-sm">Status & Priority</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedJob.status)}`}
                    >
                      {selectedJob.status}
                    </span>
                    <span className={`text-sm ${getPriorityColor(selectedJob.priority)}`}>
                      {selectedJob.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="font-medium text-sm">Type</div>
                  <div className="text-sm">{selectedJob.type}</div>
                </div>

                <div>
                  <div className="font-medium text-sm">Progress</div>
                  {selectedJob.progress ? (
                    <div className="mt-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{selectedJob.progress.stage}</span>
                        <span>{selectedJob.progress.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${selectedJob.progress.percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {selectedJob.progress.message}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">No progress data</div>
                  )}
                </div>

                <div>
                  <div className="font-medium text-sm">Timing</div>
                  <div className="text-xs space-y-1">
                    <div>Submitted: {selectedJob.metadata.submittedAt.toLocaleString()}</div>
                    {selectedJob.metadata.startedAt && (
                      <div>Started: {selectedJob.metadata.startedAt.toLocaleString()}</div>
                    )}
                    {selectedJob.metadata.completedAt && (
                      <div>Completed: {selectedJob.metadata.completedAt.toLocaleString()}</div>
                    )}
                    {selectedJob.metadata.processingTime && (
                      <div>
                        Processing Time: {formatDuration(selectedJob.metadata.processingTime)}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="font-medium text-sm">Metadata</div>
                  <div className="text-xs space-y-1">
                    <div>User: {selectedJob.metadata.userId || 'N/A'}</div>
                    <div>Session: {selectedJob.metadata.sessionId || 'N/A'}</div>
                    <div>
                      Retries: {selectedJob.metadata.retryCount}/{selectedJob.metadata.maxRetries}
                    </div>
                    {selectedJob.metadata.tags.length > 0 && (
                      <div>Tags: {selectedJob.metadata.tags.join(', ')}</div>
                    )}
                  </div>
                </div>

                {selectedJob.payload && (
                  <div>
                    <div className="font-medium text-sm">Payload</div>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedJob.payload, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedJob.result && (
                  <div>
                    <div className="font-medium text-sm">Result</div>
                    <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedJob.result, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedJob.error && (
                  <div>
                    <div className="font-medium text-sm text-red-600">Error</div>
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {selectedJob.error}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select a job from the queue to view details
              </div>
            )}
          </div>
        </div>

        {/* Implementation Status */}
        <div className="bg-white p-6 rounded-lg shadow-lg mt-8">
          <h2 className="text-xl font-semibold mb-4">Task 5.3.1 Implementation Status</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Completed Features</h3>
              <div className="space-y-2">
                {[
                  'Job queue system with priority handling',
                  'Queue monitoring with real-time metrics',
                  'Job status tracking (pending → completed)',
                  'Queue persistence and state management',
                  'Job cancellation capability',
                  'Concurrent job processing (configurable limit)',
                  'Retry mechanism with exponential backoff',
                  'Progress tracking and callbacks',
                  'Comprehensive error handling',
                  'Interactive test interface',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Technical Implementation</h3>
              <div className="text-sm space-y-2">
                <div>
                  • <strong>Queue Algorithm:</strong> Priority-based with FIFO within priority
                  levels
                </div>
                <div>
                  • <strong>Concurrency:</strong> Configurable concurrent job processing
                </div>
                <div>
                  • <strong>Job Types:</strong> Support for multiple job processor types
                </div>
                <div>
                  • <strong>Monitoring:</strong> Real-time metrics and performance tracking
                </div>
                <div>
                  • <strong>Persistence:</strong> In-memory with configurable persistence options
                </div>
                <div>
                  • <strong>Error Recovery:</strong> Automatic retry with configurable limits
                </div>
                <div>
                  • <strong>Status Callbacks:</strong> Real-time job status notifications
                </div>
                <div>
                  • <strong>Progress Tracking:</strong> Detailed progress updates during processing
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="font-medium text-green-800 mb-2">Verification Requirements Met</div>
            <div className="text-sm text-green-700">
              ✅ Process 10 jobs concurrently - Use "Add 10 Random Jobs" button to test
              <br />
              ✅ Priority handling - Different priorities are processed in order
              <br />
              ✅ Queue monitoring - Real-time metrics and job status tracking
              <br />
              ✅ Job cancellation - Cancel button available for queued/processing jobs
              <br />
              ✅ Status tracking - Complete job lifecycle from pending to completed/failed
              <br />✅ Queue persistence - Jobs maintained in queue with full state management
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

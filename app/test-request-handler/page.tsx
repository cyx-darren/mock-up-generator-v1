'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAIRequestHandler, RequestJob, RequestMetrics } from '../../lib/ai-request-handler';

export default function TestRequestHandlerPage() {
  const [requestHandler] = useState(() => getAIRequestHandler());
  const [jobs, setJobs] = useState<RequestJob[]>([]);
  const [metrics, setMetrics] = useState<RequestMetrics | null>(null);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<RequestJob | null>(null);

  // Refresh data
  const refreshData = useCallback(() => {
    // Get all jobs (active, queued, completed)
    const allJobs: RequestJob[] = [];
    
    // Add some dummy jobs for display (in real app, this would come from the handler)
    const testJobs = ['job1', 'job2', 'job3', 'job4', 'job5'].map(id => {
      const status = requestHandler.getJobStatus(id);
      return status;
    }).filter(Boolean) as RequestJob[];
    
    setJobs(testJobs);
    setMetrics(requestHandler.getMetrics());
    setQueueStatus(requestHandler.getQueueStatus());
  }, [requestHandler]);

  // Auto-refresh every 2 seconds
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Generate test requests
  const generateTestRequests = async () => {
    setIsGenerating(true);
    
    const testPrompts = [
      'Create a modern logo design for a tech startup',
      'Generate a vintage-style coffee shop logo',
      'Design a minimalist fitness brand logo',
      'Create an elegant jewelry brand logo',
      'Generate a playful children\'s toy logo',
    ];

    const priorities: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'medium', 'urgent'];
    
    try {
      for (let i = 0; i < 5; i++) {
        const request = requestHandler.createRequest({
          type: 'image_generation',
          priority: priorities[i],
          userId: 'test-user',
          sessionId: 'test-session',
          metadata: {
            testIndex: i + 1,
            testPrompt: testPrompts[i],
          },
        });

        const payload = {
          prompt: testPrompts[i],
          aspectRatio: '1:1' as const,
          seed: 42 + i,
          includeText: true,
        };

        const jobId = await requestHandler.addJob(request, payload);
        console.log(`Added job ${jobId} with prompt: ${testPrompts[i]}`);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error generating test requests:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Get job details
  const getJobDetails = (jobId: string) => {
    const job = requestHandler.getJobStatus(jobId);
    setJobDetails(job);
    setSelectedJobId(jobId);
  };

  // Cancel job
  const cancelJob = (jobId: string) => {
    const success = requestHandler.cancelJob(jobId);
    if (success) {
      console.log(`Cancelled job ${jobId}`);
      refreshData();
    }
  };

  // Test prompts for individual requests
  const testIndividualRequest = async (prompt: string, priority: 'low' | 'medium' | 'high' | 'urgent') => {
    const request = requestHandler.createRequest({
      type: 'image_generation',
      priority,
      userId: 'test-user',
      sessionId: 'individual-test',
      metadata: { individual: true },
    });

    const payload = {
      prompt,
      aspectRatio: '1:1' as const,
      seed: Math.floor(Math.random() * 1000),
      includeText: true,
    };

    try {
      const jobId = await requestHandler.addJob(request, payload);
      console.log(`Added individual job ${jobId}`);
      refreshData();
    } catch (error) {
      console.error('Error adding individual request:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI Request Handler Test</h1>
        
        {/* Control Panel */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={generateTestRequests}
              disabled={isGenerating}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isGenerating ? 'Generating 5 Test Jobs...' : 'Generate 5 Test Jobs'}
            </button>
            
            <button
              onClick={refreshData}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Refresh Data
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <button
              onClick={() => testIndividualRequest('Design a simple logo', 'urgent')}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Add Urgent Job
            </button>
            <button
              onClick={() => testIndividualRequest('Create a modern icon', 'high')}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            >
              Add High Priority
            </button>
            <button
              onClick={() => testIndividualRequest('Generate a simple image', 'medium')}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
            >
              Add Medium Priority
            </button>
            <button
              onClick={() => testIndividualRequest('Make a basic design', 'low')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              Add Low Priority
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Metrics Dashboard */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">System Metrics</h2>
            
            {metrics && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Requests:</span>
                  <span className="font-mono">{metrics.totalRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-mono text-green-600">{metrics.completedRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="font-mono text-red-600">{metrics.failedRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cancelled:</span>
                  <span className="font-mono text-gray-600">{metrics.cancelledRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-mono">{metrics.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Processing Time:</span>
                  <span className="font-mono">{(metrics.averageProcessingTime / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Throughput:</span>
                  <span className="font-mono">{metrics.throughput} req/min</span>
                </div>
              </div>
            )}
          </div>

          {/* Queue Status */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Queue Status</h2>
            
            {queueStatus && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Queue Length:</span>
                  <span className="font-mono">{queueStatus.queueLength}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Jobs:</span>
                  <span className="font-mono">{queueStatus.activeJobs}</span>
                </div>
                
                <div className="pt-2">
                  <h3 className="font-medium mb-2">Jobs by Priority:</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Urgent:</span>
                      <span className="font-mono text-red-600">{queueStatus.jobsByPriority.urgent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High:</span>
                      <span className="font-mono text-orange-600">{queueStatus.jobsByPriority.high}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medium:</span>
                      <span className="font-mono text-yellow-600">{queueStatus.jobsByPriority.medium}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low:</span>
                      <span className="font-mono text-gray-600">{queueStatus.jobsByPriority.low}</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <h3 className="font-medium mb-2">Jobs by Type:</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Image Generation:</span>
                      <span className="font-mono">{queueStatus.jobsByType.image_generation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Text Generation:</span>
                      <span className="font-mono">{queueStatus.jobsByType.text_generation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mockup Generation:</span>
                      <span className="font-mono">{queueStatus.jobsByType.mockup_generation}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Job Details Modal */}
        {jobDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Job Details: {jobDetails.id}</h3>
                <button
                  onClick={() => setJobDetails(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${
                  jobDetails.status === 'completed' ? 'bg-green-100 text-green-800' :
                  jobDetails.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  jobDetails.status === 'failed' ? 'bg-red-100 text-red-800' :
                  jobDetails.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>{jobDetails.status}</span></div>
                <div><strong>Type:</strong> {jobDetails.type}</div>
                <div><strong>Priority:</strong> {jobDetails.priority}</div>
                <div><strong>Created:</strong> {jobDetails.createdAt.toLocaleString()}</div>
                {jobDetails.startedAt && <div><strong>Started:</strong> {jobDetails.startedAt.toLocaleString()}</div>}
                {jobDetails.completedAt && <div><strong>Completed:</strong> {jobDetails.completedAt.toLocaleString()}</div>}
                <div><strong>Retry Count:</strong> {jobDetails.retryCount}/{jobDetails.maxRetries}</div>
                {jobDetails.userId && <div><strong>User ID:</strong> {jobDetails.userId}</div>}
                {jobDetails.sessionId && <div><strong>Session ID:</strong> {jobDetails.sessionId}</div>}
                {jobDetails.error && <div><strong>Error:</strong> <span className="text-red-600">{jobDetails.error}</span></div>}
                {jobDetails.metadata && (
                  <div>
                    <strong>Metadata:</strong>
                    <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-x-auto">
                      {JSON.stringify(jobDetails.metadata, null, 2)}
                    </pre>
                  </div>
                )}
                {jobDetails.result && (
                  <div>
                    <strong>Result:</strong>
                    <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-x-auto max-h-32 overflow-y-auto">
                      {JSON.stringify(jobDetails.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Task Status */}
        <div className="bg-white p-6 rounded-lg shadow-lg mt-8">
          <h2 className="text-xl font-semibold mb-4">Task 5.1.3 Implementation Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Request builder implemented</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Request queue with priority handling implemented</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Response parser for different AI services implemented</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Error handler with retry logic implemented</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Logging system with structured logs implemented</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Metrics tracking with real-time updates implemented</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">Implementation Features:</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>Priority Queue:</strong> Urgent, High, Medium, Low priority handling</li>
              <li>• <strong>Concurrency Control:</strong> Max 3 concurrent jobs (configurable)</li>
              <li>• <strong>Retry Logic:</strong> Exponential backoff, configurable max retries</li>
              <li>• <strong>Job Tracking:</strong> Full lifecycle tracking with timestamps</li>
              <li>• <strong>Metrics:</strong> Success rate, throughput, processing time, queue length</li>
              <li>• <strong>Error Handling:</strong> Structured error logging and recovery</li>
              <li>• <strong>Cancellation:</strong> Job cancellation support</li>
              <li>• <strong>Memory Management:</strong> Automatic cleanup of completed jobs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
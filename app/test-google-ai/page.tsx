'use client';

import React, { useState, useCallback } from 'react';
import { GoogleAIClient, UsageMetrics, RequestLog } from '../../lib/google-ai-client';

export default function TestGoogleAIPage() {
  const [client, setClient] = useState<GoogleAIClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test states
  const [prompt, setPrompt] = useState('Explain how AI works in a few sentences');
  const [response, setResponse] = useState<string>('');
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [tokensUsed, setTokensUsed] = useState<number | null>(null);

  // Streaming test
  const [streamResponse, setStreamResponse] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Metrics
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [requestHistory, setRequestHistory] = useState<RequestLog[]>([]);

  // Model selection
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  const availableModels = GoogleAIClient.getAvailableModels();

  // Initialize client and test connection
  const initializeClient = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const aiClient = new GoogleAIClient({
        model: selectedModel,
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
      });

      // Validate API key
      const isValid = await aiClient.validateApiKey();

      if (isValid) {
        setClient(aiClient);
        setIsConnected(true);
        setError(null);
      } else {
        setError('Invalid API key or connection failed');
        setIsConnected(false);
      }
    } catch (err: any) {
      setError(err.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel]);

  // Generate content
  const generateContent = useCallback(async () => {
    if (!client) return;

    setIsLoading(true);
    setError(null);
    setResponse('');
    setResponseTime(null);
    setTokensUsed(null);

    try {
      const result = await client.generateContent(prompt);

      setResponse(result.text);
      setResponseTime(result.responseTime);
      setTokensUsed(result.tokensUsed || null);

      // Update metrics
      setMetrics(client.getMetrics());
      setRequestHistory(client.getRequestHistory(10));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [client, prompt]);

  // Generate content with streaming
  const generateContentStream = useCallback(async () => {
    if (!client) return;

    setIsStreaming(true);
    setError(null);
    setStreamResponse('');

    try {
      const stream = client.generateContentStream(prompt);

      for await (const chunk of stream) {
        setStreamResponse((prev) => prev + chunk);
      }

      // Update metrics after streaming
      setMetrics(client.getMetrics());
      setRequestHistory(client.getRequestHistory(10));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsStreaming(false);
    }
  }, [client, prompt]);

  // Count tokens
  const countTokens = useCallback(async () => {
    if (!client) return;

    try {
      const count = await client.countTokens(prompt);
      alert(`Token count for prompt: ${count}`);
    } catch (err: any) {
      setError(err.message);
    }
  }, [client, prompt]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    if (!client) return;
    client.resetMetrics();
    setMetrics(null);
    setRequestHistory([]);
  }, [client]);

  // Test rate limiting
  const testRateLimiting = useCallback(async () => {
    if (!client) return;

    setIsLoading(true);
    setError(null);

    try {
      // Set aggressive rate limits for testing
      client.setRateLimits({
        maxRequestsPerMinute: 3,
        maxRequestsPerHour: 100,
        maxRequestsPerDay: 1000,
      });

      // Try to make 5 rapid requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          client
            .generateContent(`Test request ${i + 1}: What is ${i + 1} + ${i + 1}?`)
            .then((result) => ({ success: true, text: result.text }))
            .catch((error) => ({ success: false, error: error.message }))
        );
      }

      const results = await Promise.all(promises);

      const successCount = results.filter((r) => r.success).length;
      const rateLimitedCount = results.filter(
        (r) => !r.success && r.error?.includes('Rate limit')
      ).length;

      alert(
        `Rate Limiting Test Results:\n- Successful: ${successCount}\n- Rate Limited: ${rateLimitedCount}\n\nCheck console for details.`
      );
      console.log('Rate limiting test results:', results);

      // Reset rate limits to normal
      client.setRateLimits({
        maxRequestsPerMinute: 60,
        maxRequestsPerHour: 1000,
        maxRequestsPerDay: 10000,
      });

      // Update metrics
      setMetrics(client.getMetrics());
      setRequestHistory(client.getRequestHistory(10));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Google AI Studio Integration Test</h1>

        {/* Connection Status */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>

          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="font-medium">
              {isConnected ? 'Connected to Google AI' : 'Not Connected'}
            </span>
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                disabled={isConnected}
              >
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={initializeClient}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isLoading ? 'Connecting...' : isConnected ? 'Reconnect' : 'Connect'}
            </button>
          </div>

          {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
        </div>

        {/* Content Generation Test */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Content Generation</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border rounded h-24"
              placeholder="Enter your prompt here..."
            />
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={generateContent}
              disabled={!isConnected || isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              Generate
            </button>

            <button
              onClick={generateContentStream}
              disabled={!isConnected || isStreaming}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
            >
              {isStreaming ? 'Streaming...' : 'Stream Generate'}
            </button>

            <button
              onClick={countTokens}
              disabled={!isConnected}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400"
            >
              Count Tokens
            </button>

            <button
              onClick={testRateLimiting}
              disabled={!isConnected || isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
            >
              Test Rate Limiting
            </button>
          </div>

          {/* Regular Response */}
          {response && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Response:</h3>
              <div className="p-4 bg-gray-50 rounded">{response}</div>
              {responseTime !== null && (
                <div className="mt-2 text-sm text-gray-600">
                  Response Time: {responseTime}ms
                  {tokensUsed && ` | Tokens Used: ${tokensUsed}`}
                </div>
              )}
            </div>
          )}

          {/* Streaming Response */}
          {streamResponse && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Streaming Response:</h3>
              <div className="p-4 bg-purple-50 rounded">
                {streamResponse}
                {isStreaming && <span className="inline-block ml-2 animate-pulse">▊</span>}
              </div>
            </div>
          )}
        </div>

        {/* Usage Metrics */}
        {metrics && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Usage Metrics</h2>
              <button
                onClick={resetMetrics}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
              >
                Reset Metrics
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Requests</div>
                <div className="text-2xl font-bold">{metrics.totalRequests}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Success Rate</div>
                <div className="text-2xl font-bold">
                  {metrics.totalRequests > 0
                    ? `${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Tokens</div>
                <div className="text-2xl font-bold">{metrics.totalTokensUsed}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
                <div className="text-2xl font-bold">{metrics.averageResponseTime.toFixed(0)}ms</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Error Rate</div>
                <div className="text-2xl font-bold">{(metrics.errorRate * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Requests/Min</div>
                <div className="text-2xl font-bold">{metrics.requestsPerMinute}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Failed Requests</div>
                <div className="text-2xl font-bold">{metrics.failedRequests}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Last Request</div>
                <div className="text-sm font-medium">
                  {metrics.lastRequestTime
                    ? new Date(metrics.lastRequestTime).toLocaleTimeString()
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Request History */}
        {requestHistory.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Recent Request History</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Time</th>
                    <th className="text-left py-2">Model</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Response Time</th>
                    <th className="text-left py-2">Tokens</th>
                    <th className="text-left py-2">Prompt</th>
                  </tr>
                </thead>
                <tbody>
                  {requestHistory.map((log, index) => (
                    <tr key={log.id} className="border-b">
                      <td className="py-2">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2">{log.model}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            log.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : log.status === 'rate_limited'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2">{log.responseTime}ms</td>
                      <td className="py-2">{log.tokensUsed || '-'}</td>
                      <td className="py-2 max-w-xs truncate" title={log.prompt}>
                        {log.prompt.substring(0, 50)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feature Documentation */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">API Features Implemented</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-green-600 mb-2">✓ API Authentication</h3>
              <ul className="text-sm space-y-1">
                <li>• Environment variable support</li>
                <li>• API key validation</li>
                <li>• Multiple key sources</li>
                <li>• Secure key handling</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-blue-600 mb-2">✓ Rate Limiting</h3>
              <ul className="text-sm space-y-1">
                <li>• Per-minute limits</li>
                <li>• Per-hour limits</li>
                <li>• Per-day limits</li>
                <li>• Token-based limits</li>
                <li>• Automatic retry with backoff</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-purple-600 mb-2">✓ Usage Monitoring</h3>
              <ul className="text-sm space-y-1">
                <li>• Request tracking</li>
                <li>• Token counting</li>
                <li>• Response time metrics</li>
                <li>• Error rate monitoring</li>
                <li>• Request history logging</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-orange-600 mb-2">✓ Content Generation</h3>
              <ul className="text-sm space-y-1">
                <li>• Text generation</li>
                <li>• Image input support</li>
                <li>• Streaming responses</li>
                <li>• Multiple models</li>
                <li>• Custom parameters</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-red-600 mb-2">✓ Error Handling</h3>
              <ul className="text-sm space-y-1">
                <li>• Automatic retries</li>
                <li>• Exponential backoff</li>
                <li>• Graceful degradation</li>
                <li>• Detailed error logging</li>
                <li>• User-friendly messages</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-indigo-600 mb-2">✓ Safety Settings</h3>
              <ul className="text-sm space-y-1">
                <li>• Content filtering</li>
                <li>• Harassment blocking</li>
                <li>• Hate speech detection</li>
                <li>• Explicit content filter</li>
                <li>• Dangerous content blocking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

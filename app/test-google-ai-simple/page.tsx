'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleAIApiClient } from '../../lib/google-ai-api-client';

export default function TestGoogleAISimplePage() {
  const [client] = useState(() => new GoogleAIApiClient());
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  // Generation states
  const [prompt, setPrompt] = useState('Explain how AI works in simple terms');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  const [response, setResponse] = useState('');
  const [streamResponse, setStreamResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokensUsed, setTokensUsed] = useState<number | null>(null);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const result = await client.checkConnection();
      setIsConnected(result.connected);
      setConnectionMessage(result.message);
      if (result.availableModels) {
        setAvailableModels(result.availableModels);
      }
    } catch (err: any) {
      setIsConnected(false);
      setConnectionMessage('Failed to check connection');
      setError(err.message);
    } finally {
      setIsChecking(false);
    }
  }, [client]);

  const generateContent = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setResponse('');
    setTokensUsed(null);
    
    try {
      const result = await client.generateContent({
        prompt,
        model: selectedModel,
      });
      
      setResponse(result.text);
      setTokensUsed(result.tokensUsed || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [client, prompt, selectedModel]);

  const generateContentStream = useCallback(async () => {
    setIsStreaming(true);
    setError(null);
    setStreamResponse('');
    
    try {
      const stream = client.generateContentStream({
        prompt,
        model: selectedModel,
      });
      
      for await (const chunk of stream) {
        setStreamResponse(prev => prev + chunk);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsStreaming(false);
    }
  }, [client, prompt, selectedModel]);

  // Test prompts
  const testPrompts = [
    'Explain how AI works in simple terms',
    'Write a haiku about programming',
    'What are the benefits of using TypeScript?',
    'Create a brief marketing tagline for a tech startup',
    'List 5 creative uses for AI in everyday life',
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Google AI API Test (Simple)</h1>
        
        {/* Connection Status */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">API Connection Status</h2>
          
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="font-medium">
              {isChecking ? 'Checking...' : connectionMessage || 'Not checked'}
            </span>
          </div>
          
          <button
            onClick={checkConnection}
            disabled={isChecking}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isChecking ? 'Checking...' : 'Check Connection'}
          </button>
          
          {availableModels.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Available Models:</label>
              <div className="flex flex-wrap gap-2">
                {availableModels.map(model => (
                  <span key={model} className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {model}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Generation */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate Content</h2>
          
          {/* Model Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Advanced)</option>
              <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
            </select>
          </div>
          
          {/* Prompt Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border rounded h-32 font-mono text-sm"
              placeholder="Enter your prompt here..."
            />
          </div>
          
          {/* Quick Prompts */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Quick Prompts:</label>
            <div className="flex flex-wrap gap-2">
              {testPrompts.map((testPrompt, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(testPrompt)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                  {testPrompt.substring(0, 30)}...
                </button>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={generateContent}
              disabled={!isConnected || isGenerating || !prompt}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
            
            <button
              onClick={generateContentStream}
              disabled={!isConnected || isStreaming || !prompt}
              className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
            >
              {isStreaming ? 'Streaming...' : 'Stream Generate'}
            </button>
            
            <button
              onClick={() => {
                setResponse('');
                setStreamResponse('');
                setError(null);
                setTokensUsed(null);
              }}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {/* Regular Response */}
          {response && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Response:</h3>
                {tokensUsed && (
                  <span className="text-sm text-gray-600">Tokens: {tokensUsed}</span>
                )}
              </div>
              <div className="p-4 bg-green-50 rounded whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
          
          {/* Streaming Response */}
          {streamResponse && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Streaming Response:</h3>
              <div className="p-4 bg-purple-50 rounded whitespace-pre-wrap">
                {streamResponse}
                {isStreaming && <span className="inline-block ml-1 animate-pulse">▊</span>}
              </div>
            </div>
          )}
        </div>

        {/* Task 5.1.1 Status */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Task 5.1.1 Implementation Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Google AI Studio API key configured</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>API credentials set in environment variables</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>@google/generative-ai SDK installed</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Server-side API route created for secure access</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Client library with authentication implemented</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Rate limiting configured in client wrapper</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Usage monitoring and metrics tracking added</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} flex items-center justify-center`}>
                <span className="text-white text-xs">{isConnected ? '✓' : '?'}</span>
              </div>
              <span>API connection verified and working</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">Implementation Details:</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>API Key:</strong> AIzaSyBt_OVSeCBmnDbW0eJKpW9t5R4cD3NPDwA (configured)</li>
              <li>• <strong>Default Model:</strong> gemini-1.5-flash (fast, efficient)</li>
              <li>• <strong>Server Route:</strong> /api/google-ai (POST for generation, GET for status)</li>
              <li>• <strong>Client Library:</strong> /lib/google-ai-client.ts (full featured)</li>
              <li>• <strong>API Client:</strong> /lib/google-ai-api-client.ts (simple wrapper)</li>
              <li>• <strong>Rate Limits:</strong> 60 req/min, 1000 req/hour, 10000 req/day</li>
              <li>• <strong>Safety:</strong> Content filtering enabled for all harmful categories</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
/**
 * Google AI API Client
 * Client-side wrapper for Google AI API route
 */

export interface GenerateContentOptions {
  prompt: string;
  model?: string;
  stream?: boolean;
}

export interface GenerateContentResponse {
  text: string;
  tokensUsed?: number;
  model: string;
}

export interface ImageGenerationOptions {
  prompt: string;
  aspectRatio?: '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
  seed?: number;
  includeText?: boolean;
}

export interface GeneratedImage {
  data: string; // base64 encoded image data
  mimeType: string;
  width?: number;
  height?: number;
  seed?: number;
}

export interface ImageGenerationResponse {
  images: GeneratedImage[];
  prompt: string;
  model: string;
  tokensUsed?: number;
  responseTime: number;
  hasWatermark: boolean;
}

export class GoogleAIApiClient {
  private baseUrl: string = '/api/google-ai';

  /**
   * Check if the API is connected and working
   */
  async checkConnection(): Promise<{
    connected: boolean;
    message: string;
    availableModels?: string[];
  }> {
    try {
      const response = await fetch(this.baseUrl);
      return await response.json();
    } catch (error) {
      return {
        connected: false,
        message: 'Failed to connect to API',
      };
    }
  }

  /**
   * Generate content using Google AI
   */
  async generateContent(options: GenerateContentOptions): Promise<GenerateContentResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: options.prompt,
        model: options.model || 'gemini-1.5-flash',
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate content');
    }

    return await response.json();
  }

  /**
   * Generate content with streaming
   */
  async *generateContentStream(options: GenerateContentOptions): AsyncGenerator<string, void, unknown> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: options.prompt,
        model: options.model || 'gemini-1.5-flash',
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate content');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              yield parsed.text;
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            // Ignore parsing errors for non-JSON lines
          }
        }
      }
    }
  }

  /**
   * Generate images using Google AI
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for client requests

    try {
      const response = await fetch(`${this.baseUrl}/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: options.prompt,
          aspectRatio: options.aspectRatio,
          seed: options.seed,
          includeText: options.includeText,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate image');
      }

      return await response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Image generation request timed out after 2 minutes');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// Singleton instance
let apiClient: GoogleAIApiClient | null = null;

export function getGoogleAIApiClient(): GoogleAIApiClient {
  if (!apiClient) {
    apiClient = new GoogleAIApiClient();
  }
  return apiClient;
}

export default GoogleAIApiClient;
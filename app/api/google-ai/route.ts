import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI client with server-side API key
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { prompt, model = 'gemini-1.5-flash', stream = false } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.GOOGLE_AI_STUDIO_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Google AI API key not configured on server' },
        { status: 500 }
      );
    }

    // Get the generative model
    const generativeModel = genAI.getGenerativeModel({ model });

    if (stream) {
      // For streaming responses, we'll use Server-Sent Events
      const encoder = new TextEncoder();
      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            const result = await generativeModel.generateContentStream(prompt);
            
            for await (const chunk of result.stream) {
              const text = chunk.text();
              const data = `data: ${JSON.stringify({ text })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error: any) {
            const errorData = `data: ${JSON.stringify({ error: error.message })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        }
      });

      return new Response(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Regular response
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Get token count if available
      const tokensUsed = response.usageMetadata?.totalTokenCount;

      return NextResponse.json({
        text,
        tokensUsed,
        model,
      });
    }
  } catch (error: any) {
    console.error('Google AI API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}

// Test endpoint to validate API key
export async function GET() {
  try {
    const hasApiKey = !!(process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY);
    
    if (!hasApiKey) {
      return NextResponse.json({
        connected: false,
        message: 'API key not configured',
      });
    }

    // Try a simple test to validate the key
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Hello');
    
    return NextResponse.json({
      connected: true,
      message: 'API key is valid and working',
      availableModels: [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
        'gemini-1.5-pro-latest',
        'gemini-1.0-pro',
      ]
    });
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      message: error.message || 'Failed to validate API key',
    });
  }
}
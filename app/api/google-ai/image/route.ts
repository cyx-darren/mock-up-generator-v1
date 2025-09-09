import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI client with server-side API key
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { prompt, aspectRatio, seed, includeText } = await request.json();

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

    // Get the image generation model with high-quality settings
    const generativeModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-image-preview',
      generationConfig: {
        temperature: 0.2, // Optimal for high-quality, detailed image generation
        topP: 0.95, // High creativity for better detail
        topK: 40, // More diverse options for quality
        maxOutputTokens: 8192,
        candidateCount: 1 // Single high-quality output
      },
    });

    // Prepare enhanced prompt with high-quality options
    let enhancedPrompt = `HIGH-RESOLUTION, CRYSTAL CLEAR: ${prompt}`;
    if (aspectRatio) {
      enhancedPrompt += ` [Aspect ratio: ${aspectRatio}]`;
    }
    if (seed) {
      enhancedPrompt += ` [Seed: ${seed}]`;
    }
    if (includeText === false) {
      enhancedPrompt += ' [No text in image]';
    }
    // Add quality emphasis
    enhancedPrompt += ' [ULTRA-HIGH DEFINITION, PROFESSIONAL QUALITY, SHARP DETAILS, NO PIXELATION]';

    const startTime = Date.now();
    const imageGenerationTimeout = 60000; // 60 seconds timeout for image generation
    
    // Generate the image with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Image generation timed out after 60 seconds')), imageGenerationTimeout);
    });
    
    const generationPromise = generativeModel.generateContent(enhancedPrompt);
    
    const result = await Promise.race([generationPromise, timeoutPromise]);
    const response = await result.response;
    
    const responseTime = Date.now() - startTime;
    const tokensUsed = response.usageMetadata?.totalTokenCount;

    // Extract images from response
    const images = [];
    const candidates = response.candidates || [];
    
    for (const candidate of candidates) {
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            images.push({
              data: part.inlineData.data, // Base64 encoded image data
              mimeType: part.inlineData.mimeType || 'image/png',
              seed: seed,
            });
          }
        }
      }
    }

    // If no images were generated, return an error
    if (images.length === 0) {
      return NextResponse.json(
        { error: 'No images were generated from the prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      images,
      prompt,
      model: 'gemini-2.5-flash-image-preview',
      tokensUsed,
      responseTime,
      hasWatermark: true, // Gemini images always include SynthID watermark
    });

  } catch (error: any) {
    console.error('Google AI Image Generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { type Character, type Message } from '@/lib/supabase';

type Role = 'system' | 'user' | 'assistant';

export async function POST(request: Request) {
  try {
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new NextResponse('Invalid request body format', { status: 400 });
    }

    const { messages, character } = requestBody as {
      messages: Message[];
      character: Character;
    };

    if (!character) {
      console.error('Character not provided in request');
      return new NextResponse('Character not found in request', { status: 404 });
    }

    if (!Array.isArray(messages)) {
      console.error('Messages not provided or not an array');
      return new NextResponse('Messages must be an array', { status: 400 });
    }

    // Format conversation history
    const formattedMessages = messages.map(msg => ({
      role: msg.role as Role,
      content: msg.content
    }));

    // Add system message with character's personality
    const systemMessage = {
      role: 'system' as Role,
      content: `You are ${character.name}. ${character.personality}

Rules:
- Never mention being an AI
- Stay in character at all times
- Keep responses concise (2-3 sentences)
- Be engaging and conversational
- Use the character's speaking style and mannerisms
- Reference the character's background naturally
- Use <think> tags to show your thought process before responding
- After thinking, provide your final response without tags`
    };

    console.log('Sending request to API:', 'https://api.pawan.krd/cosmosrp/v1/chat/completions');

    // Get completion from the API
    try {
      const response = await fetch('https://api.pawan.krd/cosmosrp/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 1',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'cosmosrp',
          messages: [systemMessage, ...formattedMessages],
          temperature: 0,
          max_tokens: 500,
          stream: true
        })
      });

      if (!response.ok) {
        console.error('API error:', {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(`API request failed with status ${response.status}`);
      }

      // Create a ReadableStream from the response body
      const stream = response.body;

      // Create a TransformStream to process the response chunks
      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split('\n').filter((line: string) => line.trim() !== '');

          for (const line of lines) {
            const message = line.replace(/^data: /, '');
            if (message === '[DONE]') {
              controller.terminate();
              return;
            }
            try {
              const json = JSON.parse(message);
              const content = json.choices[0].delta.content;
              if (content) {
                controller.enqueue(content);
              }
            } catch (error) {
              console.error('Error parsing message:', error);
            }
          }
        }
      });

      // Process the stream and send the response
      return new NextResponse(stream.pipeThrough(transformStream), {
        headers: { 'Content-Type': 'text/event-stream' }
      });
    } catch (apiError: any) {
      console.error('API error:', {
        error: apiError,
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
      });
      return new NextResponse(
        `API error: ${apiError.message}${
          apiError.response?.data ? ` - ${JSON.stringify(apiError.response.data)}` : ''
        }`,
        { status: apiError.response?.status || 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in chat API:', error);
    return new NextResponse(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}

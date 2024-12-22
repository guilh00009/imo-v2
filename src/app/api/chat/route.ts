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
          max_tokens: 500
        }),
        timeout: 0 // Set timeout to 0 to disable it
      });

      if (!response.ok) {
        console.error('API error:', {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(`API request failed with status ${response.status}`);
      }

      const completion = await response.json();

      console.log('Received response from API:', {
        status: 'success',
        hasChoices: !!completion?.choices?.length,
        firstChoice: completion?.choices?.[0]?.message ? 'present' : 'missing'
      });

      if (!completion?.choices?.[0]?.message?.content) {
        console.error('Invalid response format from API:', completion);
        throw new Error('API response missing required content');
      }

      const rawMessage = completion.choices[0].message.content;

      // Process the message to handle thinking tags
      const thinkingMatches = rawMessage.match(/<think\d*>([\s\S]*?)<\/think\d*>/g);
      const thinking = thinkingMatches
        ? thinkingMatches
            .map((match: string) => match.replace(/<think\d*>|<\/think\d*>/g, '').trim())
            .join('\n')
        : '';
      const finalResponse = rawMessage.replace(/<think\d*>[\s\S]*?<\/think\d*>/g, '').trim();

      // Return only the final response without thinking tags
      return NextResponse.json({ message: finalResponse });
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

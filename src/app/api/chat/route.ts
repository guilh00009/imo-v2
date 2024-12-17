import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type Character, type Message } from '@/lib/supabase';
import OpenAI from 'openpipe/openai';

type Role = 'system' | 'user' | 'assistant';

export async function POST(request: Request) {
  try {
    const OPENPIPE_API_KEY = process.env.OPENPIPE_API_KEY;
    
    if (!OPENPIPE_API_KEY) {
      console.error('OpenPipe API key is missing in environment variables');
      return new NextResponse('OpenPipe API key is not configured in environment variables', { status: 500 });
    }

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

    console.log('Initializing OpenPipe client with API key:', OPENPIPE_API_KEY.slice(0, 8) + '...');

    // Initialize OpenPipe client
    const client = new OpenAI({
      apiKey: OPENPIPE_API_KEY,
      baseURL: 'https://api.openpipe.ai/v1'
    });

    console.log('Sending request to OpenPipe with model:', 'openpipe:Samantha-70b');

    // Get completion from OpenPipe
    try {
      const completion = await client.chat.completions.create({
        model: 'openpipe:Samantha-70b',
        messages: [systemMessage, ...formattedMessages],
        temperature: 0,
        max_tokens: 500
      });

      console.log('Received response from OpenPipe:', {
        status: 'success',
        hasChoices: !!completion?.choices?.length,
        firstChoice: completion?.choices?.[0]?.message ? 'present' : 'missing'
      });

      if (!completion?.choices?.[0]?.message?.content) {
        console.error('Invalid response format from OpenPipe:', completion);
        throw new Error('OpenPipe response missing required content');
      }

      const rawMessage = completion.choices[0].message.content;

      // Process the message to handle thinking tags
      const thinkingMatches = rawMessage.match(/<think\d*>([\s\S]*?)<\/think\d*>/g);
      const thinking = thinkingMatches 
        ? thinkingMatches
            .map(match => match.replace(/<think\d*>|<\/think\d*>/g, '').trim())
            .join('\n')
        : '';
      const finalResponse = rawMessage.replace(/<think\d*>[\s\S]*?<\/think\d*>/g, '').trim();

      // Return only the final response without thinking tags
      return NextResponse.json({ message: finalResponse });
    } catch (openPipeError: any) {
      console.error('OpenPipe API error:', {
        error: openPipeError,
        message: openPipeError.message,
        response: openPipeError.response?.data,
        status: openPipeError.response?.status,
      });
      return new NextResponse(
        `OpenPipe API error: ${openPipeError.message}${
          openPipeError.response?.data ? ` - ${JSON.stringify(openPipeError.response.data)}` : ''
        }`,
        { status: openPipeError.response?.status || 500 }
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

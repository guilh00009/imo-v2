'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Settings, Share, ArrowLeft } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Character, type Message as MessageType } from '@/lib/supabase';
import { toast } from 'sonner';

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const characterId = searchParams.get('id');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCharacter = async () => {
    if (!characterId) return;

    try {
      const { data: character, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();

      if (error) throw error;
      setCharacter(character);

      // Add greeting message if no messages exist
      if (character.greeting && messages.length === 0) {
        setMessages([{
          id: 'greeting',
          character_id: character.id,
          user_id: 'system',
          content: character.greeting,
          role: 'assistant',
          created_at: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Error fetching character:', error);
      toast.error('Failed to load character');
    }
  };

  useEffect(() => {
    fetchCharacter();
  }, [characterId]);

  const fetchMessages = async () => {
    if (!characterId) return;
  
    try {
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in to view messages');
        return;
      }
  
      // Fetch messages for this character and user
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('character_id', characterId)
        .eq('user_id', user.id) // Filter messages by authenticated user
        .order('created_at', { ascending: true });
  
      if (error) throw error;
  
      // Add greeting message if no messages exist
      if (messages.length === 0 && character?.greeting) {
        const greetingMessage: MessageType = {
          id: 'greeting',
          character_id: character.id,
          user_id: user.id,
          content: character.greeting,
          role: 'assistant' as const,
          created_at: new Date().toISOString()
        };
        setMessages([greetingMessage]);
      } else {
        setMessages(messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  // Fetch character and messages when component mounts or characterId changes
  useEffect(() => {
    if (characterId) {
      fetchCharacter();
    }
  }, [characterId]);

  useEffect(() => {
    if (character) {
      fetchMessages();
    }
  }, [character]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !character || !characterId) return;
  
    try {
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in to send messages');
        return;
      }
      // Add user message
      const userMessage: MessageType = {
        id: crypto.randomUUID(),
        character_id: characterId,
        user_id: user.id, // Use the authenticated user's ID
        content: newMessage,
        role: 'user',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      setLoading(true);

      // Save user message
      const { error: saveError } = await supabase
        .from('messages')
        .insert([userMessage]);

      if (saveError) throw saveError;

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(userMessage),
          character: character
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      // Add AI response
      const assistantMessage: MessageType = {
        id: crypto.randomUUID(),
        character_id: characterId,
        user_id: user.id, // Use the same user ID for the conversation thread
        content: data.message,
        role: 'assistant',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save AI response
      const { error: saveAssistantError } = await supabase
        .from('messages')
        .insert([assistantMessage]);

      if (saveAssistantError) throw saveAssistantError;

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!character) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="text-white hover:text-gray-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={character.avatar_url || '/omi-avatar.svg'} />
            <AvatarFallback>{character.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-medium">{character.name}</h2>
            <p className="text-sm text-gray-400">{character.category}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="text-white hover:text-gray-300"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Link copied to clipboard');
            }}
            className="text-white hover:text-gray-300"
          >
            <Share className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                {message.role === 'assistant' ? (
                  <>
                    <AvatarImage src={character.avatar_url || '/omi-avatar.svg'} />
                    <AvatarFallback>{character.name[0]}</AvatarFallback>
                  </>
                ) : (
                  <>
                    <AvatarImage src="/user-avatar.svg" />
                    <AvatarFallback>U</AvatarFallback>
                  </>
                )}
              </Avatar>
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-blue-600'
                    : 'bg-zinc-800'
                }`}
              >
                {message.content.startsWith('*Thinking:') ? (
                  <>
                    <p className="text-sm italic text-gray-400 mb-2">
                      {message.content.split('\n\n')[0].replace(/^\*Thinking: |\*$/g, '')}
                    </p>
                    <p className="text-sm">
                      {message.content.split('\n\n')[1]}
                    </p>
                  </>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-800">
        <div className="max-w-3xl mx-auto flex items-end space-x-4">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="bg-zinc-900 border-zinc-700 text-white"
              disabled={loading}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={loading || !newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <div className="h-screen">
      <ChatContent />
    </div>
  );
}

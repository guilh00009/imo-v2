import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Character = {
  id: string;
  name: string;
  avatar_url: string;
  description: string;
  personality: string;
  created_at: string;
  created_by: string;
  is_public: boolean;
  greeting: string;
  category: string;
};

export type Message = {
  id: string;
  character_id: string;
  user_id: string;
  content: string;
  role: 'assistant' | 'user';
  created_at: string;
};

export type ChatSession = {
  id: string;
  character_id: string;
  user_id: string;
  created_at: string;
  last_message: string;
  message_count: number;
}; 
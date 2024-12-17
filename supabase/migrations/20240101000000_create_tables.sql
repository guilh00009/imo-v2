-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.characters;

-- Create characters table
CREATE TABLE public.characters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  avatar_url text,
  description text,
  personality text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid references auth.users(id),
  is_public boolean DEFAULT true,
  greeting text,
  category text
);

-- Create messages table
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  role text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for characters table
CREATE POLICY "Public characters are viewable by everyone"
  ON public.characters FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create characters"
  ON public.characters FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own characters"
  ON public.characters FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own characters"
  ON public.characters FOR DELETE
  USING (auth.uid() = created_by);

-- Create policies for messages table
CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT ALL ON public.characters TO authenticated;
GRANT SELECT ON public.characters TO anon;

GRANT ALL ON public.messages TO authenticated;
GRANT SELECT ON public.messages TO anon; 
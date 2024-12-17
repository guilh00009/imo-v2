# Imo - Open Source AI Character Chat Platform

Imo is an open-source AI chat platform that allows users to create and interact with various AI characters through a beautiful, modern interface. Built with Next.js 13, Supabase, and OpenPipe AI.

## Features

- 🤖 Advanced AI Model Support (OpenPipe Samantha-70b)
- 🎭 Character Creation and Customization
- 🔒 Secure Email/Password Authentication
- 💬 Real-time Chat Interface with Chain-of-Thought Responses
- 🎨 Beautiful Modern UI
- 💾 Chat History Storage

## Prerequisites

Before you begin, ensure you have:
- Node.js 18 or later
- npm or yarn
- Git

## Required API Keys

You'll need to obtain the following API keys and credentials:

1. **Supabase Configuration**
   - Create a project at [Supabase](https://supabase.com)
   - Enable Email/Password Authentication
   - Create the following tables:
     ```sql
     -- Characters table
     create table characters (
       id uuid default uuid_generate_v4() primary key,
       name text not null,
       avatar_url text,
       description text,
       personality text,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null,
       created_by uuid references auth.users(id),
       is_public boolean default true,
       greeting text,
       category text
     );

     -- Messages table
     create table messages (
       id uuid default uuid_generate_v4() primary key,
       character_id uuid references characters(id) on delete cascade,
       user_id uuid references auth.users(id),
       content text not null,
       role text not null,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null
     );

     -- Enable Row Level Security
     alter table characters enable row level security;
     alter table messages enable row level security;

     -- RLS Policies
     create policy "Public characters are viewable by everyone"
       on characters for select
       using (is_public = true);

     create policy "Users can create characters"
       on characters for insert
       with check (auth.uid() = created_by);

     create policy "Users can update their own characters"
       on characters for update
       using (auth.uid() = created_by);

     create policy "Users can delete their own characters"
       on characters for delete
       using (auth.uid() = created_by);

     create policy "Users can view their own messages"
       on messages for select
       using (auth.uid() = user_id);

     create policy "Users can insert their own messages"
       on messages for insert
       with check (auth.uid() = user_id);
     ```
   - Get your Supabase URL and anon key

2. **OpenPipe API**
   - Sign up at [OpenPipe](https://openpipe.ai/)
   - Get your API key

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/BasedHardware/imo.git
   cd imo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

   # OpenPipe API Key
   OPENPIPE_API_KEY=your_openpipe_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Support

To run using Docker:

1. Build the image:
   ```bash
   docker build -t imo \
     --build-arg NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key \
     --build-arg OPENPIPE_API_KEY=your_openpipe_api_key .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 imo
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

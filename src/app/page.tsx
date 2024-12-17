'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, type Character } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, BadgeCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useInView } from 'react-intersection-observer';

const CHARACTERS_PER_PAGE = 20;

export default function HomePage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();

  const fetchCharacters = async (isInitial = true) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        router.push('/login');
        return;
      }

      let query = supabase
        .from('characters')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(page * CHARACTERS_PER_PAGE, (page + 1) * CHARACTERS_PER_PAGE - 1);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw new Error(fetchError.message);
      }

      if (isInitial) {
        setCharacters(data || []);
      } else {
        setCharacters(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data || []).length === CHARACTERS_PER_PAGE);
    } catch (error: any) {
      console.error('Error fetching characters:', error.message);
      setError('Failed to load characters. Please try again.');
      toast.error('Failed to load characters. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters(true);
  }, [searchQuery]);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      setPage(prev => prev + 1);
      fetchCharacters(false);
    }
  }, [inView, hasMore]);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-2xl font-serif text-white">
              imo
            </Link>
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search characters..."
                  className="w-full pl-10 bg-zinc-900 border-zinc-700 text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={() => router.push('/create')}
              className="bg-white text-black hover:bg-gray-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((character) => (
            <Link key={character.id} href={`/chat?id=${character.id}`}>
              <Card className="bg-zinc-900 border-zinc-700 hover:border-zinc-500 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={character.avatar_url} />
                      <AvatarFallback>{character.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-white truncate">
                          {character.name}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {character.description}
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-gray-300">
                          {character.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading...</div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-red-400">{error}</div>
          </div>
        )}

        {!loading && !error && characters.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400">No characters found</div>
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={ref} className="h-10" />
      </main>
    </div>
  );
}


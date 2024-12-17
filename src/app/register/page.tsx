'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast.success('Registration successful! Please check your email to verify your account.');
      router.push('/login');
    } catch (error: any) {
      console.error('Error registering:', error);
      toast.error(error.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:text-gray-300">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo/Text */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-serif mb-8 text-white">imo</h1>
          <p className="text-gray-400">Create your account</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="w-full max-w-sm space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="bg-zinc-900 border-zinc-700 text-white"
          />
          <Input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="bg-zinc-900 border-zinc-700 text-white"
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            className="bg-zinc-900 border-zinc-700 text-white"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-gray-200"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>

        {/* Footer */}
        <div className="fixed bottom-4 w-full max-w-4xl mx-auto px-4">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Imo Chat © 2024</span>
            <div className="flex gap-4">
              <Button variant="link" className="p-0 h-auto text-xs text-gray-500 hover:text-white">Terms & Conditions</Button>
              <Button variant="link" className="p-0 h-auto text-xs text-gray-500 hover:text-white">Privacy Policy</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
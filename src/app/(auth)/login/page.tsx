'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        toast.success('Successfully signed in!');
        router.push('/');
        router.refresh();
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      if (error.message === 'Invalid login credentials') {
        toast.error('Invalid email or password');
      } else if (error.message === 'Email not confirmed') {
        toast.error('Please verify your email address');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) throw error;

      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Failed to send reset email. Please try again.');
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
          <p className="text-gray-400">Create and chat with AI characters</p>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSignIn} className="w-full max-w-sm space-y-4">
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
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-gray-200"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
          <div className="flex flex-col items-center gap-2 text-sm">
            <Link
              href="/register"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Don't have an account? Sign up
            </Link>
            <Button
              type="button"
              variant="link"
              onClick={handleForgotPassword}
              className="text-gray-400 hover:text-white"
            >
              Forgot password?
            </Button>
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
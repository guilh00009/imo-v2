'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Image from 'next/image';

export default function CreateCharacterPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    personality: '',
    greeting: '',
    category: 'general',
  });

  const handleImageUpload = async (file: File) => {
    try {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        if (uploadError.message.includes('storage/bucket-not-found')) {
          toast.error('Storage not configured. Please try again in a few moments.');
        } else {
          toast.error('Failed to upload image. Please try again.');
        }
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setUploadedImage(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Character name is required');
      }

      if (!formData.description.trim()) {
        throw new Error('Character description is required');
      }

      if (!formData.personality.trim()) {
        throw new Error('Character personality is required');
      }

      if (!formData.greeting.trim()) {
        throw new Error('Greeting message is required');
      }

      // Create character
      const { data: character, error: insertError } = await supabase
        .from('characters')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          personality: formData.personality.trim(),
          greeting: formData.greeting.trim(),
          category: formData.category,
          created_by: 'anonymous',
          is_public: true,
          avatar_url: uploadedImage || '/omi-avatar.svg',
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Error creating character:', insertError);
        if (insertError.message?.includes('relation "public.characters" does not exist')) {
          toast.error('Database setup in progress. Please try again in a few moments.');
        } else {
          toast.error(insertError.message || 'Failed to create character');
        }
        return;
      }

      if (!character) {
        toast.error('Failed to create character. Please try again.');
        return;
      }

      toast.success('Character created successfully!');
      router.push(`/chat?id=${character.id}`);
    } catch (error: any) {
      console.error('Error creating character:', error);
      toast.error(error?.message || 'Failed to create character. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-white hover:text-gray-300"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-serif mb-4">Create Character</h1>
            <p className="text-gray-400">Design your AI character's personality</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Image Upload */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32">
                  {uploadedImage ? (
                    <>
                      <Image
                        src={uploadedImage}
                        alt="Character avatar"
                        fill
                        className="rounded-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full border-2 border-dashed border-zinc-700 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-zinc-500" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm"
                >
                  {uploadedImage ? 'Change Image' : 'Upload Image'}
                </Button>
              </div>

              <Input
                placeholder="Character Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-zinc-900 border-zinc-700"
              />

              <textarea
                placeholder="Description (appearance, background, etc.)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-md text-white"
                rows={3}
              />

              <textarea
                placeholder="Personality (traits, behavior, speaking style)"
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                required
                className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-md text-white"
                rows={3}
              />

              <Input
                placeholder="Greeting Message"
                value={formData.greeting}
                onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                required
                className="bg-zinc-900 border-zinc-700"
              />

              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-md text-white"
              >
                <option value="general">General</option>
                <option value="historical">Historical Figure</option>
                <option value="fictional">Fictional Character</option>
                <option value="assistant">AI Assistant</option>
                <option value="roleplay">Roleplay</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={isCreating}
              className="w-full bg-white text-black hover:bg-gray-200"
            >
              {isCreating ? 'Creating...' : 'Create Character'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 
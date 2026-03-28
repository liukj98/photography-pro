import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import type { Photo, PhotoCategory } from '../types';

interface UsePhotosOptions {
  userId?: string;
  category?: PhotoCategory | 'all';
  limit?: number;
  offset?: number;
}

interface UsePhotosReturn {
  photos: Photo[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  refetch: () => void;
  loadMore: () => void;
}

// Mock photos for demo mode
const mockPhotos: Photo[] = [
  {
    id: 'mock-1',
    user_id: 'demo-user',
    title: '山间晨雾',
    description: '清晨的山谷，薄雾缭绕',
    image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    category: 'landscape',
    tags: ['山', '雾', '自然'],
    views_count: 1234,
    likes_count: 89,
    is_public: true,
    created_at: '2026-03-20T10:00:00Z',
    updated_at: '2026-03-20T10:00:00Z',
  },
  {
    id: 'mock-2',
    user_id: 'demo-user',
    title: '城市夜景',
    description: '繁华都市的夜晚',
    image_url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=600&fit=crop',
    thumbnail_url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop',
    category: 'architecture',
    tags: ['城市', '夜景', '建筑'],
    views_count: 987,
    likes_count: 76,
    is_public: true,
    created_at: '2026-03-19T10:00:00Z',
    updated_at: '2026-03-19T10:00:00Z',
  },
  {
    id: 'mock-3',
    user_id: 'demo-user',
    title: '海边日落',
    description: '金色余晖洒在海面',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
    thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
    category: 'landscape',
    tags: ['海', '日落', '自然'],
    views_count: 2345,
    likes_count: 156,
    is_public: true,
    created_at: '2026-03-18T10:00:00Z',
    updated_at: '2026-03-18T10:00:00Z',
  },
];

export function usePhotos(options: UsePhotosOptions = {}): UsePhotosReturn {
  const { userId, category = 'all', limit = 12 } = options;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchPhotos = useCallback(async (currentOffset: number, append: boolean = false) => {
    setIsLoading(true);
    setError(null);

    // Demo mode
    if (!isSupabaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      let filtered = [...mockPhotos];
      if (category !== 'all') {
        filtered = filtered.filter((p) => p.category === category);
      }
      
      setPhotos(append ? [...photos, ...filtered] : filtered);
      setHasMore(false);
      setIsLoading(false);
      return;
    }

    try {
      // Simplified query without user join to avoid RLS issues
      let query = supabase
        .from('photos')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Fetch photos error:', fetchError);
        throw fetchError;
      }

      const newPhotos = data || [];
      setPhotos(append ? [...photos, ...newPhotos] : newPhotos);
      setHasMore(newPhotos.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取作品失败');
    } finally {
      setIsLoading(false);
    }
  }, [userId, category, limit]);

  useEffect(() => {
    setOffset(0);
    fetchPhotos(0, false);
  }, [userId, category]);

  const loadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchPhotos(newOffset, true);
  };

  const refetch = () => {
    setOffset(0);
    fetchPhotos(0, false);
  };

  return { photos, isLoading, error, hasMore, refetch, loadMore };
}

export function usePhoto(photoId: string | undefined) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!photoId) {
      setIsLoading(false);
      return;
    }

    const fetchPhoto = async () => {
      setIsLoading(true);

      // Demo mode
      if (!isSupabaseConfigured) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const found = mockPhotos.find((p) => p.id === photoId);
        setPhoto(found || null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('photos')
          .select(`
            *,
            user:users(id, username, avatar_url)
          `)
          .eq('id', photoId)
          .single();

        if (fetchError) throw fetchError;
        setPhoto(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取作品失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhoto();
  }, [photoId]);

  return { photo, isLoading, error };
}

export function useUserPhotos(userId?: string) {
  const { user: currentUser } = useAuthStore();
  const targetUserId = userId || currentUser?.id;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPhotos = useCallback(async () => {
    if (!targetUserId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Demo mode
    if (!isSupabaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setPhotos(mockPhotos);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPhotos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取作品失败');
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchUserPhotos();
  }, [fetchUserPhotos]);

  const deletePhoto = async (photoId: string) => {
    const { addToast } = useToastStore.getState();
    
    if (!isSupabaseConfigured) {
      setPhotos(photos.filter((p) => p.id !== photoId));
      addToast('作品已删除', 'success');
      return { error: null };
    }

    try {
      const { error } = await supabase.from('photos').delete().eq('id', photoId);
      if (error) throw error;
      
      setPhotos(photos.filter((p) => p.id !== photoId));
      addToast('作品已删除', 'success');
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除失败';
      addToast(errorMessage, 'error');
      return { error: errorMessage };
    }
  };

  return { photos, isLoading, error, refetch: fetchUserPhotos, deletePhoto };
}

export function useCreatePhoto() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(false);

  const createPhoto = async (photoData: {
    title: string;
    description?: string;
    image_url: string;
    thumbnail_url: string;
    category: PhotoCategory;
    tags: string[];
    is_public: boolean;
  }) => {
    if (!user) {
      addToast('请先登录', 'error');
      return { error: '未登录' };
    }

    setIsLoading(true);

    // Demo mode
    if (!isSupabaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Demo mode: Created photo', photoData);
      addToast('作品发布成功！', 'success');
      setIsLoading(false);
      return { error: null, data: { id: 'mock-new-photo' } };
    }

    try {
      // Debug: Check session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Current session:', sessionData.session?.user.id);
      console.log('User ID from store:', user.id);
      
      const insertData = {
        ...photoData,
        user_id: user.id,
      };
      console.log('Inserting data:', insertData);
      
      const { data, error } = await supabase
        .from('photos')
        .insert(insertData as any)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      addToast('作品发布成功！', 'success');
      return { error: null, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发布失败';
      addToast(errorMessage, 'error');
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { createPhoto, isLoading };
}

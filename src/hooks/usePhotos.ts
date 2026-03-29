import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isDemoMode, mockPhotos, simulateNetworkDelay } from '../lib/demo-mode';
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

    if (isDemoMode()) {
      await simulateNetworkDelay(500);
      
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
      
      // 获取每个照片的点赞数和用户信息
      const photosWithDetails = await Promise.all(
        newPhotos.map(async (photo: any) => {
          // 获取点赞数
          let likesCount = 0;
          try {
            const { count } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('photo_id', photo.id);
            likesCount = count || 0;
          } catch {
            // ignore
          }
          
          // 获取用户信息
          let userData = null;
          if (photo.user_id) {
            try {
              const { data: user } = await supabase
                .from('users')
                .select('id, username, avatar_url')
                .eq('id', photo.user_id)
                .maybeSingle();
              userData = user;
            } catch {
              // ignore
            }
          }
          
          // 确保 views_count 存在，如果没有则使用 photo 中的值或默认 0
          const viewsCount = photo.views_count ?? 0;
          
          return {
            ...photo,
            likes_count: likesCount,
            views_count: viewsCount,
            user: userData || undefined,
          };
        })
      );

      setPhotos(prev => append ? [...prev, ...photosWithDetails] : photosWithDetails);
      setHasMore(newPhotos.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取作品失败');
    } finally {
      setIsLoading(false);
    }
    // photos 在 fetchPhotos 内部使用，但添加为依赖会导致无限循环
    // fetchPhotos 通过 useCallback 记忆化，依赖变化时才重新创建
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (isDemoMode()) {
        await simulateNetworkDelay(300);
        const found = mockPhotos.find((p) => p.id === photoId);
        setPhoto(found || null);
        setIsLoading(false);
        return;
      }

      try {
        // 先获取照片基本信息
        const { data: photoData, error: photoError } = await supabase
          .from('photos')
          .select('*')
          .eq('id', photoId)
          .single();

        if (photoError) throw photoError;

        // 再单独获取用户信息，避免 RLS 权限问题
        let userData: { id: string; username: string; avatar_url?: string } | null = null;
        const photo = photoData as Photo;
        if (photo?.user_id) {
          const { data: user } = await supabase
            .from('users')
            .select('id, username, avatar_url')
            .eq('id', photo.user_id)
            .single();
          userData = user;
        }

        setPhoto({ ...photo, user: userData || undefined });
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

export function useUserPhotos(username?: string) {
  const { user: currentUser } = useAuthStore();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPhotos = useCallback(async () => {
    // 如果没有传入用户名且未登录，跳过
    if (!username && !currentUser?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (isDemoMode()) {
      await simulateNetworkDelay(300);
      setPhotos(mockPhotos);
      setIsLoading(false);
      return;
    }

    try {
      let query;

      if (username) {
        // 通过用户名查询：先查用户 ID，再查作品
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .single();

        if (userError || !userData) {
          setPhotos([]);
          setIsLoading(false);
          return;
        }

        query = supabase
          .from('photos')
          .select('*')
          .eq('user_id', (userData as { id: string }).id)
          .order('created_at', { ascending: false });
      } else {
        // 使用当前登录用户 ID 查询
        query = supabase
          .from('photos')
          .select('*')
          .eq('user_id', currentUser!.id)
          .order('created_at', { ascending: false });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      // 获取每个照片的点赞数
      const photosWithLikes = await Promise.all(
        (data || []).map(async (photo: any) => {
          let likesCount = 0;
          try {
            const { count } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('photo_id', photo.id);
            likesCount = count || 0;
          } catch {
            // ignore
          }
          
          return {
            ...photo,
            likes_count: likesCount,
            views_count: photo.views_count ?? 0,
          };
        })
      );
      
      setPhotos(photosWithLikes);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取作品失败');
    } finally {
      setIsLoading(false);
    }
  }, [username, currentUser?.id]);

  useEffect(() => {
    fetchUserPhotos();
  }, [fetchUserPhotos]);

  const deletePhoto = async (photoId: string) => {
    const { addToast } = useToastStore.getState();
    
    if (isDemoMode()) {
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

  const updatePhoto = async (photoId: string, updateData: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    is_public: boolean;
    exif_data?: Record<string, string | number>;
  }) => {
    const { addToast } = useToastStore.getState();
    
    if (isDemoMode()) {
      setPhotos(photos.map((p) => 
        p.id === photoId ? { ...p, ...updateData } as Photo : p
      ));
      addToast('作品已更新', 'success');
      return { error: null };
    }

    try {
      // Supabase 类型定义不完整，需要类型断言
      const { error } = await (supabase.from('photos') as unknown as { update: (data: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: Error | null }> } })
        .update(updateData)
        .eq('id', photoId);
      
      if (error) throw error;
      
      setPhotos(photos.map((p) => 
        p.id === photoId ? { ...p, ...updateData } as Photo : p
      ));
      addToast('作品已更新', 'success');
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新失败';
      addToast(errorMessage, 'error');
      return { error: errorMessage };
    }
  };

  return { photos, isLoading, error, refetch: fetchUserPhotos, deletePhoto, updatePhoto };
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
    exif_data?: Record<string, string | number>;
  }) => {
    if (!user) {
      addToast('请先登录', 'error');
      return { error: '未登录' };
    }

    setIsLoading(true);

    if (isDemoMode()) {
      await simulateNetworkDelay(1000);
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
        .insert(insertData as Record<string, unknown>)
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

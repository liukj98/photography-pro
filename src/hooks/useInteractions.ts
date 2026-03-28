import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { useInteractionStore } from '../stores/interactionStore';

// ==================== Like Hook ====================

export function useLike(photoId: string) {
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();
  const interactionStore = useInteractionStore();
  
  // 从全局 store 获取状态
  const storeState = interactionStore.getLikeState(photoId);
  const [isLiked, setIsLiked] = useState(storeState.isLiked);
  const [likesCount, setLikesCount] = useState(storeState.count);
  const [isLoading, setIsLoading] = useState(false);
  
  // 订阅 store 变化（跨组件同步）
  useEffect(() => {
    const unsubscribe = useInteractionStore.subscribe(
      (state) => ({
        isLiked: state.likes.get(photoId),
        count: state.likesCount.get(photoId),
      }),
      (curr) => {
        if (curr.isLiked !== undefined) setIsLiked(curr.isLiked);
        if (curr.count !== undefined) setLikesCount(curr.count);
      }
    );
    return unsubscribe;
  }, [photoId]);

  // Check initial like status - 优先从持久化 store 恢复，再同步服务器
  useEffect(() => {
    if (!isAuthenticated || !user || !photoId) return;

    const checkLikeStatus = async () => {
      // 优先从持久化 store 获取状态
      const storeState = interactionStore.getLikeState(photoId);
      if (storeState.isLiked) {
        setIsLiked(true);
        setLikesCount(storeState.count);
      }

      if (!isSupabaseConfigured) return;

      try {
        // 后台同步服务器状态
        const { data } = await supabase
          .from('likes')
          .select('id')
          .eq('photo_id', photoId)
          .eq('user_id', user.id)
          .single();

        const serverIsLiked = !!data;
        // 只有服务器状态与本地不同时才更新
        if (serverIsLiked !== storeState.isLiked) {
          setIsLiked(serverIsLiked);
          interactionStore.setLike(photoId, serverIsLiked, likesCount);
        }
      } catch {
        // 服务器无记录，确保本地状态为 false
        if (storeState.isLiked) {
          setIsLiked(false);
          interactionStore.setLike(photoId, false, likesCount);
        }
      }
    };

    checkLikeStatus();
  }, [photoId, user, isAuthenticated, interactionStore, likesCount]);

  // Get likes count
  useEffect(() => {
    if (!photoId) return;

    const fetchLikesCount = async () => {
      if (!isSupabaseConfigured) {
        setLikesCount(Math.floor(Math.random() * 100));
        return;
      }

      try {
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('photo_id', photoId);

        setLikesCount(count || 0);
      } catch {
        setLikesCount(0);
      }
    };

    fetchLikesCount();
  }, [photoId]);

  const toggleLike = async () => {
    if (!isAuthenticated) {
      addToast('请先登录', 'error');
      return { error: '未登录' };
    }

    if (!user) return { error: '未登录' };

    setIsLoading(true);

    // Demo mode - 使用 store 同步更新
    if (!isSupabaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const result = interactionStore.toggleLike(photoId, likesCount);
      setIsLiked(result.isLiked);
      setLikesCount(result.newCount);
      setIsLoading(false);
      return { error: null };
    }

    try {
      // 乐观更新：先更新本地状态
      const result = interactionStore.toggleLike(photoId, likesCount);
      setIsLiked(result.isLiked);
      setLikesCount(result.newCount);

      if (result.isLiked) {
        // Like
        await supabase.from('likes').insert({
          photo_id: photoId,
          user_id: user.id,
        } as any);
      } else {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('photo_id', photoId)
          .eq('user_id', user.id);
      }

      return { error: null };
    } catch (err) {
      // 失败时回滚
      const rollbackResult = interactionStore.toggleLike(photoId, likesCount);
      setIsLiked(rollbackResult.isLiked);
      setLikesCount(rollbackResult.newCount);
      
      const errorMessage = err instanceof Error ? err.message : '操作失败';
      addToast(errorMessage, 'error');
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { isLiked, likesCount, isLoading, toggleLike };
}

// ==================== Favorite Hook ====================

export function useFavorite(photoId: string) {
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();
  const interactionStore = useInteractionStore();
  
  // 从全局 store 获取状态
  const [isFavorited, setIsFavorited] = useState(interactionStore.getFavoriteState(photoId));
  const [isLoading, setIsLoading] = useState(false);
  
  // 订阅 store 变化（跨组件同步）
  useEffect(() => {
    const unsubscribe = useInteractionStore.subscribe(
      (state) => state.favorites.get(photoId),
      (curr) => {
        if (curr !== undefined) setIsFavorited(curr);
      }
    );
    return unsubscribe;
  }, [photoId]);

  // 优先从持久化 store 恢复，再同步服务器
  useEffect(() => {
    if (!isAuthenticated || !user || !photoId) return;

    const checkFavoriteStatus = async () => {
      // 优先从持久化 store 获取状态
      const storeIsFavorited = interactionStore.getFavoriteState(photoId);
      if (storeIsFavorited) {
        setIsFavorited(true);
      }

      if (!isSupabaseConfigured) return;

      try {
        // 后台同步服务器状态
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('photo_id', photoId)
          .eq('user_id', user.id)
          .single();

        const serverIsFavorited = !!data;
        // 只有服务器状态与本地不同时才更新
        if (serverIsFavorited !== storeIsFavorited) {
          setIsFavorited(serverIsFavorited);
          interactionStore.setFavorite(photoId, serverIsFavorited);
        }
      } catch {
        // 服务器无记录，确保本地状态为 false
        if (storeIsFavorited) {
          setIsFavorited(false);
          interactionStore.setFavorite(photoId, false);
        }
      }
    };

    checkFavoriteStatus();
  }, [photoId, user, isAuthenticated, interactionStore]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      addToast('请先登录', 'error');
      return { error: '未登录' };
    }

    if (!user) return { error: '未登录' };

    setIsLoading(true);

    // Demo mode - 使用 store 同步更新
    if (!isSupabaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const newIsFavorited = interactionStore.toggleFavorite(photoId);
      setIsFavorited(newIsFavorited);
      setIsLoading(false);
      addToast(newIsFavorited ? '已添加到收藏' : '已取消收藏', 'success');
      return { error: null };
    }

    try {
      // 乐观更新
      const newIsFavorited = interactionStore.toggleFavorite(photoId);
      setIsFavorited(newIsFavorited);
      
      addToast(newIsFavorited ? '已添加到收藏' : '已取消收藏', 'success');

      if (newIsFavorited) {
        await supabase.from('favorites').insert({
          photo_id: photoId,
          user_id: user.id,
        } as any);
      } else {
        await supabase
          .from('favorites')
          .delete()
          .eq('photo_id', photoId)
          .eq('user_id', user.id);
      }

      return { error: null };
    } catch (err) {
      // 失败时回滚
      const rollbackResult = interactionStore.toggleFavorite(photoId);
      setIsFavorited(rollbackResult);
      
      const errorMessage = err instanceof Error ? err.message : '操作失败';
      addToast(errorMessage, 'error');
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { isFavorited, isLoading, toggleFavorite };
}

// ==================== User Favorites Hook ====================

export function useUserFavorites() {
  const { user, isAuthenticated } = useAuthStore();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (!isSupabaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          photo:photos(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (err) {
      console.error('Fetch favorites error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return { favorites, isLoading, refetch: fetchFavorites };
}

// ==================== Views Hook ====================

export function useViews(photoId: string) {
  const interactionStore = useInteractionStore();
  const [viewsCount, setViewsCount] = useState(0);
  
  // 订阅 store 变化
  useEffect(() => {
    const unsubscribe = useInteractionStore.subscribe(
      (state) => state.viewsCount.get(photoId),
      (curr) => {
        if (curr !== undefined) setViewsCount(curr);
      }
    );
    return unsubscribe;
  }, [photoId]);
  
  // 初始加载浏览量
  useEffect(() => {
    if (!photoId) return;
    
    const fetchViews = async () => {
      // 先从 store 获取（持久化数据）
      const storeCount = interactionStore.getViewsCount(photoId);
      
      if (!isSupabaseConfigured) {
        // 演示模式：如果没有 store 数据，设置一个随机数
        if (storeCount === 0) {
          const randomCount = Math.floor(Math.random() * 1000);
          // 模拟初始化
          for (let i = 0; i < randomCount; i++) {
            interactionStore.incrementView(photoId);
          }
        }
        setViewsCount(interactionStore.getViewsCount(photoId));
        return;
      }
      
      try {
        const { data: photo } = await (supabase
          .from('photos')
          .select('views_count')
          .eq('id', photoId)
          .single() as any);
          
        const serverCount = photo?.views_count || 0;
        
        // 使用 server 和 store 中的较大值
        const finalCount = Math.max(serverCount, storeCount);
        setViewsCount(finalCount);
        
        // 如果 store 没有数据，同步 server 数据到 store
        if (storeCount === 0 && serverCount > 0) {
          for (let i = 0; i < serverCount; i++) {
            interactionStore.incrementView(photoId);
          }
        }
      } catch (err) {
        console.error('Fetch views error:', err);
        setViewsCount(storeCount);
      }
    };
    
    fetchViews();
  }, [photoId, interactionStore]);
  
  // 增加浏览量（使用 store 检查是否已浏览）
  const incrementView = useCallback(async () => {
    if (!photoId) return;
    
    // 检查是否已经浏览过（从持久化 store）
    if (interactionStore.hasViewed(photoId)) {
      return; // 已经浏览过，不重复增加
    }
    
    // 增加浏览量
    interactionStore.incrementView(photoId);
    setViewsCount(prev => prev + 1);
    
    if (!isSupabaseConfigured) return;
    
    try {
      // 记录浏览统计
      await supabase.from('view_stats').insert({
        photo_id: photoId,
        view_type: 'photo',
      } as any);
      
      // 增加照片浏览计数
      await (supabase as any)
        .rpc('increment_photo_views', { photo_id: photoId });
    } catch (err) {
      console.error('Increment view error:', err);
    }
  }, [photoId, interactionStore]);
  
  return { viewsCount, incrementView };
}

// ==================== Comments Hook ====================

export interface Comment {
  id: string;
  photo_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

export function useComments(photoId: string) {
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!photoId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (!isSupabaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setComments([
        {
          id: 'mock-1',
          photo_id: photoId,
          user_id: 'user-1',
          content: '这张照片太棒了！',
          created_at: new Date().toISOString(),
          user: { username: 'photographer1' },
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(username, avatar_url)
        `)
        .eq('photo_id', photoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments((data as Comment[]) || []);
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [photoId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string) => {
    if (!isAuthenticated) {
      addToast('请先登录', 'error');
      return { error: '未登录' };
    }

    if (!user) return { error: '未登录' };
    if (!content.trim()) return { error: '评论内容不能为空' };

    setIsSubmitting(true);

    // Demo mode
    if (!isSupabaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newComment: Comment = {
        id: 'mock-new',
        photo_id: photoId,
        user_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
        user: { username: user.username },
      };
      setComments((prev) => [newComment, ...prev]);
      setIsSubmitting(false);
      addToast('评论发布成功', 'success');
      return { error: null };
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          photo_id: photoId,
          user_id: user.id,
          content: content.trim(),
        } as any)
        .select(`
          *,
          user:users(username, avatar_url)
        `)
        .single();

      if (error) throw error;

      setComments((prev) => [data as Comment, ...prev]);
      addToast('评论发布成功', 'success');
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发布失败';
      addToast(errorMessage, 'error');
      return { error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!isAuthenticated || !user) return { error: '未登录' };

    // Demo mode
    if (!isSupabaseConfigured) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      addToast('评论已删除', 'success');
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      addToast('评论已删除', 'success');
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除失败';
      addToast(errorMessage, 'error');
      return { error: errorMessage };
    }
  };

  return {
    comments,
    isLoading,
    isSubmitting,
    addComment,
    deleteComment,
    refetch: fetchComments,
  };
}

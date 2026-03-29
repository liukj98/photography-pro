import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isDemoMode, simulateNetworkDelay, generateRandomLikes, generateRandomViews } from '../lib/demo-mode';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { useInteractionStore } from '../stores/interactionStore';
import type { Tables } from '../lib/supabase';

// ==================== Like Hook ====================

export function useLike(photoId: string) {
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();
  const interactionStore = useInteractionStore();
  
  // 本地状态 - 不从 store 初始化，完全从服务器获取
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 初始化：从服务器获取数据
  useEffect(() => {
    if (!photoId) return;

    let isMounted = true;

    const fetchData = async () => {
      // 1. 获取点赞总数
      try {
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('id, user_id')
          .eq('photo_id', photoId);

        if (!isMounted) return;

        if (!likesError && likesData) {
          const count = likesData.length;
          setLikesCount(count);
          
          // 2. 检查当前用户是否已点赞
          if (user?.id) {
            const hasLiked = likesData.some((like: any) => like.user_id === user.id);
            setIsLiked(hasLiked);
          }
        }
        
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to fetch likes:', err);
        setIsInitialized(true);
      }
    };

    if (isDemoMode()) {
      setLikesCount(generateRandomLikes());
      setIsInitialized(true);
    } else {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [photoId, user?.id]); // 只依赖 photoId 和 userId

  const toggleLike = async () => {
    if (!isAuthenticated) {
      addToast('请先登录', 'error');
      return { error: '未登录' };
    }

    if (!user) return { error: '未登录' };

    if (isLoading) {
      return { error: null };
    }

    setIsLoading(true);

    if (isDemoMode()) {
      await simulateNetworkDelay(300);
      const newIsLiked = !isLiked;
      const newCount = newIsLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
      setIsLiked(newIsLiked);
      setLikesCount(newCount);
      setIsLoading(false);
      return { error: null };
    }

    // 保存当前状态用于回滚
    const previousIsLiked = isLiked;
    const previousCount = likesCount;
    
    try {
      // 乐观更新
      const newIsLiked = !isLiked;
      const newCount = newIsLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
      setIsLiked(newIsLiked);
      setLikesCount(newCount);
      
      // 更新 store（用于跨组件同步）
      interactionStore.setLike(photoId, newIsLiked, newCount);

      if (newIsLiked) {
        // 点赞
        const { error } = await supabase.from('likes').insert({
          photo_id: photoId,
          user_id: user.id,
        } as any);
        
        if (error) throw error;
      } else {
        // 取消点赞
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('photo_id', photoId)
          .eq('user_id', user.id);
          
        if (error) throw error;
      }

      return { error: null };
    } catch (err) {
      // 回滚
      setIsLiked(previousIsLiked);
      setLikesCount(previousCount);
      interactionStore.setLike(photoId, previousIsLiked, previousCount);
      
      const errorMessage = err instanceof Error ? err.message : '操作失败';
      addToast(errorMessage, 'error');
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { isLiked, likesCount, isLoading, isInitialized, toggleLike };
}

// ==================== Favorite Hook ====================

export function useFavorite(photoId: string) {
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();
  const interactionStore = useInteractionStore();
  
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 从服务器获取收藏状态
  useEffect(() => {
    if (!photoId || !user?.id || !isAuthenticated) {
      setIsInitialized(true);
      return;
    }

    let isMounted = true;

    const fetchFavoriteStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('photo_id', photoId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (!error) {
          setIsFavorited(!!data);
        }
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to fetch favorite status:', err);
        setIsInitialized(true);
      }
    };

    if (isDemoMode()) {
      setIsInitialized(true);
    } else {
      fetchFavoriteStatus();
    }

    return () => {
      isMounted = false;
    };
  }, [photoId, user?.id, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      addToast('请先登录', 'error');
      return { error: '未登录' };
    }

    if (!user) return { error: '未登录' };

    if (isLoading) {
      return { error: null };
    }

    setIsLoading(true);

    if (isDemoMode()) {
      await simulateNetworkDelay(300);
      const newIsFavorited = !isFavorited;
      setIsFavorited(newIsFavorited);
      setIsLoading(false);
      addToast(newIsFavorited ? '已添加到收藏' : '已取消收藏', 'success');
      return { error: null };
    }

    const previousIsFavorited = isFavorited;
    
    try {
      // 乐观更新
      const newIsFavorited = !isFavorited;
      setIsFavorited(newIsFavorited);
      interactionStore.setFavorite(photoId, newIsFavorited);
      
      addToast(newIsFavorited ? '已添加到收藏' : '已取消收藏', 'success');

      if (newIsFavorited) {
        const { error } = await supabase.from('favorites').insert({
          photo_id: photoId,
          user_id: user.id,
        } as any);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('photo_id', photoId)
          .eq('user_id', user.id);
          
        if (error) throw error;
      }

      return { error: null };
    } catch (err) {
      // 回滚
      setIsFavorited(previousIsFavorited);
      interactionStore.setFavorite(photoId, previousIsFavorited);
      
      const errorMessage = err instanceof Error ? err.message : '操作失败';
      addToast(errorMessage, 'error');
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { isFavorited, isLoading, isInitialized, toggleFavorite };
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

    if (isDemoMode()) {
      await simulateNetworkDelay(500);
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          photo:photos(
            id,
            title,
            thumbnail_url,
            user_id,
            created_at,
            user:users(id, username, avatar_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // 为每个收藏的照片获取点赞数
      const favoritesWithLikes = await Promise.all(
        (data || []).map(async (fav: any) => {
          try {
            const { count } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('photo_id', fav.photo?.id);
            
            return {
              ...fav,
              photo: {
                ...fav.photo,
                likes_count: count || 0,
              },
            };
          } catch {
            return {
              ...fav,
              photo: {
                ...fav.photo,
                likes_count: 0,
              },
            };
          }
        })
      );
      
      setFavorites(favoritesWithLikes);
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
  const { user } = useAuthStore();
  const interactionStore = useInteractionStore();
  const [viewsCount, setViewsCount] = useState(0);
  
  // 初始加载浏览量
  useEffect(() => {
    if (!photoId) return;
    
    let isMounted = true;
    
    const fetchViews = async () => {
      if (isDemoMode()) {
        setViewsCount(generateRandomViews());
        return;
      }
      
      try {
        const { data: photo, error } = await supabase
          .from('photos')
          .select('views_count')
          .eq('id', photoId)
          .maybeSingle();
        
        if (!isMounted) return;
        
        if (error) {
          console.warn('Fetch views warning:', error.message);
          setViewsCount(Math.floor(Math.random() * 500) + 100);
          return;
        }
          
        const serverCount = (photo as Tables<'photos'> | null)?.views_count || 0;
        setViewsCount(serverCount);
      } catch (err) {
        console.error('Fetch views error:', err);
        setViewsCount(generateRandomViews(100, 500));
      }
    };
    
    fetchViews();
    
    return () => {
      isMounted = false;
    };
  }, [photoId]);
  
  // 增加浏览量
  const incrementView = useCallback(async () => {
    if (!photoId) return;
    
    // 检查是否已经浏览过
    if (interactionStore.hasViewed(photoId)) {
      return;
    }
    
    // 增加浏览量
    interactionStore.incrementView(photoId);
    setViewsCount(prev => prev + 1);
    
    if (isDemoMode()) return;
    
    if (user?.id) {
      try {
        await supabase.from('view_stats').insert({
          photo_id: photoId,
          user_id: user.id,
          view_type: 'photo',
        } as any);
      } catch {
        // 忽略错误
      }
    }
    
    try {
      // Supabase RPC 类型定义不完整，需要类型断言
      await (supabase.rpc as unknown as (fn: string, params: Record<string, unknown>) => Promise<unknown>)('increment_photo_views', { photo_id: photoId });
    } catch {
      // 忽略错误
    }
  }, [photoId, interactionStore, user?.id]);
  
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

    if (isDemoMode()) {
      await simulateNetworkDelay(500);
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
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('photo_id', photoId)
        .order('created_at', { ascending: false });

      if (commentsError) {
        setComments([]);
        setIsLoading(false);
        return;
      }

      const commentsWithUser = await Promise.all(
        (commentsData || []).map(async (comment: any) => {
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('username, avatar_url')
              .eq('id', comment.user_id)
              .maybeSingle();
            return { ...comment, user: userData || { username: '未知用户' } };
          } catch {
            return { ...comment, user: { username: '未知用户' } };
          }
        })
      );

      setComments(commentsWithUser as Comment[]);
    } catch (err) {
      console.error('Fetch comments error:', err);
      setComments([]);
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

    if (isDemoMode()) {
      await simulateNetworkDelay(500);
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
      console.log('[addComment] 开始发布评论, photoId:', photoId, 'userId:', user.id);
      
      // 先插入评论
      const { data: commentData, error: insertError } = await supabase
        .from('comments')
        .insert({
          photo_id: photoId,
          user_id: user.id,
          content: content.trim(),
        } as any)
        .select('*')
        .single();

      console.log('[addComment] 插入结果:', { commentData, insertError });

      if (insertError) {
        console.error('[addComment] 插入错误:', insertError);
        throw insertError;
      }

      // 定义评论数据类型
      type CommentData = { id: string; photo_id: string; user_id: string; content: string; created_at: string };

      // 再单独获取用户信息
      let userData: { username: string; avatar_url?: string } | null = null;
      if (commentData) {
        const { data: userInfo } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', (commentData as CommentData).user_id)
          .maybeSingle();
        userData = userInfo;
      }

      const newComment: Comment = {
        id: (commentData as CommentData).id,
        photo_id: (commentData as CommentData).photo_id,
        user_id: (commentData as CommentData).user_id,
        content: (commentData as CommentData).content,
        created_at: (commentData as CommentData).created_at,
        user: userData || { username: user.username },
      };

      setComments((prev) => [newComment, ...prev]);
      addToast('评论发布成功', 'success');
      return { error: null };
    } catch (err) {
      console.error('[addComment] 异常:', err);
      const errorMessage = err instanceof Error ? err.message : '发布失败';
      addToast(errorMessage, 'error');
      return { error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!isAuthenticated || !user) return { error: '未登录' };

    if (isDemoMode()) {
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

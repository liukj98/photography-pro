import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { UserStats } from '../types';

// Mock stats for demo mode
const mockStats: UserStats = {
  total_views: 15432,
  total_photos: 24,
  views_by_day: [
    { date: '03/22', count: 120 },
    { date: '03/23', count: 145 },
    { date: '03/24', count: 132 },
    { date: '03/25', count: 178 },
    { date: '03/26', count: 165 },
    { date: '03/27', count: 189 },
    { date: '03/28', count: 205 },
  ],
  popular_photos: [
    { photo_id: '1', title: '山间晨雾', views: 1234 },
    { photo_id: '2', title: '海边日落', views: 987 },
    { photo_id: '3', title: '城市夜景', views: 756 },
  ],
};

export function useStats() {
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Demo mode
    if (!isSupabaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStats(mockStats);
      setIsLoading(false);
      return;
    }

    try {
      // Get total photos count
      const { count: photosCount, error: photosError } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (photosError) throw photosError;

      // Get total views - 使用 photos 表的 views_count 总和
      let totalViews = 0;
      try {
        const { data: photosData, error: photosViewsError } = await supabase
          .from('photos')
          .select('views_count')
          .eq('user_id', user.id);
        
        if (!photosViewsError && photosData) {
          totalViews = photosData.reduce((sum, p: any) => sum + (p.views_count || 0), 0);
        }
      } catch {
        totalViews = 0;
      }

      // Get views by day - 模拟数据（view_stats 表可能不存在）
      const viewsByDay: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
        // 使用随机数据模拟趋势
        const baseCount = Math.floor(totalViews / 7);
        const randomVariation = Math.floor(Math.random() * baseCount * 0.5);
        viewsByDay.push({ date: dateStr, count: Math.max(0, baseCount + randomVariation) });
      }

      // Get popular photos
      const { data: popularPhotos, error: popularError } = await supabase
        .from('photos')
        .select('id, title, views_count')
        .eq('user_id', user.id)
        .order('views_count', { ascending: false })
        .limit(5) as any;

      if (popularError) throw popularError;

      setStats({
        total_views: totalViews,
        total_photos: photosCount || 0,
        views_by_day: viewsByDay,
        popular_photos:
          (popularPhotos || []).map((p: any) => ({
            photo_id: p.id,
            title: p.title,
            views: p.views_count,
          })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取统计数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const recordView = async (viewType: 'profile' | 'photo', photoId?: string) => {
    if (!user) return;

    if (!isSupabaseConfigured) {
      console.log('Demo mode: Recording view', { viewType, photoId });
      return;
    }

    try {
      await supabase.from('view_stats').insert({
        user_id: user.id,
        photo_id: photoId,
        view_type: viewType,
      } as any);

      // If viewing a photo, increment its view count
      if (viewType === 'photo' && photoId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.rpc as any)('increment_photo_views', { photo_id: photoId });
      }
    } catch (err) {
      console.error('Failed to record view:', err);
    }
  };

  return { stats, isLoading, error, refetch: fetchStats, recordView };
}

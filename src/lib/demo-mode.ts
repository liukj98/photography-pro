/**
 * Demo Mode 管理模块
 * 集中管理 demo mode 的判断逻辑和 mock 数据
 */

import type { User, Photo, UserStats, Comment } from '../types';

// ==================== Demo Mode 检测 ====================

/**
 * 检查是否处于 Demo Mode（Supabase 未配置）
 */
export function isDemoMode(): boolean {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return !supabaseUrl || supabaseUrl === 'your_supabase_project_url';
}

/**
 * 模拟网络延迟
 * @param ms 延迟毫秒数，默认 300-800ms 随机
 */
export async function simulateNetworkDelay(ms?: number): Promise<void> {
  const delay = ms ?? Math.floor(Math.random() * 500) + 300;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// ==================== Mock 数据 ====================

// Mock 用户数据
export const mockUser: User = {
  id: 'mock-user-id',
  username: 'demo_user',
  email: 'demo@example.com',
  avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  bio: '摄影爱好者',
  location: '北京',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

/**
 * 创建 Mock 用户（支持自定义邮箱和用户名）
 */
export function createMockUser(email?: string, username?: string): User {
  return {
    ...mockUser,
    email: email ?? mockUser.email,
    username: username ?? mockUser.username,
  };
}

// Mock 照片数据
export const mockPhotos: Photo[] = [
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

// Mock 统计数据
export const mockStats: UserStats = {
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

/**
 * 生成 Mock 评论数据
 */
export function generateMockComments(photoId: string): Comment[] {
  return [
    {
      id: 'mock-1',
      photo_id: photoId,
      user_id: 'user-1',
      content: '这张照片太棒了！',
      created_at: new Date().toISOString(),
      user: { username: 'photographer1' },
    },
  ];
}

// ==================== 随机数据生成器 ====================

/**
 * 生成随机浏览数（用于 demo mode）
 * @param min 最小值，默认 100
 * @param max 最大值，默认 1000
 */
export function generateRandomViews(min = 100, max = 1000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成随机点赞数（用于 demo mode）
 * @param min 最小值，默认 0
 * @param max 最大值，默认 100
 */
export function generateRandomLikes(min = 0, max = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ==================== 类型守卫 ====================

/**
 * 检查是否为有效的 Supabase 响应数据
 */
export function isValidData<T>(data: unknown): data is T {
  return data !== null && data !== undefined;
}

/**
 * 安全地获取数组长度
 */
export function safeArrayLength<T>(arr: T[] | null | undefined): number {
  return Array.isArray(arr) ? arr.length : 0;
}

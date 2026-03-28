import { create } from 'zustand';

/**
 * 互动状态全局存储
 * 用于跨组件同步点赞、收藏、浏览状态
 * 注意：不使用 localStorage 持久化，所有数据从服务器实时获取
 */

interface InteractionState {
  // 点赞状态 Map<photoId, isLiked> - 仅用于内存中的乐观更新
  likes: Map<string, boolean>;
  // 点赞数量 Map<photoId, count> - 仅用于内存中的乐观更新
  likesCount: Map<string, number>;
  // 收藏状态 Map<photoId, isFavorited> - 仅用于内存中的乐观更新
  favorites: Map<string, boolean>;
  // 浏览数量 Map<photoId, count>
  viewsCount: Map<string, number>;
  // 用户已浏览过的作品（防止重复计数）- 这个需要持久化
  viewedPhotos: Set<string>;
  
  // Actions
  setLike: (photoId: string, isLiked: boolean, count: number) => void;
  toggleLike: (photoId: string, currentCount: number) => { isLiked: boolean; newCount: number };
  setFavorite: (photoId: string, isFavorited: boolean) => void;
  toggleFavorite: (photoId: string) => boolean;
  incrementView: (photoId: string) => void;
  hasViewed: (photoId: string) => boolean;
  getLikeState: (photoId: string) => { isLiked: boolean; count: number };
  getFavoriteState: (photoId: string) => boolean;
  getViewsCount: (photoId: string) => number;
  // 重置方法
  reset: () => void;
}

// 初始状态
const initialState = {
  likes: new Map<string, boolean>(),
  likesCount: new Map<string, number>(),
  favorites: new Map<string, boolean>(),
  viewsCount: new Map<string, number>(),
  viewedPhotos: new Set<string>(),
};

export const useInteractionStore = create<InteractionState>((set, get) => ({
  ...initialState,

  setLike: (photoId: string, isLiked: boolean, count: number) => {
    set((state) => {
      const newLikes = new Map(state.likes);
      const newLikesCount = new Map(state.likesCount);
      newLikes.set(photoId, isLiked);
      newLikesCount.set(photoId, count);
      return { likes: newLikes, likesCount: newLikesCount };
    });
  },

  toggleLike: (photoId: string, currentCount: number) => {
    const state = get();
    const currentIsLiked = state.likes.get(photoId) || false;
    const newIsLiked = !currentIsLiked;
    // 使用传入的 currentCount（来自 React state，是最新的）
    const newCount = newIsLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
    
    set((state) => {
      const newLikes = new Map(state.likes);
      const newLikesCount = new Map(state.likesCount);
      newLikes.set(photoId, newIsLiked);
      newLikesCount.set(photoId, newCount);
      return { likes: newLikes, likesCount: newLikesCount };
    });
    
    return { isLiked: newIsLiked, newCount };
  },

  setFavorite: (photoId: string, isFavorited: boolean) => {
    set((state) => {
      const newFavorites = new Map(state.favorites);
      newFavorites.set(photoId, isFavorited);
      return { favorites: newFavorites };
    });
  },

  toggleFavorite: (photoId: string) => {
    const state = get();
    const currentIsFavorited = state.favorites.get(photoId) || false;
    const newIsFavorited = !currentIsFavorited;
    
    set((state) => {
      const newFavorites = new Map(state.favorites);
      newFavorites.set(photoId, newIsFavorited);
      return { favorites: newFavorites };
    });
    
    return newIsFavorited;
  },

  incrementView: (photoId: string) => {
    set((state) => {
      // 检查是否已经浏览过
      if (state.viewedPhotos.has(photoId)) {
        return state; // 已经浏览过，不增加
      }
      
      const newViewsCount = new Map(state.viewsCount);
      const newViewedPhotos = new Set(state.viewedPhotos);
      const currentCount = newViewsCount.get(photoId) || 0;
      
      newViewsCount.set(photoId, currentCount + 1);
      newViewedPhotos.add(photoId);
      
      return { 
        viewsCount: newViewsCount,
        viewedPhotos: newViewedPhotos 
      };
    });
  },
  
  hasViewed: (photoId: string) => {
    return get().viewedPhotos.has(photoId);
  },

  getLikeState: (photoId: string) => {
    const state = get();
    return {
      isLiked: state.likes.get(photoId) || false,
      count: state.likesCount.get(photoId) || 0,
    };
  },

  getFavoriteState: (photoId: string) => {
    return get().favorites.get(photoId) || false;
  },

  getViewsCount: (photoId: string) => {
    return get().viewsCount.get(photoId) || 0;
  },

  reset: () => {
    set(initialState);
  },
}));

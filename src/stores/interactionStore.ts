import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';

/**
 * 互动状态全局存储
 * 用于跨组件同步点赞、收藏、浏览状态
 * 使用 persist 中间件持久化到 localStorage
 */

interface InteractionState {
  // 点赞状态 Map<photoId, isLiked>
  likes: Map<string, boolean>;
  // 点赞数量 Map<photoId, count>
  likesCount: Map<string, number>;
  // 收藏状态 Map<photoId, isFavorited>
  favorites: Map<string, boolean>;
  // 浏览数量 Map<photoId, count>
  viewsCount: Map<string, number>;
  // 用户已浏览过的作品（防止重复计数）
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
}

// 自定义存储，处理 Map 和 Set 的序列化
const customStorage: PersistStorage<InteractionState> = {
  getItem: (name: string): StorageValue<InteractionState> | null => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    try {
      const parsed = JSON.parse(str);
      return {
        state: {
          likes: new Map(parsed.state.likes),
          likesCount: new Map(parsed.state.likesCount),
          favorites: new Map(parsed.state.favorites),
          viewsCount: new Map(parsed.state.viewsCount),
          viewedPhotos: new Set(parsed.state.viewedPhotos),
          // 需要包含所有方法，但不会被序列化
          setLike: () => {},
          toggleLike: () => ({ isLiked: false, newCount: 0 }),
          setFavorite: () => {},
          toggleFavorite: () => false,
          incrementView: () => {},
          hasViewed: () => false,
          getLikeState: () => ({ isLiked: false, count: 0 }),
          getFavoriteState: () => false,
          getViewsCount: () => 0,
        },
        version: parsed.version,
      };
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: StorageValue<InteractionState>): void => {
    const serialized = JSON.stringify({
      state: {
        likes: Array.from(value.state.likes.entries()),
        likesCount: Array.from(value.state.likesCount.entries()),
        favorites: Array.from(value.state.favorites.entries()),
        viewsCount: Array.from(value.state.viewsCount.entries()),
        viewedPhotos: Array.from(value.state.viewedPhotos),
      },
      version: value.version,
    });
    localStorage.setItem(name, serialized);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

export const useInteractionStore = create<InteractionState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      likes: new Map(),
      likesCount: new Map(),
      favorites: new Map(),
      viewsCount: new Map(),
      viewedPhotos: new Set(),

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
        const newCount = newIsLiked ? currentCount + 1 : currentCount - 1;
        
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
    })),
    {
      name: 'interaction-storage',
      storage: customStorage,
    }
  )
);

// 导出订阅方法用于组件订阅特定 photoId 的变化
export const subscribeToLikeChanges = (
  photoId: string,
  callback: (isLiked: boolean, count: number) => void
) => {
  return useInteractionStore.subscribe(
    (state) => ({
      isLiked: state.likes.get(photoId),
      count: state.likesCount.get(photoId),
    }),
    (curr, prev) => {
      if (curr.isLiked !== prev.isLiked || curr.count !== prev.count) {
        callback(curr.isLiked || false, curr.count || 0);
      }
    }
  );
};

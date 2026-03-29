# To C 常见功能模式

## 1. 用户认证模式

### 1.1 Supabase Auth 集成

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 未配置时使用 Mock 客户端（演示模式）
const isConfigured = supabaseUrl && supabaseUrl !== 'your_url';

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

export const isSupabaseConfigured = isConfigured;
```

**关键设计**：
- 未配置 Supabase 时自动降级为演示模式
- 方便产品 Demo 和前端独立开发

### 1.2 认证 Store (Zustand)

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials) => Promise<{ error: string | null }>;
  register: (credentials) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });
          if (error) {
            // 处理邮箱未确认等特殊错误
            if (error.message.includes('Email not confirmed')) {
              // 尝试重新发送验证邮件
              await supabase.auth.resend({ type: 'signup', email: credentials.email });
              set({ isLoading: false });
              return { error: '邮箱未验证，已重新发送验证邮件' };
            }
            set({ isLoading: false });
            return { error: error.message };
          }
          if (data.user) await get().fetchUser();
          set({ isLoading: false });
          return { error: null };
        } catch {
          set({ isLoading: false });
          return { error: '登录失败，请稍后重试' };
        }
      },

      register: async (credentials) => {
        set({ isLoading: true });
        try {
          // 检查用户名是否重复
          const { data: existing } = await supabase
            .from('users')
            .select('username')
            .eq('username', credentials.username)
            .single();
          if (existing) {
            set({ isLoading: false });
            return { error: '用户名已被使用' };
          }

          // 注册
          const { data, error } = await supabase.auth.signUp({
            email: credentials.email,
            password: credentials.password,
            options: { data: { username: credentials.username } },
          });

          // 自动登录（开发环境关闭邮箱验证时）
          if (data.user && !data.session) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: credentials.email,
              password: credentials.password,
            });
            if (!signInError) {
              await get().fetchUser();
              set({ isLoading: false });
              return { error: null };
            }
          }

          if (error) { set({ isLoading: false }); return { error: error.message }; }

          // 创建用户资料
          if (data.user) {
            await supabase.from('users').insert({
              id: data.user.id,
              username: credentials.username,
              email: credentials.email,
            });
            await get().fetchUser();
          }

          set({ isLoading: false });
          return { error: null };
        } catch {
          set({ isLoading: false });
          return { error: '注册失败，请稍后重试' };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      fetchUser: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
            if (data) set({ user: data, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);
```

### 1.3 路由守卫

```tsx
// App.tsx 中的 ProtectedRoute 组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

### 1.4 布局模式

```tsx
// 三种布局
// 1. PublicLayout - 带导航栏和页脚（公开页面）
function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

// 2. AuthLayout - 无导航栏（登录/注册页）
function AuthLayout({ children }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}

// 3. ProtectedRoute - 鉴权守卫
```

## 2. 内容管理模式

### 2.1 内容 CRUD Hook

```typescript
// src/hooks/usePhotos.ts（示例，根据实际业务调整）
export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPhotos = async (filters?: PhotoFilters) => {
    setLoading(true);
    try {
      let query = supabase.from('photos').select('*, user:users(*)');
      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.userId) query = query.eq('user_id', filters.userId);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (!error) setPhotos(data || []);
    } catch (error) {
      console.error('获取内容失败:', error);
    }
    setLoading(false);
  };

  return { photos, loading, fetchPhotos };
}
```

### 2.2 图片懒加载组件

```tsx
// src/components/ui/LazyImage.tsx
export function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn('relative overflow-hidden bg-gray-200', className)}>
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gray-300" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <ImageOff size={24} />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn('transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
        />
      )}
    </div>
  );
}
```

## 3. 社交互动模式

### 3.1 点赞/收藏组件

```tsx
// 独立的互动 Hook，避免页面组件过重
export function useInteractions(photoId: string) {
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const toggleLike = async () => { ... };
  const toggleFavorite = async () => { ... };

  return { liked, favorited, likeCount, toggleLike, toggleFavorite };
}
```

### 3.2 评论组件

```tsx
// 评论列表 + 发表评论
function CommentSection({ photoId }) {
  // 获取评论
  // 发表评论
  // 删除评论（自己的）
}
```

## 4. Toast 通知模式

```typescript
// src/stores/toastStore.ts
interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Date.now().toString();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },
}));
```

## 5. 主题切换模式

```typescript
// src/stores/themeStore.ts
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark');
        return { theme: newTheme };
      }),
    }),
    { name: 'theme-storage' }
  )
);

// 初始化主题
export function initTheme() {
  const saved = localStorage.getItem('theme-storage');
  const theme = saved ? JSON.parse(saved).state.theme : 'dark';
  if (theme === 'dark') document.documentElement.classList.add('dark');
}
```

## 6. 演示模式 (Demo Mode)

当 Supabase 未配置时，项目仍然可以展示 UI：

```typescript
// src/lib/demo-mode.ts
export function isDemoMode(): boolean {
  return !import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL === 'your_url';
}

export function createMockUser(email: string, username?: string): User {
  return {
    id: 'demo-user-id',
    username: username || email.split('@')[0],
    email,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
```

## 7. 状态管理模式总结

| Store | 职责 | 持久化 | 场景 |
|-------|------|--------|------|
| `authStore` | 用户认证状态 | localStorage | 登录/注册/用户信息 |
| `themeStore` | 主题状态 | localStorage | Light/Dark 切换 |
| `toastStore` | 全局通知 | 内存 | 操作反馈 |
| `interactionStore` | 互动状态 | 内存 | 点赞/收藏/评论 |

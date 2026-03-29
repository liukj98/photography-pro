# 状态管理规范

## 1. 选型：Zustand

To C 项目推荐使用 **Zustand** 作为状态管理方案。

### 为什么不选 Redux

| 对比维度 | Redux Toolkit | Zustand |
|----------|--------------|---------|
| 代码量 | 多（需要 slice/action/reducer） | 少（一个 store 文件） |
| 学习成本 | 中 | 低 |
| Provider 包裹 | 需要 | 不需要 |
| TypeScript 支持 | 好 | 好 |
| 中间件 | 丰富 | 够用（persist, immer） |
| 适用场景 | 大型复杂应用 | 中小型应用（To C MVP/V1） |

## 2. Store 设计规范

### 2.1 命名规范

```
stores/
├── authStore.ts          # 认证状态（必需）
├── themeStore.ts         # 主题状态（推荐）
├── toastStore.ts         # 通知状态（推荐）
└── {feature}Store.ts     # 业务状态（按需）
```

命名规则：`{domain}Store.ts`，导出 hook：`use{Domain}Store`

### 2.2 Store 结构模板

```typescript
// stores/exampleStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. 定义状态接口
interface ExampleState {
  // 状态字段
  items: Item[];
  isLoading: boolean;
  error: string | null;

  // 操作方法
  fetchItems: () => Promise<void>;
  addItem: (item: Item) => Promise<void>;
  clearError: () => void;
}

// 2. 创建 Store
export const useExampleStore = create<ExampleState>()(
  // 3. 如需持久化，包裹 persist 中间件
  persist(
    (set, get) => ({
      // 初始状态
      items: [],
      isLoading: false,
      error: null,

      // 异步操作
      fetchItems: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.from('items').select('*');
          if (error) throw error;
          set({ items: data || [], isLoading: false });
        } catch (err) {
          set({ error: '获取数据失败', isLoading: false });
        }
      },

      // 同步操作
      addItem: async (item) => {
        try {
          const { error } = await supabase.from('items').insert(item);
          if (error) throw error;
          set((state) => ({ items: [item, ...state.items] }));
        } catch (err) {
          set({ error: '添加失败' });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      // 4. 持久化配置
      name: 'example-storage',
      partialize: (state) => ({ items: state.items }), // 只持久化部分字段
    }
  )
);
```

### 2.3 必需 Store

#### authStore（认证）

```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ error: string | null }>;
  register: (credentials: RegisterCredentials) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}
```

**持久化字段**：`user`, `isAuthenticated`

#### themeStore（主题）

```typescript
interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

**持久化字段**：`theme`

#### toastStore（通知）

```typescript
interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}
```

**持久化**：无（内存中，页面刷新清空）

## 3. 使用规范

### 3.1 在组件中使用

```tsx
// 选择性订阅（推荐，避免不必要的重渲染）
function UserMenu() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!isAuthenticated) return <LoginButton />;
  return (
    <div>
      <span>{user?.username}</span>
      <button onClick={logout}>退出</button>
    </div>
  );
}
```

### 3.2 在页面中初始化

```tsx
function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return <RouterProvider />;
}
```

### 3.3 跨组件通信

```tsx
// 组件 A：触发操作
function UploadButton() {
  const addToast = useToastStore((s) => s.addToast);

  const handleUpload = async () => {
    const { error } = await supabase.storage.from('photos').upload(path, file);
    if (!error) {
      addToast('上传成功', 'success');
    } else {
      addToast('上传失败', 'error');
    }
  };
}

// 组件 B：显示通知
function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  return toasts.map(t => <Toast key={t.id} {...t} />);
}
```

## 4. 最佳实践

### Do

- 每个业务域一个 Store 文件
- 使用 `partialize` 控制持久化字段
- 使用选择性订阅 `useStore(s => s.field)` 减少重渲染
- 异步操作中使用 `set({ isLoading: true/false })` 管理 loading
- 错误统一存放在 Store 的 `error` 字段

### Don't

- 不要在 Store 中存放派生数据（用 `useMemo` 计算）
- 不要在 Store 中放 UI 状态（如 modal 开关，用 `useState`）
- 不要在一个 Store 中放太多不相关的状态
- 不要直接修改 Store 状态（通过 `set` 函数）

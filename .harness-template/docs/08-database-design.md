# 数据库设计规范

## 1. Supabase 作为 To C 后端

To C 项目使用 **Supabase** 作为 BaaS（Backend as a Service），包含：
- **Auth**：用户认证（邮箱注册、OAuth）
- **Database**：PostgreSQL 数据库
- **Storage**：文件存储（图片、视频等）
- **RLS**：行级安全策略

## 2. 数据库初始化规范

### 2.1 SQL 脚本组织

```
supabase/
├── init-dev.sql           # 开发环境完整初始化脚本（一键执行）
├── setup.sql              # 基础配置
├── add-{feature}.sql      # 增量迁移（如 add-comments.sql）
├── fix-rls.sql            # RLS 修复脚本
└── setup.md               # 数据库设置说明
```

### 2.2 init-dev.sql 标准结构

```sql
-- ============================================
-- 第1部分：启用扩展
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 第2部分：创建基础表（按依赖顺序）
-- ============================================

-- 2.1 用户表（依赖 auth.users）
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2.2 核心业务表
CREATE TABLE IF NOT EXISTS public.{main_entity} (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    -- ... 业务字段
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 第3部分：创建关联表
-- ============================================
-- likes, favorites, comments, view_stats 等

-- ============================================
-- 第4部分：创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_{table}_{field} ON public.{table}({field});

-- ============================================
-- 第5部分：创建触发器（updated_at 自动更新）
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 第6部分：启用 RLS 并设置策略
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.{main_entity} ENABLE ROW LEVEL SECURITY;

-- RLS 策略示例
CREATE POLICY "Users can view all profiles" ON public.users
FOR SELECT TO public USING (true);

CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE TO authenticated USING (auth.uid() = id);
```

## 3. To C 常见表结构

### 3.1 用户表 (users)

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 3.2 主业务表（以内容平台为例）

```sql
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    tags TEXT[] DEFAULT '{}',
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 3.3 互动表 (likes / favorites / comments)

```sql
-- 点赞
CREATE TABLE public.likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, post_id)
);

-- 收藏
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, post_id)
);

-- 评论
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 统计表 (view_stats)

```sql
CREATE TABLE public.view_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    view_type TEXT NOT NULL CHECK (view_type IN ('profile', 'post')),
    viewer_ip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

## 4. RLS（行级安全）规范

### 4.1 启用 RLS

```sql
-- 所有业务表必须启用 RLS
ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;
```

### 4.2 标准 RLS 策略模板

```sql
-- 公开可读
CREATE POLICY "Public read {table}" ON public.{table}
FOR SELECT TO public USING ({visibility_condition});

-- 认证用户可创建
CREATE POLICY "Authenticated insert {table}" ON public.{table}
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 本人可修改
CREATE POLICY "Owner update {table}" ON public.{table}
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 本人可删除
CREATE POLICY "Owner delete {table}" ON public.{table}
FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

### 4.3 Storage RLS

```sql
-- 认证用户可上传
CREATE POLICY "Allow upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'your-bucket');

-- 公开可读
CREATE POLICY "Public read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'your-bucket');

-- 本人可删除
CREATE POLICY "Owner delete" ON storage.objects
FOR DELETE TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## 5. 索引规范

```sql
-- 外键索引
CREATE INDEX IF NOT EXISTS idx_{table}_{fk_field} ON public.{table}({fk_field});

-- 排序字段索引
CREATE INDEX IF NOT EXISTS idx_{table}_{sort_field} ON public.{table}({sort_field} DESC);

-- 筛选字段索引
CREATE INDEX IF NOT EXISTS idx_{table}_{filter_field} ON public.{table}({filter_field});

-- 唯一约束索引
-- 通过 UNIQUE 约束自动创建
```

## 6. TypeScript 类型同步

### 6.1 使用 Supabase CLI 生成类型

```bash
# 安装 CLI
npm install -D supabase

# 生成类型定义
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

### 6.2 手动维护类型（备选）

```typescript
// src/types/index.ts
export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url: string;
  category: string;
  tags: string[];
  views_count: number;
  likes_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: { username: string; avatar_url?: string };
}
```

## 7. Seed 数据规范

```javascript
// scripts/seed-data.js
// 用于开发环境快速填充测试数据

async function seed() {
  console.log('开始填充测试数据...');

  // 1. 创建测试用户（通过 Supabase Admin API）
  const testUsers = [
    { email: 'test1@example.com', password: 'Test123456!', username: 'user_test1' },
    { email: 'test2@example.com', password: 'Test123456!', username: 'user_test2' },
  ];

  // 2. 创建用户资料
  // 3. 填充示例内容
  // 4. 创建互动数据

  console.log('测试数据填充完成！');
  console.log('测试账号:', testUsers.map(u => ({ email: u.email, password: u.password })));
}
```

运行：`npm run seed`

## 8. 数据库变更流程

```
需求变更 → 修改 init-dev.sql（保持完整可执行）
        → 创建增量迁移 supabase/migrations/{timestamp}_{description}.sql
        → 更新 TypeScript 类型
        → 运行测试验证
        → 更新 seed 数据（如需要）
```

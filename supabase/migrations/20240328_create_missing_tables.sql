-- 创建缺失的表和函数
-- 执行此 SQL 来修复 PhotoDetail 页面的接口报错

-- 1. 创建 view_stats 表（浏览统计）
CREATE TABLE IF NOT EXISTS public.view_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE,
    view_type TEXT NOT NULL CHECK (view_type IN ('profile', 'photo')),
    viewer_ip TEXT,
    viewer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 view_stats 添加 RLS
ALTER TABLE public.view_stats ENABLE ROW LEVEL SECURITY;

-- 允许已登录用户插入自己的浏览记录
DROP POLICY IF EXISTS "Allow insert own view stats" ON public.view_stats;
CREATE POLICY "Allow insert own view stats" ON public.view_stats
    FOR INSERT TO authenticated WITH CHECK (viewer_user_id = auth.uid());

-- 允许用户查看自己的浏览统计
DROP POLICY IF EXISTS "Allow view own stats" ON public.view_stats;
CREATE POLICY "Allow view own stats" ON public.view_stats
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 2. 创建 comments 表（评论）
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 comments 添加 RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 允许任何人查看评论
DROP POLICY IF EXISTS "Allow view comments" ON public.comments;
CREATE POLICY "Allow view comments" ON public.comments
    FOR SELECT TO anon, authenticated USING (true);

-- 允许已登录用户发表评论
DROP POLICY IF EXISTS "Allow insert comments" ON public.comments;
CREATE POLICY "Allow insert comments" ON public.comments
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 允许用户删除自己的评论
DROP POLICY IF EXISTS "Allow delete own comments" ON public.comments;
CREATE POLICY "Allow delete own comments" ON public.comments
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 3. 创建 increment_photo_views 函数
CREATE OR REPLACE FUNCTION public.increment_photo_views(photo_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.photos
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = photo_id;
END;
$$;

-- 4. 为 photos 表添加 views_count 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'photos' AND column_name = 'views_count'
    ) THEN
        ALTER TABLE public.photos ADD COLUMN views_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 5. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_view_stats_user_id ON public.view_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_view_stats_photo_id ON public.view_stats(photo_id);
CREATE INDEX IF NOT EXISTS idx_comments_photo_id ON public.comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- 6. 更新 photos 表的 RLS 策略（确保可以更新 views_count）
-- 允许任何人增加浏览量（通过函数）
-- 先删除已存在的策略，再创建新的
DROP POLICY IF EXISTS "Allow increment views" ON public.photos;
CREATE POLICY "Allow increment views" ON public.photos
    FOR UPDATE TO anon, authenticated 
    USING (true)
    WITH CHECK (true);

-- 7. 创建 likes 表（点赞）
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(photo_id, user_id)
);

-- 为 likes 添加 RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 允许任何人查看点赞
DROP POLICY IF EXISTS "Allow view likes" ON public.likes;
CREATE POLICY "Allow view likes" ON public.likes
    FOR SELECT TO anon, authenticated USING (true);

-- 允许已登录用户点赞
DROP POLICY IF EXISTS "Allow insert likes" ON public.likes;
CREATE POLICY "Allow insert likes" ON public.likes
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 允许用户取消自己的点赞
DROP POLICY IF EXISTS "Allow delete own likes" ON public.likes;
CREATE POLICY "Allow delete own likes" ON public.likes
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 8. 创建 favorites 表（收藏）
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(photo_id, user_id)
);

-- 为 favorites 添加 RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 允许任何人查看收藏
DROP POLICY IF EXISTS "Allow view favorites" ON public.favorites;
CREATE POLICY "Allow view favorites" ON public.favorites
    FOR SELECT TO anon, authenticated USING (true);

-- 允许已登录用户收藏
DROP POLICY IF EXISTS "Allow insert favorites" ON public.favorites;
CREATE POLICY "Allow insert favorites" ON public.favorites
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 允许用户取消自己的收藏
DROP POLICY IF EXISTS "Allow delete own favorites" ON public.favorites;
CREATE POLICY "Allow delete own favorites" ON public.favorites
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 9. 创建索引
CREATE INDEX IF NOT EXISTS idx_likes_photo_id ON public.likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_photo_id ON public.favorites(photo_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

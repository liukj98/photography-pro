-- 开发环境：完全开放 RLS 策略（仅用于开发测试！）
-- 生产环境请使用严格的策略

-- 删除所有现有策略
DROP POLICY IF EXISTS "Public photos are viewable by everyone" ON public.photos;
DROP POLICY IF EXISTS "Users can view their own private photos" ON public.photos;
DROP POLICY IF EXISTS "Users can create their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON public.photos;

-- 创建允许所有操作的策略（仅开发环境！）
CREATE POLICY "Allow all operations for authenticated users" 
ON public.photos 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow select for anon" 
ON public.photos 
FOR SELECT 
TO anon 
USING (is_public = true);

-- 确保 RLS 已启用
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- 授予权限
GRANT ALL ON public.photos TO authenticated;
GRANT ALL ON public.photos TO anon;
GRANT ALL ON public.photos TO service_role;

-- 对 view_stats 同样处理
DROP POLICY IF EXISTS "Users can view their own stats" ON public.view_stats;
DROP POLICY IF EXISTS "Anyone can create view stats" ON public.view_stats;

CREATE POLICY "Allow all for view_stats" 
ON public.view_stats 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

ALTER TABLE public.view_stats ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.view_stats TO authenticated;

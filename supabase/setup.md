# Supabase 配置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目名称（如：photography-pro）
4. 选择区域（建议选择离你最近的区域）
5. 等待项目创建完成

## 2. 获取 API 密钥

1. 进入项目 Dashboard
2. 点击左侧菜单 "Project Settings" → "API"
3. 复制以下信息：
   - **Project URL**: `VITE_SUPABASE_URL`
   - **anon/public**: `VITE_SUPABASE_ANON_KEY`

## 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
VITE_SUPABASE_URL=你的_project_url
VITE_SUPABASE_ANON_KEY=你的_anon_key
```

示例：
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. 创建数据库表

1. 进入 Supabase Dashboard
2. 点击左侧菜单 "SQL Editor"
3. 创建 "New Query"
4. 复制 `setup.sql` 文件中的全部内容
5. 点击 "Run" 执行 SQL

## 5. 配置 Storage（图片存储）

1. 点击左侧菜单 "Storage"
2. 创建新 bucket：
   - Name: `photos`
   - Public bucket: ✅ 勾选
3. 创建文件夹：
   - `originals/` - 存储原图
   - `thumbnails/` - 存储缩略图
   - `avatars/` - 存储用户头像
4. 配置 bucket 权限（Policies）：

```sql
-- Allow public access to photos
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'photos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE TO authenticated USING (auth.uid() = owner);
```

## 6. 配置 Authentication

1. 点击左侧菜单 "Authentication"
2. 在 "Providers" 中启用需要的登录方式（默认 Email 已启用）
3. 在 "URL Configuration" 中配置：
   - Site URL: `http://localhost:5173` (开发环境)
   - Redirect URLs: `http://localhost:5173/*`

## 7. 验证配置

1. 重启开发服务器：
   ```bash
   npm run dev
   ```
2. 访问注册页面，尝试创建账号
3. 检查 Supabase Dashboard 的 "Table Editor" → "users" 表是否有新用户数据

## 常见问题

### Q: 注册时提示 "User already registered"
A: 检查 users 表是否已有该邮箱的记录，或检查 auth.users 表

### Q: 图片上传失败
A: 确认 Storage bucket 已创建，且已配置正确的访问权限

### Q: RLS 权限错误
A: 确认 SQL 脚本中的 RLS policies 已正确执行

## 生产环境部署

部署到生产环境前，需要更新 URL 配置：

1. **Site URL**: 你的生产域名
2. **Redirect URLs**: 你的生产域名 + `/*`
3. **CORS**: 配置允许的生产域名

在 Vercel/Netlify 等平台的 Environment Variables 中设置：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

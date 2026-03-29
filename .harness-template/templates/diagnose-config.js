# To C 诊断配置模板
# 将此文件复制到 .harness/scripts/ 作为 diagnose.js 的基础
# 根据具体项目修改错误模式和修复 SQL

const errorPatterns = [
  // ==================== 认证错误 ====================
  {
    id: 'auth-email-not-confirmed',
    pattern: /Email not confirmed/i,
    category: 'auth',
    severity: 'medium',
    cause: 'Supabase 邮箱验证功能已启用',
    solution: [
      '1. 打开 Supabase Dashboard',
      '2. 进入 Authentication > Providers',
      '3. 找到 Email 提供商',
      '4. 关闭 "Confirm email" 开关',
    ],
    sqlFix: null,
    autoFixable: false,
  },
  {
    id: 'auth-invalid-credentials',
    pattern: /Invalid login credentials/i,
    category: 'auth',
    severity: 'low',
    cause: '用户名或密码错误',
    solution: [
      '1. 检查 seed 数据是否已执行 (npm run seed)',
      '2. 确认使用正确的测试账号',
      '3. 密码: Test123456!',
    ],
    sqlFix: null,
    autoFixable: false,
  },

  // ==================== 数据库 RLS 错误 ====================
  {
    id: 'database-rls-insert',
    pattern: /new row violates row-level security policy/i,
    category: 'database',
    severity: 'high',
    cause: '数据表缺少 INSERT 权限策略',
    solution: ['在 Supabase SQL Editor 执行以下修复 SQL：'],
    sqlFix: `-- 修复表 RLS（将 your_table 替换为实际表名）
-- 方案 1：所有认证用户可操作
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.your_table;
CREATE POLICY "Allow all for authenticated" ON public.your_table FOR ALL
TO authenticated USING (true) WITH CHECK (true);

-- 方案 2：仅本人可操作（推荐）
DROP POLICY IF EXISTS "Owner operations" ON public.your_table;
CREATE POLICY "Owner operations" ON public.your_table FOR ALL
TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());`,
    autoFixable: true,
  },
  {
    id: 'database-rls-select',
    pattern: /permission denied for table/i,
    category: 'database',
    severity: 'high',
    cause: '表缺少 SELECT 权限策略',
    solution: ['在 Supabase SQL Editor 执行以下修复 SQL：'],
    sqlFix: `-- 修复 SELECT 权限（将 your_table 替换为实际表名）
DROP POLICY IF EXISTS "Public select" ON public.your_table;
CREATE POLICY "Public select" ON public.your_table FOR SELECT
TO public USING (true);`,
    autoFixable: true,
  },

  // ==================== Storage 错误 ====================
  {
    id: 'storage-rls-insert',
    pattern: /StorageApiError.*row-level security/i,
    category: 'storage',
    severity: 'high',
    cause: 'Storage bucket 缺少 INSERT 权限策略',
    solution: ['在 Supabase SQL Editor 执行以下修复 SQL：'],
    sqlFix: `-- 修复 Storage RLS（将 your-bucket 替换为实际 bucket 名）
DROP POLICY IF EXISTS "Allow upload" ON storage.objects;
CREATE POLICY "Allow upload" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (bucket_id = 'your-bucket');

-- 确保公开可读
DROP POLICY IF EXISTS "Public read" ON storage.objects;
CREATE POLICY "Public read" ON storage.objects FOR SELECT
TO public USING (bucket_id = 'your-bucket');

-- 确保 bucket 存在且公开
INSERT INTO storage.buckets (id, name, public)
VALUES ('your-bucket', 'your-bucket', true)
ON CONFLICT (id) DO UPDATE SET public = true;`,
    autoFixable: true,
  },

  // ==================== 配置错误 ====================
  {
    id: 'config-supabase-missing',
    pattern: /supabaseUrl is required/i,
    category: 'configuration',
    severity: 'critical',
    cause: 'Supabase 环境变量未配置',
    solution: [
      '1. 复制 .env.example 为 .env.development',
      '2. 填入 VITE_SUPABASE_URL',
      '3. 填入 VITE_SUPABASE_ANON_KEY',
      '4. 重启开发服务器 (npm run dev)',
    ],
    sqlFix: null,
    autoFixable: false,
  },

  // ==================== 网络/UI 错误 ====================
  {
    id: 'network-timeout',
    pattern: /Timeout.*\d+ms exceeded/i,
    category: 'network',
    severity: 'medium',
    cause: '操作超时',
    solution: [
      '1. 检查开发服务器是否运行 (npm run dev)',
      '2. 检查网络连接',
      '3. 考虑增加超时时间',
    ],
    sqlFix: null,
    autoFixable: false,
  },
];

// ==================== 扩展说明 ====================
// 添加新错误模式：
// 1. 确定错误信息的正则模式
// 2. 选择分类（auth/database/storage/network/ui/configuration）
// 3. 设置严重程度（critical/high/medium/low）
// 4. 提供修复步骤和可选的 SQL 修复脚本
// 5. 标记是否可自动修复

module.exports = { errorPatterns };

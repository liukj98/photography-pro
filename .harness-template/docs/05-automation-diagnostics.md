# 自动化诊断与修复规范

## 1. 诊断系统概述

To C 项目在开发和测试中会遇到一些高频错误，特别是与 Supabase Auth、RLS、Storage 相关的问题。自动化诊断系统通过**模式匹配**快速定位错误原因，并生成修复方案。

```
错误发生
  ↓
自动捕获错误信息
  ↓
模式匹配（正则表达式）
  ↓
分类 + 定级 + 生成诊断报告
  ↓
├── 可自动修复 → 生成 SQL/配置 → 提示执行
└── 不可自动修复 → 生成排查指南
```

## 2. To C 常见错误模式库

### 2.1 认证错误 (Auth)

| 错误信息 | 模式 | 原因 | 修复 | 自动修复 |
|----------|------|------|------|----------|
| `Email not confirmed` | `auth/email-not-confirmed` | Supabase 邮箱验证开启 | 关闭 Confirm email | 否（手动配置） |
| `Invalid login credentials` | `auth/invalid-credentials` | 用户名或密码错误 | 检查 seed 数据 | 否 |
| `User already registered` | `auth/user-exists` | 邮箱已被注册 | 使用随机邮箱 | 是（测试中） |
| `Password should be at least 6 characters` | `auth/weak-password` | 密码强度不足 | 使用 `Test123456!` | 是 |

### 2.2 数据库 RLS 错误 (Database)

| 错误信息 | 模式 | 原因 | 修复 | 自动修复 |
|----------|------|------|------|----------|
| `new row violates row-level security policy` | `database/rls-insert` | 表缺少 INSERT 策略 | 添加 RLS 策略 | 是（生成 SQL） |
| `SELECT permission denied` | `database/rls-select` | 表缺少 SELECT 策略 | 添加 RLS 策略 | 是（生成 SQL） |
| `UPDATE permission denied` | `database/rls-update` | 表缺少 UPDATE 策略 | 添加 RLS 策略 | 是（生成 SQL） |

### 2.3 Storage 错误

| 错误信息 | 模式 | 原因 | 修复 | 自动修复 |
|----------|------|------|------|----------|
| `StorageApiError: ... violates row-level security` | `storage/rls-insert` | Storage bucket 缺少 INSERT 策略 | 添加 Storage RLS | 是（生成 SQL） |
| `Bucket not found` | `storage/bucket-missing` | Bucket 未创建 | 创建 Bucket | 否 |
| `File size too large` | `storage/file-too-large` | 文件超限 | 压缩或限制大小 | 否 |

### 2.4 网络/UI 错误

| 错误信息 | 模式 | 原因 | 修复 | 自动修复 |
|----------|------|------|------|----------|
| `Timeout ...ms exceeded` | `network/timeout` | 页面加载超时 | 增加超时/检查服务 | 否 |
| `locator.waitFor: Error: strict mode violation` | `ui/multiple-match` | 选择器匹配多个元素 | 使用 `.first()` 或更精确选择器 | 是（修改选择器） |
| `net::ERR_CONNECTION_REFUSED` | `network/connection` | 开发服务器未启动 | `npm run dev` | 否 |

## 3. 诊断实现

### 3.1 测试辅助诊断 (tests/helpers/diagnose.ts)

```typescript
export interface Diagnosis {
  category: 'auth' | 'storage' | 'database' | 'ui' | 'network' | 'unknown';
  pattern: string;
  message: string;
  cause: string;
  fix: string;
  sqlFix?: string;
  autoFixable: boolean;
}

export function diagnoseError(error: unknown): Diagnosis {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // === Auth 错误 ===
  if (errorMessage.includes('Email not confirmed')) {
    return {
      category: 'auth',
      pattern: 'email-not-confirmed',
      message: errorMessage,
      cause: 'Supabase 邮箱验证功能已启用',
      fix: `1. 打开 Supabase Dashboard → Authentication → Providers\n2. 关闭 "Confirm email"`,
      autoFixable: false,
    };
  }

  // === Storage RLS ===
  if (errorMessage.includes('StorageApiError') && errorMessage.includes('row-level security')) {
    return {
      category: 'storage',
      pattern: 'storage-rls',
      message: errorMessage,
      cause: 'Storage bucket 缺少 INSERT 权限策略',
      fix: '在 Supabase SQL Editor 执行修复 SQL',
      sqlFix: generateStorageRLSFix('photos'),  // 根据实际 bucket 名生成
      autoFixable: true,
    };
  }

  // === Database RLS ===
  if (errorMessage.includes('violates row-level security')) {
    return {
      category: 'database',
      pattern: 'database-rls',
      message: errorMessage,
      cause: '数据表缺少对应的 RLS 策略',
      fix: '在 Supabase SQL Editor 执行修复 SQL',
      sqlFix: generateTableRLSFix('photos'),  // 根据实际表名生成
      autoFixable: true,
    };
  }

  // === Timeout ===
  if (errorMessage.includes('Timeout') || errorMessage.includes('timeout')) {
    return {
      category: 'network',
      pattern: 'timeout',
      message: errorMessage,
      cause: '操作超时，服务器未在预期时间内响应',
      fix: '检查开发服务器是否运行，或增加超时时间',
      autoFixable: false,
    };
  }

  // === Element not found ===
  if (errorMessage.includes('locator') && errorMessage.includes('not found')) {
    return {
      category: 'ui',
      pattern: 'element-not-found',
      message: errorMessage,
      cause: '页面元素未找到，选择器可能错误或页面未完全加载',
      fix: '检查选择器是否正确，考虑增加 waitForSelector',
      autoFixable: false,
    };
  }

  // 默认
  return {
    category: 'unknown',
    pattern: 'unknown',
    message: errorMessage,
    cause: '未知错误',
    fix: '查看完整错误堆栈，检查浏览器控制台',
    autoFixable: false,
  };
}
```

### 3.2 命令行诊断脚本 (.harness/scripts/diagnose.js)

```javascript
#!/usr/bin/env node
// .harness/scripts/diagnose.js - 命令行诊断工具

const errorPatterns = [
  {
    id: 'auth-email-not-confirmed',
    pattern: /Email not confirmed/i,
    category: 'auth',
    severity: 'medium',
    cause: 'Supabase 邮箱验证功能已启用',
    solution: [
      '1. 打开 Supabase Dashboard',
      '2. 进入 Authentication > Providers',
      '3. 关闭 "Confirm email"',
    ],
    sqlFix: null,
    autoFixable: false,
  },
  {
    id: 'storage-rls-violation',
    pattern: /StorageApiError.*row-level security/i,
    category: 'storage',
    severity: 'high',
    cause: 'Storage bucket 缺少 INSERT 权限策略',
    solution: ['在 Supabase SQL Editor 执行修复 SQL'],
    sqlFix: `-- 修复 Storage RLS（根据实际 bucket 调整）
DROP POLICY IF EXISTS "Allow upload" ON storage.objects;
CREATE POLICY "Allow upload" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (bucket_id = 'your-bucket');
UPDATE storage.buckets SET public = true WHERE id = 'your-bucket';`,
    autoFixable: true,
  },
  {
    id: 'database-rls-violation',
    pattern: /new row violates row-level security policy/i,
    category: 'database',
    severity: 'high',
    cause: '数据表缺少 INSERT/UPDATE 权限策略',
    solution: ['在 Supabase SQL Editor 执行修复 SQL'],
    sqlFix: `-- 修复表 RLS（根据实际表名调整）
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.your_table;
CREATE POLICY "Allow all for authenticated" ON public.your_table FOR ALL
TO authenticated USING (true) WITH CHECK (true);`,
    autoFixable: true,
  },
  {
    id: 'supabase-config-missing',
    pattern: /supabaseUrl is required/i,
    category: 'configuration',
    severity: 'critical',
    cause: 'Supabase 环境变量未配置',
    solution: [
      '1. 创建 .env.development 文件',
      '2. 添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY',
      '3. 重启开发服务器',
    ],
    sqlFix: null,
    autoFixable: false,
  },
];

function diagnose(errorMessage) {
  return errorPatterns
    .filter(p => p.pattern.test(errorMessage))
    .map(p => ({ matched: true, pattern: p, confidence: 0.95 }));
}

// ... 输出格式化报告（参见实际项目中的 diagnose.js）
```

### 3.3 自动修复 SQL 生成

```typescript
// 生成表 RLS 修复 SQL
function generateTableRLSFix(tableName: string, userField = 'user_id'): string {
  return `
-- 修复 ${tableName} 表 RLS
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.${tableName};
CREATE POLICY "Allow all for authenticated"
ON public.${tableName} FOR ALL
TO authenticated
USING (${userField} = auth.uid())
WITH CHECK (${userField} = auth.uid());
`.trim();
}

// 生成 Storage RLS 修复 SQL
function generateStorageRLSFix(bucketName: string): string {
  return `
-- 修复 ${bucketName} Storage RLS
DROP POLICY IF EXISTS "Allow upload to ${bucketName}" ON storage.objects;
CREATE POLICY "Allow upload to ${bucketName}"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = '${bucketName}');

-- 确保 bucket 可公开读取
DROP POLICY IF EXISTS "Public read ${bucketName}" ON storage.objects;
CREATE POLICY "Public read ${bucketName}"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = '${bucketName}');

UPDATE storage.buckets SET public = true WHERE id = '${bucketName}';
`.trim();
}
```

## 4. 预检清单

每次 Sprint 交付前，自动检查以下项目：

| 检查项 | 命令/方法 | 自动修复 |
|--------|-----------|----------|
| Supabase 配置 | 检查环境变量 | 否 |
| TypeScript 编译 | `tsc --noEmit` | 否 |
| ESLint | `eslint .` | 部分 |
| 构建成功 | `npm run build` | 否 |
| E2E P0 测试 | `playwright test tests/e2e/auth.spec.ts` | 诊断 |
| Storage Bucket | Supabase API 检查 | 是（创建） |
| RLS 策略 | SQL 检查 | 是（生成 SQL） |

## 5. 错误模式扩展

新项目应根据自身业务扩展错误模式库：

```javascript
// 在 diagnose.js 的 errorPatterns 数组中添加
{
  id: 'custom-error-id',
  pattern: /Your error regex pattern/i,
  category: 'auth|storage|database|ui|network|configuration',
  severity: 'critical|high|medium|low',
  cause: '错误原因描述',
  solution: ['修复步骤1', '修复步骤2'],
  sqlFix: '-- 可选的 SQL 修复',
  autoFixable: true/false,
}
```

## 6. 风险评估

| 自动修复类型 | 风险 | 需确认 | 回滚 |
|-------------|------|--------|------|
| SQL 生成 | 中 | 是 | 删除策略 + 重新创建 |
| 配置提示 | 低 | 否 | 手动修改 |
| 选择器修正 | 低 | 否 | Git revert |

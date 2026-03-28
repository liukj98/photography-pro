# Harness Engineering - 自动化测试与修复规范

## 概述

自动化测试与修复是 Harness 框架的核心能力之一，通过构建自诊断、自修复系统，减少人工干预，提高开发效率和产品质量。

---

## 1. 自动诊断系统 (Auto-Diagnostics)

### 1.1 错误捕获与分类

```typescript
interface ErrorReport {
  id: string;
  timestamp: string;
  category: 'runtime' | 'build' | 'network' | 'auth' | 'database' | 'storage';
  severity: 'critical' | 'error' | 'warning';
  message: string;
  stack?: string;
  context: {
    component?: string;
    hook?: string;
    api?: string;
    userAction?: string;
  };
  environment: {
    url: string;
    userAgent: string;
    supabaseConfig: boolean;
  };
}
```

### 1.2 自动诊断规则

| 错误模式 | 分类 | 可能原因 | 自动修复策略 |
|----------|------|----------|--------------|
| `Email not confirmed` | auth | RLS/确认策略 | 提示关闭 Confirm email |
| `violates row-level security` | database | RLS 策略缺失 | 生成修复 SQL |
| `StorageApiError: RLS` | storage | Storage 策略缺失 | 生成修复 SQL |
| `获取作品失败` | network | 查询语法/权限 | 简化查询/修复策略 |
| `404 Not Found` | network | 资源不存在 | 检查路由/资源 |
| `Network Error` | network | 连接失败 | 检查配置/重试 |

### 1.3 诊断实现

```typescript
// hooks/useAutoDiagnostics.ts
export function useAutoDiagnostics() {
  const diagnose = (error: Error): DiagnosticResult => {
    const message = error.message;
    
    // Pattern matching
    if (message.includes('Email not confirmed')) {
      return {
        category: 'auth',
        cause: 'Supabase Email confirmation is enabled',
        solution: 'Disable "Confirm email" in Supabase Auth settings',
        autoFixable: false,
        sqlFix: null,
      };
    }
    
    if (message.includes('violates row-level security')) {
      if (message.includes('storage')) {
        return {
          category: 'storage',
          cause: 'Storage bucket RLS policy missing',
          solution: 'Add INSERT policy to storage.objects',
          autoFixable: true,
          sqlFix: generateStorageRLSFix(),
        };
      }
      return {
        category: 'database',
        cause: 'Table RLS policy missing or incorrect',
        solution: 'Add proper RLS policies',
        autoFixable: true,
        sqlFix: generateTableRLSFix(),
      };
    }
    
    // ... more patterns
  };
  
  return { diagnose };
}
```

---

## 2. 自动修复系统 (Auto-Repair)

### 2.1 修复策略等级

```typescript
interface RepairStrategy {
  level: 'code' | 'config' | 'database' | 'infrastructure';
  action: string;
  requiresApproval: boolean;
  rollbackPossible: boolean;
  estimatedRisk: 'low' | 'medium' | 'high';
}
```

### 2.2 自动修复示例

**场景 1: Storage RLS 错误**

```
检测: StorageApiError: new row violates row-level security policy
分析: photos bucket 缺少 INSERT 策略
修复:
  1. 生成 SQL: fix-storage-rls.sql
  2. 提示用户执行 SQL
  3. 提供一键修复选项（高风险操作需确认）
```

**场景 2: 数据库查询错误**

```
检测: 获取作品失败
分析: 关联查询 user:users() 需要 users 表 SELECT 权限
修复:
  1. 简化查询（移除关联）
  2. 或添加 users 表 RLS 策略
  3. 自动选择影响最小的方案
```

### 2.3 修复工作流

```
错误发生
    ↓
自动捕获 + 分类
    ↓
尝试自动修复？
    ↓ YES → 评估风险
    ↓            ↓
    ↓      低风险? → 自动应用
    ↓      高风险? → 提示用户
    ↓
    ↓ NO → 生成详细报告
    ↓      提供手动修复指南
    ↓
验证修复
    ↓
成功? → 记录日志
失败? → 升级人工处理
```

---

## 3. 预防性测试 (Preventive Testing)

### 3.1 预检清单 (Pre-flight Checklist)

在每次 Sprint 交付前自动检查：

```typescript
const preflightChecks = [
  {
    name: 'Supabase Configuration',
    check: () => checkSupabaseConfig(),
    autoFix: false,
  },
  {
    name: 'RLS Policies',
    check: () => checkRLSPolicies(),
    autoFix: true,
    generateSQL: true,
  },
  {
    name: 'Storage Buckets',
    check: () => checkStorageBuckets(),
    autoFix: true,
  },
  {
    name: 'TypeScript Types',
    check: () => checkTypeScript(),
    autoFix: false,
  },
  {
    name: 'Build Success',
    check: () => checkBuild(),
    autoFix: false,
  },
];
```

### 3.2 自动化测试矩阵

| 测试类型 | 触发时机 | 自动修复 | 示例 |
|----------|----------|----------|------|
| 单元测试 | 代码变更 | 否 | Jest/Vitest |
| 集成测试 | API 变更 | 部分 | API 契约测试 |
| E2E 测试 | 页面变更 | 否 | Playwright |
| 配置测试 | 环境变更 | 是 | RLS 策略检查 |
| 性能测试 | 构建完成 | 否 | Lighthouse |

---

## 4. 智能提示系统 (Smart Suggestions)

### 4.1 错误上下文感知

```typescript
// 根据错误上下文提供精准建议
const suggestions = {
  'auth/email-not-confirmed': {
    when: '用户注册后无法登录',
    check: 'Supabase Auth > Providers > Email > Confirm email',
    fix: '关闭 Confirm email 选项',
    sql: null,
  },
  'database/rls-violation': {
    when: '插入/更新数据失败',
    check: 'Table RLS policies',
    fix: '添加 INSERT/UPDATE 策略',
    sql: 'generateRLSFix(table, action)',
  },
  'storage/rls-violation': {
    when: '上传文件失败',
    check: 'Storage bucket policies',
    fix: '添加 storage.objects 策略',
    sql: 'generateStorageRLSFix(bucket)',
  },
};
```

### 4.2 一键修复命令

```bash
# 自动检测并修复常见问题
npm run harness:fix

# 具体修复
npm run harness:fix:rls      # 修复 RLS 策略
npm run harness:fix:storage  # 修复 Storage 权限
npm run harness:fix:types    # 修复 TypeScript 类型
```

---

## 5. 实施建议

### 5.1 集成到 Sprint 流程

```
Sprint 开发
    ↓
自动诊断运行（持续）
    ↓
发现问题 → 自动分类 → 尝试修复
    ↓
修复成功? → 记录日志
修复失败? → 通知开发者
    ↓
Sprint 结束评估
    ↓
生成修复报告
    ↓
更新知识库（错误模式库）
```

### 5.2 风险评估

| 自动修复类型 | 风险等级 | 需要确认 | 回滚方案 |
|--------------|----------|----------|----------|
| 代码格式化 | 低 | 否 | Git revert |
| 类型修复 | 低 | 否 | Git revert |
| SQL 生成 | 中 | 是 | 备份策略 |
| 配置修改 | 高 | 是 | 配置版本控制 |
| 数据库迁移 | 高 | 是 | 迁移回滚脚本 |

### 5.3 知识库维护

```yaml
# .harness/knowledge-base/errors.yml
errors:
  - pattern: "Email not confirmed"
    category: auth
    solution: 
      type: config
      action: disable_email_confirmation
      steps:
        - 打开 Supabase Dashboard
        - 进入 Authentication > Providers
        - 关闭 "Confirm email"
    first_seen: "2026-03-28"
    frequency: 3
    
  - pattern: "violates row-level security"
    category: rls
    solution:
      type: sql
      generate: generate_rls_fix
      depends_on: [table_name, action_type]
    first_seen: "2026-03-28"
    frequency: 5
```

---

## 6. 工具函数

```typescript
// lib/harness-auto-fix.ts

export const autoFix = {
  // 生成 RLS 修复 SQL
  generateRLSFix: (table: string, action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE') => {
    return `
DROP POLICY IF EXISTS "Allow ${action.toLowerCase()} for authenticated" ON public.${table};
CREATE POLICY "Allow ${action.toLowerCase()} for authenticated" 
ON public.${table} FOR ${action} 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
    `.trim();
  },

  // 生成 Storage RLS 修复 SQL
  generateStorageRLSFix: (bucket: string) => {
    return `
DROP POLICY IF EXISTS "Allow upload to ${bucket}" ON storage.objects;
CREATE POLICY "Allow upload to ${bucket}" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = '${bucket}');
    `.trim();
  },

  // 诊断错误
  diagnose: (error: Error): DiagnosticResult => {
    // 实现错误模式匹配
  },

  // 验证修复
  verify: async (fix: RepairAction): Promise<boolean> => {
    // 验证修复是否成功
  },
};
```

---

## 附录: 更新 Sprint 评估报告

每次 Sprint 评估应包含：

```markdown
## 自动修复统计

| 错误类型 | 发生次数 | 自动修复成功 | 需要人工干预 |
|----------|----------|--------------|--------------|
| RLS 策略 | 5 | 4 | 1 |
| 类型错误 | 3 | 3 | 0 |
| 配置错误 | 2 | 1 | 1 |

## 新增错误模式
- Storage RLS violation（已加入知识库）
- 关联查询权限问题（已加入知识库）

## 改进建议
- 添加 Storage 自动修复脚本
- 优化关联查询的 RLS 策略生成
```


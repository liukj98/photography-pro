/**
 * Playwright 测试错误诊断助手
 * 自动识别常见错误并提供修复建议
 */

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
  
  // 邮箱未确认错误
  if (errorMessage.includes('Email not confirmed') || errorMessage.includes('not confirmed')) {
    return {
      category: 'auth',
      pattern: 'email-not-confirmed',
      message: errorMessage,
      cause: 'Supabase 邮箱验证功能已启用',
      fix: `
1. 打开 Supabase Dashboard
2. 进入 Authentication > Providers
3. 找到 Email 提供商
4. 关闭 "Confirm email" 开关`,
      autoFixable: false,
    };
  }
  
  // Storage RLS 错误
  if (errorMessage.includes('StorageApiError') && errorMessage.includes('violates row-level security')) {
    return {
      category: 'storage',
      pattern: 'storage-rls',
      message: errorMessage,
      cause: 'Storage bucket 缺少 INSERT 权限策略',
      fix: '执行 SQL 修复 Storage RLS 策略',
      sqlFix: `-- 修复 Storage RLS
DROP POLICY IF EXISTS "Allow upload to photos" ON storage.objects;
CREATE POLICY "Allow upload to photos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'photos');

UPDATE storage.buckets SET public = true WHERE id = 'photos';`,
      autoFixable: true,
    };
  }
  
  // Database RLS 错误
  if (errorMessage.includes('violates row-level security')) {
    return {
      category: 'database',
      pattern: 'database-rls',
      message: errorMessage,
      cause: '数据表缺少 INSERT/UPDATE 权限策略',
      fix: '执行 SQL 修复表 RLS 策略',
      sqlFix: `-- 修复 photos 表 RLS
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.photos;
CREATE POLICY "Allow all for authenticated" 
ON public.photos FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);`,
      autoFixable: true,
    };
  }
  
  // 超时错误
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return {
      category: 'network',
      pattern: 'timeout',
      message: errorMessage,
      cause: '操作超时，可能是网络慢或服务器响应慢',
      fix: '增加超时时间或检查服务器状态',
      autoFixable: false,
    };
  }
  
  // 元素未找到
  if (errorMessage.includes('locator') && errorMessage.includes('not found')) {
    return {
      category: 'ui',
      pattern: 'element-not-found',
      message: errorMessage,
      cause: '页面元素未找到，可能是选择器错误或页面未加载完成',
      fix: '检查选择器是否正确，增加等待时间',
      autoFixable: false,
    };
  }
  
  // 默认未知错误
  return {
    category: 'unknown',
    pattern: 'unknown',
    message: errorMessage,
    cause: '未知错误',
    fix: '查看详细错误日志，联系开发者',
    autoFixable: false,
  };
}

export function generateFix(diagnosis: Diagnosis): string {
  if (diagnosis.sqlFix) {
    return diagnosis.sqlFix;
  }
  return diagnosis.fix;
}

export function printDiagnosis(diagnosis: Diagnosis): void {
  console.log('\n========================================');
  console.log('      🔍 Harness 自动诊断');
  console.log('========================================\n');
  
  const categoryEmoji = {
    auth: '🔐',
    storage: '💾',
    database: '🗄️',
    ui: '🖼️',
    network: '🌐',
    unknown: '❓',
  };
  
  console.log(`${categoryEmoji[diagnosis.category]} 分类: ${diagnosis.category}`);
  console.log(`📋 模式: ${diagnosis.pattern}`);
  console.log(`💥 原因: ${diagnosis.cause}`);
  console.log('\n💡 解决方案:');
  console.log(diagnosis.fix);
  
  if (diagnosis.sqlFix) {
    console.log('\n🔧 SQL 修复:');
    console.log('```sql');
    console.log(diagnosis.sqlFix);
    console.log('```');
  }
  
  console.log(`\n✅ 可自动修复: ${diagnosis.autoFixable ? '是' : '否'}`);
  console.log('========================================\n');
}

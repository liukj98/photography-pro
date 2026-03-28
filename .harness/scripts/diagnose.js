#!/usr/bin/env node
/**
 * Harness 自动诊断脚本
 * 自动检测常见问题并提供修复建议
 */

// ES Module 导入
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 错误模式库
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
      '3. 找到 Email 提供商',
      '4. 关闭 "Confirm email" 开关',
    ],
    sqlFix: null,
    autoFixable: false,
  },
  {
    id: 'storage-rls-violation',
    pattern: /StorageApiError.*violates row-level security/i,
    category: 'storage',
    severity: 'high',
    cause: 'Storage bucket 缺少 INSERT 权限策略',
    solution: [
      '在 Supabase SQL Editor 执行以下 SQL：',
    ],
    sqlFix: `-- 修复 Storage RLS
DROP POLICY IF EXISTS "Allow upload to photos" ON storage.objects;
CREATE POLICY "Allow upload to photos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'photos');

-- 确保 bucket 存在且公开
UPDATE storage.buckets 
SET public = true 
WHERE id = 'photos';`,
    autoFixable: true,
  },
  {
    id: 'database-rls-violation',
    pattern: /new row violates row-level security policy/i,
    category: 'database',
    severity: 'high',
    cause: '数据表缺少 INSERT/UPDATE 权限策略',
    solution: [
      '在 Supabase SQL Editor 执行以下 SQL：',
    ],
    sqlFix: `-- 修复 photos 表 RLS
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.photos;
CREATE POLICY "Allow all for authenticated" 
ON public.photos FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);`,
    autoFixable: true,
  },
  {
    id: 'supabase-config-missing',
    pattern: /supabaseUrl is required/i,
    category: 'configuration',
    severity: 'critical',
    cause: 'Supabase 环境变量未配置',
    solution: [
      '1. 创建 .env 文件',
      '2. 添加以下内容：',
      '   VITE_SUPABASE_URL=your_project_url',
      '   VITE_SUPABASE_ANON_KEY=your_anon_key',
      '3. 重启开发服务器',
    ],
    sqlFix: null,
    autoFixable: false,
  },
];

// 诊断函数
function diagnose(errorMessage) {
  const results = [];
  
  for (const pattern of errorPatterns) {
    if (pattern.pattern.test(errorMessage)) {
      results.push({
        matched: true,
        pattern: pattern,
        confidence: 0.95,
      });
    }
  }
  
  return results;
}

// 生成修复报告
function generateReport(diagnoses) {
  if (diagnoses.length === 0) {
    return {
      found: false,
      message: '未匹配到已知的错误模式，请检查详细错误日志。',
    };
  }
  
  const report = {
    found: true,
    issues: diagnoses.map((d) => ({
      id: d.pattern.id,
      category: d.pattern.category,
      severity: d.pattern.severity,
      cause: d.pattern.cause,
      solution: d.pattern.solution,
      sqlFix: d.pattern.sqlFix,
      autoFixable: d.pattern.autoFixable,
    })),
  };
  
  return report;
}

// 输出格式化报告
function printReport(report) {
  console.log('\n========================================');
  console.log('      Harness 自动诊断报告');
  console.log('========================================\n');
  
  if (!report.found) {
    console.log('❌ ' + report.message);
    console.log('\n建议：');
    console.log('1. 检查浏览器控制台完整错误信息');
    console.log('2. 查看网络请求的响应详情');
    console.log('3. 联系开发者或查阅文档');
    return;
  }
  
  report.issues.forEach((issue, index) => {
    const severityEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    }[issue.severity];
    
    console.log(`${severityEmoji} 问题 ${index + 1}: ${issue.id}`);
    console.log(`   分类: ${issue.category}`);
    console.log(`   严重程度: ${issue.severity}`);
    console.log(`   原因: ${issue.cause}`);
    console.log('\n   💡 解决方案:');
    issue.solution.forEach((step) => {
      console.log(`      ${step}`);
    });
    
    if (issue.sqlFix) {
      console.log('\n   🔧 自动修复 SQL:');
      console.log('   ```sql');
      console.log('   ' + issue.sqlFix.split('\n').join('\n   '));
      console.log('   ```');
    }
    
    console.log('\n   ✅ 可自动修复:', issue.autoFixable ? '是' : '否');
    console.log('----------------------------------------\n');
  });
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  // 从命令行参数或 stdin 读取错误信息
  let errorMessage = '';
  
  if (args.length > 0) {
    errorMessage = args.join(' ');
  } else {
    // 尝试读取示例错误
    console.log('使用方法:');
    console.log('  npm run harness:diagnose "错误信息"');
    console.log('\n示例:');
    console.log('  npm run harness:diagnose "Email not confirmed"');
    console.log('  npm run harness:diagnose "new row violates row-level security policy"');
    
    // 演示模式
    console.log('\n========================================');
    console.log('           演示模式');
    console.log('========================================\n');
    
    const demoErrors = [
      'Email not confirmed',
      'StorageApiError: new row violates row-level security policy',
      'new row violates row-level security policy for table "photos"',
      'supabaseUrl is required',
    ];
    
    demoErrors.forEach((error) => {
      console.log(`\n测试错误: "${error}"`);
      const diagnoses = diagnose(error);
      const report = generateReport(diagnoses);
      printReport(report);
    });
    
    return;
  }
  
  // 诊断实际错误
  const diagnoses = diagnose(errorMessage);
  const report = generateReport(diagnoses);
  printReport(report);
  
  // 如果可自动修复，提供选项
  const autoFixableIssues = report.issues?.filter((i) => i.autoFixable && i.sqlFix);
  if (autoFixableIssues && autoFixableIssues.length > 0) {
    console.log('\n📝 你可以将上述 SQL 复制到 Supabase SQL Editor 执行。');
    console.log('   或者运行: npm run harness:fix\n');
  }
}

main();

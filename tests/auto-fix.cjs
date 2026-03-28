#!/usr/bin/env node
/**
 * Harness 自动化测试与修复脚本
 * 运行 Playwright 测试，诊断错误，尝试自动修复
 */

const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const { join } = require('path');

// 错误模式匹配
const errorPatterns = [
  {
    pattern: /Email not confirmed/i,
    category: 'auth',
    name: 'email-not-confirmed',
    cause: 'Supabase 邮箱验证功能已启用',
    fix: '请在 Supabase Dashboard 中关闭 "Confirm email" 选项',
    sqlFix: null,
    autoFixable: false,
  },
  {
    pattern: /StorageApiError.*violates row-level security/i,
    category: 'storage',
    name: 'storage-rls',
    cause: 'Storage bucket 缺少 INSERT 权限策略',
    fix: '执行 SQL 修复 Storage RLS',
    sqlFix: `-- 修复 Storage RLS
DROP POLICY IF EXISTS "Allow upload to photos" ON storage.objects;
CREATE POLICY "Allow upload to photos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'photos');

UPDATE storage.buckets SET public = true WHERE id = 'photos';`,
    autoFixable: true,
  },
  {
    pattern: /new row violates row-level security policy/i,
    category: 'database',
    name: 'database-rls',
    cause: '数据表缺少 INSERT/UPDATE 权限策略',
    fix: '执行 SQL 修复表 RLS',
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
    pattern: /supabaseUrl is required/i,
    category: 'config',
    name: 'missing-config',
    cause: 'Supabase 环境变量未配置',
    fix: '请创建 .env 文件并配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY',
    sqlFix: null,
    autoFixable: false,
  },
];

function diagnoseError(errorMessage) {
  for (const pattern of errorPatterns) {
    if (pattern.pattern.test(errorMessage)) {
      return {
        category: pattern.category,
        pattern: pattern.name,
        cause: pattern.cause,
        fix: pattern.fix,
        sqlFix: pattern.sqlFix,
        autoFixable: pattern.autoFixable,
      };
    }
  }
  return null;
}

function printReport(results) {
  console.log('\n========================================');
  console.log('      🧪 Harness 自动化测试报告');
  console.log('========================================\n');

  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📊 总计: ${results.length}\n`);

  if (failed > 0) {
    console.log('========================================');
    console.log('      🔍 失败测试诊断');
    console.log('========================================\n');

    results
      .filter((r) => r.status === 'failed')
      .forEach((result, index) => {
        console.log(`\n❌ 测试 ${index + 1}: ${result.test}`);
        if (result.diagnosis) {
          const d = result.diagnosis;
          console.log(`   分类: ${d.category}`);
          console.log(`   原因: ${d.cause}`);
          console.log(`   解决方案: ${d.fix}`);

          if (d.sqlFix) {
            console.log(`\n   🔧 SQL 修复:`);
            console.log('   ```sql');
            console.log('   ' + d.sqlFix.split('\n').join('\n   '));
            console.log('   ```');
          }

          console.log(`   ✅ 可自动修复: ${d.autoFixable ? '是' : '否'}`);
        } else if (result.error) {
          console.log(`   错误: ${result.error.substring(0, 200)}...`);
        }
      });
  }

  console.log('\n========================================\n');
}

function runTests() {
  console.log('🚀 启动 Playwright 测试...\n');

  const results = [];

  try {
    // 运行测试
    const output = execSync('npx playwright test --reporter=list 2>&1', {
      encoding: 'utf-8',
      cwd: process.cwd(),
      timeout: 120000,
    });

    console.log(output);

    // 简单解析：查找失败标记
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('✓') || line.includes('✔')) {
        const match = line.match(/✓\s+(.+)/) || line.match(/✔\s+(.+)/);
        if (match) {
          results.push({ test: match[1].trim(), status: 'passed' });
        }
      } else if (line.includes('✘') || line.includes('✗') || line.includes('×')) {
        const match = line.match(/[✘✗×]\s+(.+)/);
        if (match) {
          results.push({
            test: match[1].trim(),
            status: 'failed',
            error: line,
          });
        }
      }
    }

    // 如果没有解析到结果，检查是否有成功标记
    if (results.length === 0 && output.includes('passed')) {
      results.push({ test: '测试套件', status: 'passed' });
    }
  } catch (error) {
    // 测试失败时
    const output = error.stdout || error.message || '';
    console.log(output);

    // 尝试诊断错误
    const diagnosis = diagnoseError(output);
    if (diagnosis) {
      results.push({
        test: '测试套件',
        status: 'failed',
        error: output,
        diagnosis,
      });
    } else {
      results.push({
        test: '测试套件',
        status: 'failed',
        error: output,
      });
    }
  }

  return results;
}

function generateSQLFix(results) {
  const fixes = [];

  results
    .filter((r) => r.status === 'failed' && r.diagnosis?.sqlFix)
    .forEach((result) => {
      if (result.diagnosis?.sqlFix && !fixes.includes(result.diagnosis.sqlFix)) {
        fixes.push(result.diagnosis.sqlFix);
      }
    });

  if (fixes.length === 0) return '';

  return `-- Harness 自动生成的 SQL 修复
-- 生成时间: ${new Date().toISOString()}

${fixes.join('\n\n')}
`;
}

function main() {
  console.log('🎯 Harness 自动化测试与修复系统\n');

  // 运行测试
  const results = runTests();

  // 打印报告
  printReport(results);

  // 生成 SQL 修复文件
  const sqlFix = generateSQLFix(results);
  if (sqlFix) {
    const fixFile = join(process.cwd(), 'supabase', 'auto-fix.sql');
    writeFileSync(fixFile, sqlFix);
    console.log(`📝 SQL 修复文件已生成: ${fixFile}`);
    console.log('   请在 Supabase SQL Editor 中执行此文件\n');
  }

  // 总结
  const failedCount = results.filter((r) => r.status === 'failed').length;
  const autoFixableCount = results.filter(
    (r) => r.status === 'failed' && r.diagnosis?.autoFixable
  ).length;

  if (failedCount === 0) {
    console.log('🎉 所有测试通过！无需修复。\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${failedCount} 个测试失败`);
    if (autoFixableCount > 0) {
      console.log(`🔧 ${autoFixableCount} 个问题可通过执行 SQL 修复`);
      console.log('\n💡 执行以下命令应用自动修复:');
      console.log('   cat supabase/auto-fix.sql | pbcopy');
      console.log('   然后粘贴到 Supabase SQL Editor 执行\n');
    }
    process.exit(1);
  }
}

main();

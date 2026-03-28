#!/usr/bin/env node

/**
 * 自动检查 + 提交脚本
 * 
 * 流程:
 * 1. TypeScript 类型检查 (tsc -b)
 * 2. E2E 测试 (playwright test)
 * 3. 如果全部通过且有变更 → 自动 git add + commit
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function run(cmd, label) {
  console.log(`\n🔍 ${label}...`);
  try {
    execSync(cmd, {
      cwd: ROOT,
      stdio: 'inherit',
      timeout: 120000,
    });
    console.log(`✅ ${label} 通过`);
    return true;
  } catch (err) {
    console.log(`❌ ${label} 失败`);
    return false;
  }
}

function getStatus() {
  try {
    const result = execSync('git status --porcelain', {
      cwd: ROOT,
      encoding: 'utf-8',
    });
    return result.trim();
  } catch {
    return '';
  }
}

function getCurrentBranch() {
  return execSync('git rev-parse --abbrev-ref HEAD', {
    cwd: ROOT,
    encoding: 'utf-8',
  }).trim();
}

function getStagedAndUnstaged() {
  const status = getStatus();
  if (!status) return [];

  const lines = status.split('\n').filter(Boolean);
  return lines.map((line) => {
    const statusCode = line.substring(0, 2);
    const filePath = line.substring(3);
    return { statusCode, filePath };
  });
}

function generateCommitMessage(files) {
  const timestamp = new Date().toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Categorize changes
  const categories = {
    feat: [],
    fix: [],
    refactor: [],
    style: [],
    docs: [],
    test: [],
    chore: [],
  };

  files.forEach(({ statusCode, filePath }) => {
    // Skip certain files
    if (filePath.startsWith('playwright-report/') || filePath.endsWith('lock')) return;

    if (filePath.startsWith('test')) {
      categories.test.push(filePath);
    } else if (filePath.startsWith('src/components/ui/')) {
      categories.feat.push(filePath);
    } else if (filePath.startsWith('src/pages/')) {
      categories.feat.push(filePath);
    } else if (filePath.startsWith('src/hooks/')) {
      categories.feat.push(filePath);
    } else if (filePath.startsWith('src/stores/')) {
      categories.refactor.push(filePath);
    } else if (filePath.startsWith('.harness/output/')) {
      categories.docs.push(filePath);
    } else if (filePath.startsWith('supabase/')) {
      categories.chore.push(filePath);
    } else {
      categories.chore.push(filePath);
    }
  });

  // Find dominant category
  let dominantType = 'chore';
  let maxCount = 0;
  for (const [type, items] of Object.entries(categories)) {
    if (items.length > maxCount) {
      maxCount = items.length;
      dominantType = type;
    }
  }

  // Generate summary
  const summary = files
    .map((f) => f.filePath)
    .filter((p) => !p.startsWith('playwright-report') && !p.endsWith('lock'))
    .slice(0, 5)
    .map((p) => {
      const parts = p.split('/');
      return parts.length > 1 ? parts[parts.length - 2] + '/' + parts[parts.length - 1] : parts[0];
    })
    .join(', ');

  const typeLabels = {
    feat: 'feat',
    fix: 'fix',
    refactor: 'refactor',
    style: 'style',
    docs: 'docs',
    test: 'test',
    chore: 'chore',
  };

  const msg = `${typeLabels[dominantType]}: ${summary} [auto ${timestamp}]`;
  return msg.length > 72 ? msg.substring(0, 69) + '...' : msg;
}

async function main() {
  console.log('═══════════════════════════════════');
  console.log('  🚀 自动检查 & 提交');
  console.log('═══════════════════════════════════');

  // Step 1: Type check
  const typeCheck = run('npx tsc -b', 'TypeScript 类型检查');
  if (!typeCheck) {
    console.log('\n⏹️  类型检查失败，跳过提交');
    process.exit(1);
  }

  // Step 2: E2E tests
  const tests = run('npx playwright test', 'E2E 测试');
  if (!tests) {
    console.log('\n⏹️  测试失败，跳过提交');
    process.exit(1);
  }

  // Step 3: Check for changes
  const status = getStatus();
  if (!status) {
    console.log('\n📋 没有待提交的变更');
    process.exit(0);
  }

  const files = getStagedAndUnstaged();
  const changeCount = files.length;

  console.log(`\n📋 发现 ${changeCount} 个文件变更`);

  // Step 4: Auto commit
  const commitMsg = generateCommitMessage(files);
  console.log(`📝 提交信息: ${commitMsg}`);

  try {
    execSync(`git add -A`, { cwd: ROOT, stdio: 'inherit' });
    execSync(`git commit -m "${commitMsg}"`, { cwd: ROOT, stdio: 'inherit' });
    console.log(`\n✅ 自动提交成功！`);
  } catch (err) {
    console.log('\n❌ 提交失败');
    process.exit(1);
  }
}

main();

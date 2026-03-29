#!/usr/bin/env node
/**
 * To C 测试数据填充模板
 * 使用方法: npm run seed
 *
 * 使用前修改：
 * 1. SUPABASE_URL 和 SUPABASE_SERVICE_KEY
 * 2. testUsers 中的测试账号
 * 3. sampleData 中的示例内容
 */

import { createClient } from '@supabase/supabase-js';

// ============ 配置 ============
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = 'your-service-role-key'; // 需要使用 service_role key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============ 测试用户 ============
const testUsers = [
  { email: 'test1@example.com', password: 'Test123456!', username: 'user_test1', meta: '普通用户' },
  { email: 'test2@example.com', password: 'Test123456!', username: 'user_test2', meta: '互动测试用户' },
  { email: 'creator@example.com', password: 'Test123456!', username: 'creator_demo', meta: '内容创作者' },
];

// ============ 主函数 ============
async function seed() {
  console.log('🚀 开始填充测试数据...\n');

  try {
    // 1. 创建测试用户
    console.log('📝 创建测试用户...');
    for (const user of testUsers) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // 自动确认邮箱
        user_metadata: { username: user.username },
      });
      if (error) {
        console.log(`  ⚠️ ${user.email}: ${error.message}`);
      } else {
        console.log(`  ✅ ${user.email} (${user.meta})`);
      }
    }

    // 2. 创建用户资料
    // TODO: 根据实际 users 表结构填写
    // const { data: authUsers } = await supabase.auth.admin.listUsers();

    // 3. 填充示例内容
    // TODO: 根据实际业务表填写
    // console.log('\n📝 填充示例内容...');

    console.log('\n✅ 测试数据填充完成！\n');
    console.log('📋 测试账号：');
    console.log('┌─────────────────┬─────────────────────┬───────────────┐');
    console.log('│ 用户名           │ 邮箱                 │ 密码           │');
    console.log('├─────────────────┼─────────────────────┼───────────────┤');
    testUsers.forEach(u => {
      console.log(`│ ${u.username.padEnd(16)}│ ${u.email.padEnd(20)}│ Test123456!   │`);
    });
    console.log('└─────────────────┴─────────────────────┴───────────────┘');
  } catch (error) {
    console.error('❌ 填充失败:', error.message);
  }
}

seed();

/**
 * 开发环境数据填充脚本
 * 用于批量创建测试用户和上传测试图片
 * 
 * 使用方法:
 * 1. 确保 .env.development 已配置正确的 Supabase 密钥
 * 2. 运行: node scripts/seed-data.js
 * 
 * 注意: 此脚本需要 @supabase/supabase-js 包
 * npm install @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 读取开发环境配置
const envPath = path.join(process.cwd(), '.env.development');
const envContent = fs.readFileSync(envPath, 'utf-8');

const supabaseUrlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

const supabaseUrl = supabaseUrlMatch ? supabaseUrlMatch[1].trim() : null;
const supabaseKey = supabaseKeyMatch ? supabaseKeyMatch[1].trim() : null;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 请在 .env.development 中配置 Supabase 密钥');
  console.error('   需要 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 测试用户配置
const TEST_USERS = [
  { username: 'test_user1', email: 'test1@example.com', password: 'Test123456!' },
  { username: 'test_user2', email: 'test2@example.com', password: 'Test123456!' },
  { username: 'test_user3', email: 'test3@example.com', password: 'Test123456!' },
  { username: 'photographer_a', email: 'photo@example.com', password: 'Test123456!' },
  { username: 'artist_demo', email: 'artist@example.com', password: 'Test123456!' },
];

// 测试图片标题和描述
const PHOTO_TEMPLATES = [
  { title: '城市夜景', description: '繁华都市的霓虹灯光', category: 'street' },
  { title: '山间日出', description: '清晨的第一缕阳光', category: 'landscape' },
  { title: '人像写真', description: '自然光下的人物肖像', category: 'portrait' },
  { title: '建筑几何', description: '现代建筑的线条之美', category: 'architecture' },
  { title: '自然风光', description: '大自然的壮丽景色', category: 'nature' },
  { title: '街头随拍', description: '记录城市的日常瞬间', category: 'street' },
  { title: '微距世界', description: '细节中的美', category: 'nature' },
  { title: '日落余晖', description: '黄昏时分的温暖色调', category: 'landscape' },
];

// 测试用的 EXIF 数据
const EXIF_TEMPLATES = [
  { camera: 'Sony A7R IV', lens: 'FE 24-70mm f/2.8', aperture: 'f/2.8', shutter: '1/125s', iso: 400, focal_length: '50mm' },
  { camera: 'Canon EOS R5', lens: 'RF 50mm f/1.2', aperture: 'f/1.4', shutter: '1/250s', iso: 200, focal_length: '50mm' },
  { camera: 'Nikon Z8', lens: 'NIKKOR Z 24-70mm f/2.8', aperture: 'f/8', shutter: '1/60s', iso: 100, focal_length: '24mm' },
  { camera: 'Fujifilm X-T5', lens: 'XF 35mm f/1.4', aperture: 'f/2', shutter: '1/500s', iso: 800, focal_length: '35mm' },
];

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取随机图片 URL（使用 picsum.photos 提供稳定的测试图片）
 */
function getRandomImageUrl(category, index) {
  const id = 100 + index;
  return `https://picsum.photos/seed/${category}${id}/1200/800`;
}

/**
 * 下载图片
 */
async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.blob();
  } catch (error) {
    console.error('   ❌ 下载失败:', error.message);
    return null;
  }
}

/**
 * 创建测试用户
 */
async function createUser(userData) {
  try {
    // 1. 尝试注册用户
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          username: userData.username,
        },
      },
    });

    if (signUpError) {
      // 如果用户已存在，尝试登录
      if (signUpError.message.includes('already registered') || 
          signUpError.message.includes('already exists')) {
        console.log(`   ℹ️  用户已存在，尝试登录...`);
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password,
        });
        
        if (signInError) {
          console.error(`   ❌ 登录失败:`, signInError.message);
          return null;
        }
        
        console.log(`   ✅ 已登录现有用户`);
        return signInData.user?.id || null;
      }
      
      console.error(`   ❌ 创建失败:`, signUpError.message);
      return null;
    }

    if (!authData.user) {
      console.error(`   ❌ 无用户数据返回`);
      return null;
    }

    console.log(`   ✅ 新用户创建成功`);
    return authData.user.id;
  } catch (error) {
    console.error(`   ❌ 错误:`, error.message);
    return null;
  }
}

/**
 * 上传图片到 Storage
 */
async function uploadPhoto(userId, imageBlob, index) {
  try {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
    
    // 上传原图
    const originalPath = `${userId}/originals/${uniqueName}`;
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(originalPath, imageBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('   ❌ 上传失败:', uploadError.message);
      return null;
    }

    // 获取原图 URL
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(originalPath);

    // 上传缩略图（使用相同图片简化）
    const thumbnailPath = `${userId}/thumbnails/thumb_${uniqueName}`;
    await supabase.storage
      .from('photos')
      .upload(thumbnailPath, imageBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });

    const { data: thumbUrlData } = supabase.storage.from('photos').getPublicUrl(thumbnailPath);

    return {
      url: urlData.publicUrl,
      thumbnailUrl: thumbUrlData.publicUrl,
    };
  } catch (error) {
    console.error('   ❌ 上传错误:', error.message);
    return null;
  }
}

/**
 * 创建照片记录
 */
async function createPhotoRecord(userId, photoData, imageUrls) {
  try {
    const exif = EXIF_TEMPLATES[Math.floor(Math.random() * EXIF_TEMPLATES.length)];
    const tags = [photoData.category, 'test', 'demo'];

    const { error } = await supabase.from('photos').insert({
      user_id: userId,
      title: photoData.title,
      description: photoData.description,
      image_url: imageUrls.url,
      thumbnail_url: imageUrls.thumbnailUrl,
      category: photoData.category,
      tags,
      exif_data: exif,
      views_count: Math.floor(Math.random() * 1000),
      likes_count: Math.floor(Math.random() * 100),
      is_public: true,
    });

    if (error) {
      console.error('   ❌ 创建记录失败:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('   ❌ 错误:', error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function seedData() {
  console.log('🚀 开始填充测试数据...\n');

  for (let i = 0; i < TEST_USERS.length; i++) {
    const userData = TEST_USERS[i];
    console.log(`\n👤 [${i + 1}/${TEST_USERS.length}] ${userData.username} (${userData.email})`);
    
    // 创建/登录用户
    const userId = await createUser(userData);
    if (!userId) {
      console.log(`   ⏭️  跳过此用户`);
      continue;
    }

    // 为每个用户上传 3-5 张照片
    const photoCount = 3 + Math.floor(Math.random() * 3);
    console.log(`   📸 计划上传 ${photoCount} 张照片`);

    for (let j = 0; j < photoCount; j++) {
      const template = PHOTO_TEMPLATES[Math.floor(Math.random() * PHOTO_TEMPLATES.length)];
      const imageUrl = getRandomImageUrl(template.category, j + i * 10);
      
      process.stdout.write(`   [${j + 1}/${photoCount}] ${template.title}... `);
      
      const imageBlob = await downloadImage(imageUrl);
      if (!imageBlob) {
        console.log('❌ 下载失败');
        continue;
      }

      const imageUrls = await uploadPhoto(userId, imageBlob, j);
      if (!imageUrls) {
        console.log('❌ 上传失败');
        continue;
      }

      const success = await createPhotoRecord(userId, template, imageUrls);
      console.log(success ? '✅' : '❌ 记录失败');

      // 延迟 300ms 避免请求过快
      await delay(300);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✨ 测试数据填充完成！');
  console.log('='.repeat(50));
  console.log('\n📋 测试账号列表:');
  console.log('-'.repeat(50));
  TEST_USERS.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.username}`);
    console.log(`     邮箱: ${u.email}`);
    console.log(`     密码: ${u.password}`);
    console.log('');
  });
  console.log('-'.repeat(50));
  console.log('\n💡 提示: 开发环境已关闭邮箱验证，可直接登录');
  console.log('   运行 npm run dev 后使用以上账号测试');
}

// 运行脚本
seedData().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});

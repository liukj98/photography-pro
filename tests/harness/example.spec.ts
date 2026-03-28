// Harness 自动化测试示例
// 使用 Playwright Adapter 进行 E2E 测试

import { test, expect } from '@playwright/test';
import { PlaywrightAdapter } from '../../.harness/adapters/playwright.adapter';

test.describe('摄影平台核心功能', () => {
  test('用户注册流程', async ({ page }) => {
    // 导航到注册页面
    await page.goto('/register');
    
    // 填写注册表单
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!');
    await page.check('input[type="checkbox"]');
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 验证注册成功（跳转首页或显示成功消息）
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('用户登录流程', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    // 验证登录成功
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=欢迎回来')).toBeVisible();
  });

  test('图片上传功能', async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    // 进入上传页面
    await page.goto('/upload');
    
    // 上传图片
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-photo.jpg');
    
    // 填写信息
    await page.fill('input[placeholder="给你的作品起个名字"]', '测试作品');
    await page.fill('textarea', '这是一张测试照片');
    
    // 提交
    await page.click('button:has-text("发布作品")');
    
    // 验证上传成功
    await expect(page.locator('text=作品发布成功')).toBeVisible();
  });

  test('浏览作品列表', async ({ page }) => {
    await page.goto('/explore');
    
    // 验证页面加载
    await expect(page.locator('h1:has-text("探索作品")')).toBeVisible();
    
    // 验证作品卡片存在
    const cards = await page.locator('[data-testid="photo-card"]').count();
    expect(cards).toBeGreaterThan(0);
  });
});

// 使用 Harness Automation Adapter 的高级测试示例
test.describe('Harness 自动化测试示例', () => {
  test('自动化诊断和修复演示', async ({ page }) => {
    const adapter = new PlaywrightAdapter();
    
    try {
      // 执行可能失败的操作
      await page.goto('/api/protected-endpoint');
      
      // 如果失败，使用 Adapter 诊断
    } catch (error) {
      if (error instanceof Error) {
        const diagnosis = adapter.diagnose(error);
        console.log('错误诊断:', diagnosis);
        
        // 输出修复建议
        diagnosis.suggestedFixes.forEach((fix, index) => {
          console.log(`修复建议 ${index + 1}:`, fix.description);
          console.log('操作:', fix.action);
        });
      }
    }
  });
});

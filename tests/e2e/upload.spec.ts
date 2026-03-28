import { test, expect } from '@playwright/test';
import { diagnoseError } from '../helpers/diagnose';

test.describe('上传功能', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    try {
      await page.goto('/login');
      
      // 尝试使用测试账号登录 - 使用 placeholder 选择
      await page.fill('input[placeholder="your@email.com"]', 'test@example.com');
      await page.locator('input[type="password"]').fill('TestPass123!');
      await page.click('button[type="submit"]');
      
      // 等待登录完成
      await page.waitForURL('/', { timeout: 3000 }).catch(async () => {
        // 如果登录失败，可能是用户不存在，先注册
        await page.goto('/register');
        await page.fill('input[placeholder="设置你的用户名"]', 'testuser');
        await page.fill('input[placeholder="your@email.com"]', 'test@example.com');
        const passwordInputs = page.locator('input[type="password"]');
        await passwordInputs.nth(0).fill('TestPass123!');
        await passwordInputs.nth(1).fill('TestPass123!');
        await page.check('input[type="checkbox"]');
        await page.click('button[type="submit"]');
        await page.waitForURL('/', { timeout: 5000 });
      });
    } catch (error) {
      console.log('登录/注册失败，继续测试:', error);
    }
  });

  test('上传页面可访问', async ({ page }) => {
    try {
      await page.goto('/upload');
      await expect(page.locator('h1')).toContainText('上传作品');
      await expect(page.locator('text=点击或拖拽上传图片')).toBeVisible();
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('诊断结果:', diagnosis);
      throw error;
    }
  });

  test('上传图片流程', async ({ page }) => {
    try {
      await page.goto('/upload');
      
      // 等待上传区域加载
      await page.waitForSelector('input[type="file"]');
      
      // 选择文件
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
      
      // 等待预览加载
      await page.waitForSelector('img[alt="Preview"]', { timeout: 5000 });
      
      // 填写表单
      await page.fill('input[placeholder="给你的作品起个名字"]', '测试作品');
      await page.fill('textarea', '这是一张测试照片');
      
      // 提交
      await page.click('button:has-text("发布作品")');
      
      // 等待成功提示或跳转
      await expect(page.locator('text=作品发布成功').or(page.locator('text=发布中...'))).toBeVisible();
      
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('❌ 上传测试失败');
      console.log('诊断:', diagnosis);
      
      if (diagnosis.category === 'storage') {
        console.log('\n🔧 检测到 Storage RLS 错误，请执行以下 SQL:');
        console.log(diagnosis.sqlFix);
      }
      
      throw error;
    }
  });
});

import { test, expect } from '@playwright/test';
import { diagnoseError } from '../helpers/diagnose';

/**
 * To C E2E 测试用例模板
 *
 * 使用规范：
 * 1. 每个测试用 try/catch 包裹
 * 2. catch 中调用 diagnoseError() 自动诊断
 * 3. 使用随机数据避免冲突
 * 4. 使用 placeholder/data-testid 选择器
 */

test.describe('{模块名称}', () => {

  test('{测试描述 - P0}', async ({ page }) => {
    try {
      // 准备
      const randomId = Math.floor(Math.random() * 10000);

      // 导航
      await page.goto('/path');

      // 操作
      await page.fill('input[placeholder="..."]', `value${randomId}`);
      await page.click('button[type="submit"]');

      // 等待
      await page.waitForURL('/expected-path', { timeout: 5000 });

      // 断言
      await expect(page.locator('[data-testid="element"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Expected Text');

    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('❌ 测试失败');
      console.log('🔍 诊断:', diagnosis);
      if (diagnosis.sqlFix) console.log('🔧 修复 SQL:', diagnosis.sqlFix);
      throw error;
    }
  });

  test('{登录用户才能执行的操作 - P1}', async ({ page }) => {
    try {
      // 先注册并登录
      const randomId = Math.floor(Math.random() * 10000);
      const email = `test${randomId}@example.com`;

      await page.goto('/register');
      await page.fill('input[placeholder="用户名"]', `user${randomId}`);
      await page.fill('input[type="email"]', email);
      const pwInputs = page.locator('input[type="password"]');
      await pwInputs.nth(0).fill('Test123456!');
      await pwInputs.nth(1).fill('Test123456!');
      await page.check('input[type="checkbox"]');
      await page.click('button[type="submit"]');
      await page.waitForURL('/', { timeout: 5000 });

      // 执行受保护操作
      await page.goto('/protected-path');
      await page.click('button:has-text("操作")');

      // 验证结果
      await expect(page.locator('.success-message')).toBeVisible();

    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('❌ 测试失败');
      console.log('🔍 诊断:', diagnosis);
      throw error;
    }
  });

  test('{未登录用户被重定向}', async ({ page }) => {
    try {
      await page.goto('/protected-path');
      await page.waitForURL('/login', { timeout: 5000 });
      await expect(page).toHaveURL(/login/);
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('诊断结果:', diagnosis);
      throw error;
    }
  });
});

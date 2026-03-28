import { test, expect } from '@playwright/test';
import { diagnoseError, generateFix } from '../helpers/diagnose';

test.describe('认证功能', () => {
  test('首页加载正常', async ({ page }) => {
    try {
      await page.goto('/');
      await expect(page).toHaveTitle(/PhotoPro/);
      await expect(page.locator('h1')).toContainText('发现摄影');
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('诊断结果:', diagnosis);
      throw error;
    }
  });

  test('注册页面可访问', async ({ page }) => {
    try {
      await page.goto('/register');
      await expect(page.locator('h2')).toContainText('创建账号');
      // 使用 data-testid 和精确选择器
      await expect(page.locator('[data-testid="username-input"]')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      // 注册页面有2个密码输入框
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('诊断结果:', diagnosis);
      throw error;
    }
  });

  test('登录页面可访问', async ({ page }) => {
    try {
      await page.goto('/login');
      await expect(page.locator('h2')).toContainText('欢迎回来');
      // 使用 placeholder 选择输入框
      await expect(page.locator('input[placeholder="your@email.com"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('诊断结果:', diagnosis);
      throw error;
    }
  });

  test('注册流程 - 成功注册并自动登录', async ({ page }) => {
    try {
      // 生成随机用户名避免冲突（限制在20字符以内）
      const randomId = Math.floor(Math.random() * 10000);
      const username = `user${randomId}`;
      const email = `test${randomId}@example.com`;

      await page.goto('/register');
      
      // 填写表单 - 使用 placeholder 选择
      await page.fill('input[placeholder="设置你的用户名"]', username);
      await page.fill('input[placeholder="your@email.com"]', email);
      
      // 密码输入框：第一个是密码，第二个是确认密码
      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.nth(0).fill('TestPass123!');
      await passwordInputs.nth(1).fill('TestPass123!');
      
      await page.check('input[type="checkbox"]');
      
      // 提交
      await page.click('button[type="submit"]');
      
      // 等待跳转（注册后应自动登录到首页）
      await page.waitForURL('/', { timeout: 5000 });
      
      // 验证登录成功
      await expect(page.locator('text=发现摄影')).toBeVisible();
      
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('❌ 注册测试失败');
      console.log('诊断:', diagnosis);
      
      // 如果是邮箱未确认错误，提供修复建议
      if (diagnosis.category === 'auth' && diagnosis.pattern === 'email-not-confirmed') {
        console.log('\n🔧 自动修复建议:');
        console.log(diagnosis.fix);
      }
      
      throw error;
    }
  });

  test('登录流程 - 已注册用户可登录', async ({ page }) => {
    try {
      // 先注册一个用户（限制用户名在20字符以内）
      const randomId = Math.floor(Math.random() * 10000);
      const username = `login${randomId}`;
      const email = `login${randomId}@example.com`;
      const password = 'TestPass123!';

      // 注册
      await page.goto('/register');
      await page.fill('input[placeholder="设置你的用户名"]', username);
      await page.fill('input[placeholder="your@email.com"]', email);
      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.nth(0).fill(password);
      await passwordInputs.nth(1).fill(password);
      await page.check('input[type="checkbox"]');
      await page.click('button[type="submit"]');
      await page.waitForURL('/', { timeout: 5000 });

      // 登出
      await page.goto('/');
      // 如果有登出按钮，点击登出
      const logoutButton = page.locator('button:has-text("退出")');
      if (await logoutButton.isVisible().catch(() => false)) {
        await logoutButton.click();
      }

      // 登录
      await page.goto('/login');
      await page.fill('input[placeholder="your@email.com"]', email);
      await page.locator('input[type="password"]').fill(password);
      await page.click('button[type="submit"]');
      
      // 验证登录成功
      await page.waitForURL('/', { timeout: 5000 });
      
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('❌ 登录测试失败');
      console.log('诊断:', diagnosis);
      throw error;
    }
  });

  test('未登录用户访问受保护页面被重定向', async ({ page }) => {
    try {
      await page.goto('/upload');
      await page.waitForURL('/login', { timeout: 5000 });
      await expect(page).toHaveURL(/login/);
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('诊断结果:', diagnosis);
      throw error;
    }
  });
});

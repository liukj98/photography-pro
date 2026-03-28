import { test, expect } from '@playwright/test';

test.describe('点赞功能', () => {
  test('已登录用户可以在作品详情页点赞', async ({ page }) => {
    // 1. 先注册并登录一个新用户
    const randomId = Math.floor(Math.random() * 10000);
    const username = `likeuser${randomId}`;
    const email = `like${randomId}@example.com`;
    const password = 'TestPass123!';

    await page.goto('/register');
    await page.fill('input[placeholder="设置你的用户名"]', username);
    await page.fill('input[placeholder="your@email.com"]', email);
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(password);
    await passwordInputs.nth(1).fill(password);
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');
    // 增加超时时间，因为 Supabase 在海外可能较慢
    await page.waitForURL('/', { timeout: 15000 });

    // 2. 进入探索页面
    await page.goto('/explore');
    await page.waitForSelector('[data-testid="photo-card"]', { timeout: 10000 });
    
    // 3. 点击第一个作品进入详情页
    const firstCard = page.locator('[data-testid="photo-card"]').first();
    await firstCard.click();
    
    // 4. 等待详情页加载，找到点赞按钮
    await page.waitForSelector('button:has(.lucide-heart)', { timeout: 10000 });
    
    const likeButton = page.locator('button:has(.lucide-heart)').first();
    await expect(likeButton).toBeVisible({ timeout: 5000 });

    // 5. 记录初始状态
    const initialText = await likeButton.textContent() || '0';
    const initialCount = parseInt(initialText);
    console.log('Initial count:', initialCount);

    // 6. 点击点赞
    await likeButton.click();
    await page.waitForTimeout(1000);

    // 7. 检查状态是否变化
    const afterText = await likeButton.textContent() || '0';
    const afterCount = parseInt(afterText);
    console.log('After click count:', afterCount);

    // 验证数字变化
    expect(afterCount).not.toBe(initialCount);
  });
});

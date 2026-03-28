import { test, expect } from '@playwright/test';

test.describe('收藏功能', () => {
  test('用户可以收藏和取消收藏作品', async ({ page }) => {
    const randomId = Math.floor(Math.random() * 10000);
    const username = `favuser${randomId}`;
    const email = `fav${randomId}@example.com`;
    const password = 'TestPass123!';

    console.log('=== 收藏功能测试 ===');
    console.log('用户名:', username);

    // 1. 注册登录
    await page.goto('/register');
    await page.fill('input[placeholder="设置你的用户名"]', username);
    await page.fill('input[placeholder="your@email.com"]', email);
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(password);
    await passwordInputs.nth(1).fill(password);
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
    console.log('✓ 登录成功');

    // 2. 进入详情页
    await page.goto('/explore');
    await page.waitForSelector('[data-testid="photo-card"]', { timeout: 10000 });
    await page.locator('[data-testid="photo-card"]').first().click();
    await page.waitForSelector('button:has(.lucide-bookmark)', { timeout: 10000 });
    console.log('✓ 进入详情页');

    // 3. 找到收藏按钮
    const favButton = page.locator('button:has(.lucide-bookmark)').first();
    await expect(favButton).toBeVisible();

    // 4. 记录初始状态
    const initialText = await favButton.textContent() || '';
    console.log('初始收藏按钮文字:', JSON.stringify(initialText));
    console.log('初始是否已收藏:', initialText.includes('已'));

    // 等待确保状态稳定
    await page.waitForTimeout(1000);

    // 5. 点击收藏
    console.log('--- 点击收藏 ---');
    await favButton.click();
    await page.waitForTimeout(2000);

    const afterClickText = await favButton.textContent() || '';
    console.log('点击后收藏按钮文字:', JSON.stringify(afterClickText));
    console.log('点击后是否已收藏:', afterClickText.includes('已'));

    // 6. 验证状态变化
    expect(afterClickText).not.toBe(initialText);
    expect(afterClickText).toContain('已收藏');

    // 7. 点击取消收藏
    console.log('--- 点击取消收藏 ---');
    await favButton.click();
    await page.waitForTimeout(2000);

    const afterCancelText = await favButton.textContent() || '';
    console.log('取消后收藏按钮文字:', JSON.stringify(afterCancelText));
    console.log('取消后是否已收藏:', afterCancelText.includes('已'));

    // 8. 验证取消成功
    expect(afterCancelText).toContain('收藏');
    expect(afterCancelText).not.toContain('已收藏');

    console.log('=== 测试通过 ===');
  });
});

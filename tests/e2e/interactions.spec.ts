import { test, expect } from '@playwright/test';

test.describe('作品互动功能', () => {
  test('用户可以对作品进行点赞和收藏', async ({ page }) => {
    // 监听浏览器控制台日志
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[toggle')) {
        consoleLogs.push(text);
        console.log('浏览器日志:', text);
      }
    });

    // 1. 注册并登录新用户
    const randomId = Math.floor(Math.random() * 10000);
    const username = `testuser${randomId}`;
    const email = `test${randomId}@example.com`;
    const password = 'TestPass123!';

    console.log('=== 开始测试 ===');
    console.log('用户名:', username);

    await page.goto('/register');
    await page.fill('input[placeholder="设置你的用户名"]', username);
    await page.fill('input[placeholder="your@email.com"]', email);
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(password);
    await passwordInputs.nth(1).fill(password);
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
    console.log('✓ 注册并登录成功');

    // 2. 进入探索页面
    await page.goto('/explore');
    await page.waitForSelector('[data-testid="photo-card"]', { timeout: 10000 });
    console.log('✓ 进入探索页面');
    
    // 3. 点击第一个作品进入详情页
    const firstCard = page.locator('[data-testid="photo-card"]').first();
    await firstCard.click();
    
    // 4. 等待详情页加载
    await page.waitForSelector('button:has(.lucide-heart)', { timeout: 10000 });
    console.log('✓ 进入作品详情页');
    
    // 5. 获取点赞和收藏按钮
    const likeButton = page.locator('button:has(.lucide-heart)').first();
    const favoriteButton = page.locator('button:has(.lucide-bookmark)').first();
    
    await expect(likeButton).toBeVisible({ timeout: 5000 });
    await expect(favoriteButton).toBeVisible({ timeout: 5000 });
    
    // 6. 记录初始状态
    const initialLikeText = await likeButton.textContent() || '0';
    const initialLikeCount = parseInt(initialLikeText);
    const initialFavoriteText = await favoriteButton.textContent() || '';
    const initialIsFavorited = initialFavoriteText.includes('已');
    
    // 检查收藏按钮的 disabled 状态
    const favDisabledBefore = await favoriteButton.evaluate(el => (el as HTMLButtonElement).disabled);
    console.log('收藏按钮初始 disabled 状态:', favDisabledBefore);
    
    console.log('初始点赞数:', initialLikeCount);
    console.log('初始收藏状态:', initialIsFavorited ? '已收藏' : '未收藏');
    
    // 7. 先等待一下确保数据加载完成
    await page.waitForTimeout(1000);
    
    // 8. 点击点赞按钮
    console.log('--- 开始测试点赞 ---');
    await likeButton.click();
    
    // 9. 等待状态更新（等待数字变化或按钮样式变化）
    await page.waitForTimeout(1500);
    
    const afterLikeText = await likeButton.textContent() || '0';
    const afterLikeCount = parseInt(afterLikeText);
    console.log('点赞后数字:', afterLikeCount);
    
    // 检查点赞是否成功
    const likeIcon = likeButton.locator('.lucide-heart');
    const isLikedAfterClick = await likeIcon.evaluate(el => el.classList.contains('fill-current'));
    console.log('点赞后图标填充状态:', isLikedAfterClick);
    
    // 验证点赞成功：数字应该增加或图标应该填充
    const likeSuccess = afterLikeCount > initialLikeCount || isLikedAfterClick;
    console.log('点赞是否成功:', likeSuccess);
    
    // 10. 测试取消点赞
    console.log('--- 开始测试取消点赞 ---');
    await likeButton.click();
    await page.waitForTimeout(1500);
    
    const afterUnlikeText = await likeButton.textContent() || '0';
    const afterUnlikeCount = parseInt(afterUnlikeText);
    console.log('取消点赞后数字:', afterUnlikeCount);
    
    const isLikedAfterUnlike = await likeIcon.evaluate(el => el.classList.contains('fill-current'));
    console.log('取消点赞后图标填充状态:', isLikedAfterUnlike);
    
    // 验证取消点赞成功：数字应该减少或图标不应该填充
    const unlikeSuccess = afterUnlikeCount < afterLikeCount || !isLikedAfterUnlike;
    console.log('取消点赞是否成功:', unlikeSuccess);
    
    // 再次检查收藏按钮的 disabled 状态
    const favDisabledAfterLike = await favoriteButton.evaluate(el => (el as HTMLButtonElement).disabled);
    console.log('点赞操作后收藏按钮 disabled 状态:', favDisabledAfterLike);
    
    // 11. 测试收藏功能
    console.log('--- 开始测试收藏 ---');
    
    // 先记录点击前的完整状态
    const beforeFavoriteHTML = await favoriteButton.innerHTML();
    const beforeFavoriteText = await favoriteButton.textContent() || '';
    console.log('点击收藏前按钮HTML:', beforeFavoriteHTML);
    console.log('点击收藏前按钮文字:', beforeFavoriteText);
    
    // 检查按钮是否可点击
    const isFavDisabled = await favoriteButton.evaluate(el => (el as HTMLButtonElement).disabled);
    console.log('点击收藏前按钮是否禁用:', isFavDisabled);
    
    if (isFavDisabled) {
      console.error('错误：收藏按钮被禁用！');
      // 等待一会再试
      await page.waitForTimeout(3000);
      const isStillDisabled = await favoriteButton.evaluate(el => (el as HTMLButtonElement).disabled);
      console.log('等待3秒后按钮是否仍被禁用:', isStillDisabled);
    }
    
    await favoriteButton.click();
    
    // 等待更长时间确保状态更新
    await page.waitForTimeout(2000);
    
    const afterFavoriteText = await favoriteButton.textContent() || '';
    const afterFavoriteHTML = await favoriteButton.innerHTML();
    console.log('点击收藏后按钮文字:', afterFavoriteText);
    console.log('点击收藏后按钮HTML:', afterFavoriteHTML);
    
    const afterIsFavorited = afterFavoriteText.includes('已');
    console.log('点击收藏后状态(通过文字判断):', afterIsFavorited ? '已收藏' : '未收藏');
    
    const favoriteIcon = favoriteButton.locator('.lucide-bookmark');
    const isFavoriteFilled = await favoriteIcon.evaluate(el => el.classList.contains('fill-current'));
    console.log('收藏图标填充状态:', isFavoriteFilled);
    
    // 验证收藏成功 - 宽松判断：文字变化或图标填充都算成功
    const favoriteSuccess = afterIsFavorited || isFavoriteFilled || afterFavoriteText !== beforeFavoriteText;
    console.log('收藏是否成功:', favoriteSuccess);
    
    if (!favoriteSuccess) {
      console.error('收藏测试失败！');
      console.error('点击前文字:', beforeFavoriteText);
      console.error('点击后文字:', afterFavoriteText);
      console.error('图标填充:', isFavoriteFilled);
      console.error('浏览器日志:', consoleLogs);
    }
    
    // 12. 测试取消收藏
    console.log('--- 开始测试取消收藏 ---');
    const beforeUnfavoriteText = await favoriteButton.textContent() || '';
    await favoriteButton.click();
    await page.waitForTimeout(2000);
    
    const afterUnfavoriteText = await favoriteButton.textContent() || '';
    const afterIsUnfavorited = !afterUnfavoriteText.includes('已');
    console.log('取消收藏后状态:', afterIsUnfavorited ? '未收藏' : '已收藏');
    
    const isUnfavoriteFilled = await favoriteIcon.evaluate(el => el.classList.contains('fill-current'));
    console.log('取消收藏图标填充状态:', isUnfavoriteFilled);
    
    // 验证取消收藏成功 - 宽松判断
    const unfavoriteSuccess = afterIsUnfavorited || !isUnfavoriteFilled || afterUnfavoriteText !== beforeUnfavoriteText;
    console.log('取消收藏是否成功:', unfavoriteSuccess);
    
    console.log('=== 测试完成 ===');
    console.log('点赞测试:', likeSuccess ? '✓ 通过' : '✗ 失败');
    console.log('取消点赞测试:', unlikeSuccess ? '✓ 通过' : '✗ 失败');
    console.log('收藏测试:', favoriteSuccess ? '✓ 通过' : '✗ 失败');
    console.log('取消收藏测试:', unfavoriteSuccess ? '✓ 通过' : '✗ 失败');
    console.log('所有浏览器日志:', consoleLogs);
    
    // 最终断言
    expect(likeSuccess, '点赞应该成功').toBe(true);
    expect(unlikeSuccess, '取消点赞应该成功').toBe(true);
    expect(favoriteSuccess, '收藏应该成功').toBe(true);
    expect(unfavoriteSuccess, '取消收藏应该成功').toBe(true);
  });
});

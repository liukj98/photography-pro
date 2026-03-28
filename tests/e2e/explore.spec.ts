import { test, expect } from '@playwright/test';
import { diagnoseError } from '../helpers/diagnose';

test.describe('探索页面', () => {
  test('探索页面加载正常', async ({ page }) => {
    try {
      await page.goto('/explore');
      await expect(page.locator('h1')).toContainText('探索作品');
      await expect(page.locator('text=发现来自全球摄影师的精彩作品')).toBeVisible();
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('诊断结果:', diagnosis);
      throw error;
    }
  });

  test('作品卡片显示正常', async ({ page }) => {
    try {
      await page.goto('/explore');
      
      // 等待作品卡片加载
      await page.waitForSelector('[data-testid="photo-card"]', { timeout: 5000 }).catch(() => {
        console.log('⚠️ 没有找到作品卡片，可能是空状态');
      });
      
      // 或者检查是否有空状态提示
      const emptyState = await page.locator('text=没有找到相关作品').isVisible().catch(() => false);
      const hasCards = await page.locator('[data-testid="photo-card"]').count() > 0;
      
      expect(emptyState || hasCards).toBeTruthy();
      
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('诊断结果:', diagnosis);
      throw error;
    }
  });

  test('分类筛选功能', async ({ page }) => {
    try {
      await page.goto('/explore');
      
      // 点击风光分类
      const landscapeButton = page.locator('button:has-text("风光")');
      if (await landscapeButton.isVisible().catch(() => false)) {
        await landscapeButton.click();
        
        // 等待筛选结果
        await page.waitForTimeout(500);
        
        // 验证页面仍然正常
        await expect(page.locator('h1')).toContainText('探索作品');
      }
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('诊断结果:', diagnosis);
      throw error;
    }
  });

  test('搜索功能', async ({ page }) => {
    try {
      await page.goto('/explore');
      
      // 查找搜索输入框
      const searchInput = page.locator('input[placeholder*="搜索"]').or(
        page.locator('input[placeholder*="标签"]')
      );
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('测试');
        await page.waitForTimeout(500);
        
        // 验证搜索后页面正常
        await expect(page.locator('h1')).toContainText('探索作品');
      }
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('诊断结果:', diagnosis);
      throw error;
    }
  });
});

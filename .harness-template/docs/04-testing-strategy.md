# To C 测试策略

## 1. 测试金字塔（To C 版）

```
        ╱  E2E 测试  ╲           ← Playwright，覆盖用户旅程
       ╱ （高优先）    ╲
      ╱────────────────╲
     ╱   集成测试        ╲        ← Supabase + React，覆盖数据流
    ╱────────────────────╲
   ╱     单元测试（可选）   ╲      ← 工具函数、纯逻辑
  ╱────────────────────────╲
```

To C 产品以 **E2E 测试**为核心，因为：
- To C 产品的价值在于用户流程是否顺畅
- E2E 测试直接模拟真实用户操作
- 发现 UI/交互问题的效率最高
- 与 Harness 评估器验收标准一致

## 2. E2E 测试用例设计

### 2.1 测试文件命名与组织

```
tests/e2e/
├── auth.spec.ts              # 认证相关（P0）
├── explore.spec.ts           # 内容浏览（P0）
├── interaction.spec.ts       # 互动功能（P1）
├── upload.spec.ts            # 内容创建（P1）
├── favorite.spec.ts          # 收藏功能（P1）
├── like.spec.ts              # 点赞功能（P2）
└── settings.spec.ts          # 个人设置（P2）
```

### 2.2 To C 核心 E2E 测试用例

#### P0 — 核心旅程（必须 100% 通过）

```typescript
// auth.spec.ts
test.describe('认证功能 P0', () => {
  test('首页可访问', async ({ page }) => { ... });
  test('注册页面可访问', async ({ page }) => { ... });
  test('登录页面可访问', async ({ page }) => { ... });
  test('注册流程 - 成功注册并自动登录', async ({ page }) => { ... });
  test('登录流程 - 已注册用户可登录', async ({ page }) => { ... });
  test('未登录用户访问受保护页面被重定向', async ({ page }) => { ... });
  test('404 页面正确显示', async ({ page }) => { ... });
});

// explore.spec.ts
test.describe('内容浏览 P0', () => {
  test('发现页加载并显示内容', async ({ page }) => { ... });
  test('点击内容可进入详情页', async ({ page }) => { ... });
  test('详情页展示完整信息', async ({ page }) => { ... });
  test('返回按钮正确导航', async ({ page }) => { ... });
});
```

#### P1 — 核心功能

```typescript
// interaction.spec.ts
test.describe('互动功能 P1', () => {
  test('登录用户可点赞内容', async ({ page }) => { ... });
  test('点赞数实时更新', async ({ page }) => { ... });
  test('取消点赞正常', async ({ page }) => { ... });
  test('登录用户可发表评论', async ({ page }) => { ... });
  test('评论实时显示', async ({ page }) => { ... });
});

// upload.spec.ts
test.describe('内容创建 P1', () => {
  test('登录用户可进入上传页', async ({ page }) => { ... });
  test('表单验证正常工作', async ({ page }) => { ... });
  test('成功上传内容', async ({ page }) => { ... });
});
```

#### P2 — 体验细节

```typescript
// theme.spec.ts（可选）
test.describe('主题切换 P2', () => {
  test('可切换深色模式', async ({ page }) => { ... });
  test('主题偏好持久化', async ({ page }) => { ... });
});
```

## 3. 测试辅助工具

### 3.1 错误诊断助手

```typescript
// tests/helpers/diagnose.ts
export interface Diagnosis {
  category: 'auth' | 'storage' | 'database' | 'ui' | 'network' | 'unknown';
  pattern: string;
  message: string;
  cause: string;
  fix: string;
  sqlFix?: string;
  autoFixable: boolean;
}

export function diagnoseError(error: unknown): Diagnosis {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // 邮箱未确认
  if (errorMessage.includes('Email not confirmed')) { ... }
  // Storage RLS
  if (errorMessage.includes('StorageApiError') && errorMessage.includes('row-level security')) { ... }
  // Database RLS
  if (errorMessage.includes('violates row-level security')) { ... }
  // 超时
  if (errorMessage.includes('timeout')) { ... }
  // 元素未找到
  if (errorMessage.includes('not found')) { ... }
  // 默认
  return { category: 'unknown', ... };
}
```

### 3.2 测试标准结构模板

每个测试用例应遵循以下结构：

```typescript
test('测试描述', async ({ page }) => {
  try {
    // 1. 准备数据（如需要）
    const randomId = Math.floor(Math.random() * 10000);

    // 2. 导航到页面
    await page.goto('/path');

    // 3. 执行操作
    await page.fill('selector', 'value');
    await page.click('selector');

    // 4. 等待结果
    await page.waitForURL('/expected-path', { timeout: 5000 });

    // 5. 断言验证
    await expect(page.locator('selector')).toBeVisible();
    await expect(page.locator('selector')).toContainText('expected');

  } catch (error) {
    // 6. 错误诊断
    const diagnosis = diagnoseError(error);
    console.log('诊断结果:', diagnosis);
    if (diagnosis.sqlFix) console.log('修复 SQL:', diagnosis.sqlFix);
    throw error;
  }
});
```

## 4. 测试数据管理

### 4.1 随机化策略

To C 测试必须避免数据冲突：

```typescript
// 生成唯一标识
const randomId = Math.floor(Math.random() * 10000);
const username = `user${randomId}`;        // user1234
const email = `test${randomId}@example.com`; // test1234@example.com
```

### 4.2 Seed 数据脚本

```javascript
// scripts/seed-data.js
// 用于开发环境的测试数据填充
// 运行: npm run seed

async function seed() {
  // 1. 创建测试用户
  // 2. 填充示例内容
  // 3. 创建互动数据
  // 4. 输出测试账号信息
}
```

### 4.3 测试账号规范

| 用户名 | 邮箱 | 密码 | 用途 |
|--------|------|------|------|
| test_user1 | test1@example.com | Test123456! | 普通用户测试 |
| test_user2 | test2@example.com | Test123456! | 互动功能测试 |
| admin_user | admin@example.com | Test123456! | 管理功能测试 |

## 5. 测试执行规范

### 5.1 命令

```bash
# 运行所有 E2E 测试
npm run harness:test

# 运行指定文件
npx playwright test tests/e2e/auth.spec.ts

# UI 模式（调试用）
npm run harness:test:ui

# 查看测试报告
npm run harness:report

# 自动运行（CI）
npm run harness:auto-test
```

### 5.2 测试失败处理

```
测试失败
  ↓
diagnoseError() 自动诊断
  ↓
├── 可自动修复（Auth 配置、RLS 策略）
│   → 生成 SQL → 提示用户执行
└── 不可自动修复（UI 问题、逻辑错误）
    → 截图保存 → 日志记录 → 人工修复
```

### 5.3 测试通过标准

| 级别 | 要求 |
|------|------|
| Sprint 交付 | P0 测试 100% 通过，P1 ≥ 80% |
| 正式发布 | 所有 P0 + P1 测试 100% 通过 |
| 持续监控 | 每次代码变更后运行 P0 测试 |

## 6. CI/CD 集成建议

```yaml
# GitHub Actions 示例
name: Harness E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run harness:test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-results
          path: playwright-report/
```

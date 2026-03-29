# Harness 框架在 To C 中的映射

## 1. 框架角色职责总结

```
┌──────────────────────────────────────────────────────────────┐
│                   Harness To C 工作流                          │
│                                                              │
│  用户需求（1-4句话描述 To C 产品）                              │
│       ↓                                                      │
│  ┌─────────────┐                                             │
│  │  规划器       │  产出：plan.md（含用户画像、旅程、功能清单）   │
│  │  Planner    │  To C 特别：冷启动方案、增长策略               │
│  └─────────────┘                                             │
│       ↓                                                      │
│  ┌─────────────────────────────────────────┐                 │
│  │  Sprint 循环                             │                 │
│  │  ┌─────────────┐  ┌─────────────────┐   │                 │
│  │  │  生成器       │  │  自动化测试       │   │                 │
│  │  │  Generator  │→ │  Automation     │   │                 │
│  │  │             │  │                 │   │                 │
│  │  │ To C 模式:   │  │ To C 测试:       │   │                 │
│  │  │ · 用户认证   │  │ · 注册/登录      │   │                 │
│  │  │ · 内容 CRUD  │  │ · 内容浏览      │   │                 │
│  │  │ · 社交互动   │  │ · 互动操作      │   │                 │
│  │  │ · 个人中心   │  │ · 诊断+修复     │   │                 │
│  │  └─────────────┘  └─────────────────┘   │                 │
│  │       ↓                    ↓           │                 │
│  │  ┌─────────────┐                       │                 │
│  │  │  评估器       │  产出：evaluation.json + feedback.md    │
│  │  │  Evaluator  │  To C 特别：用户体验评估权重更高            │
│  │  └─────────────┘                       │                 │
│  │       ↓                                │                 │
│  │  达标(≥8.0)? → YES → 交付              │                 │
│  │  → NO → 读取反馈 → 修复 → 重新评估      │                 │
│  └─────────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────┘
```

## 2. 规范器 (Spec) — To C 质量标准

### 2.1 评估维度与权重

To C 产品的评估权重与通用项目有差异：

| 维度 | 通用权重 | To C 权重 | 调整理由 |
|------|----------|-----------|----------|
| 功能验收 | 30% | 30% | 不变 |
| 设计质量 | 25% | 30% | To C 产品用户体验是核心竞争力 |
| 代码质量 | 25% | 15% | 适当降低，优先保证功能与体验 |
| 性能表现 | 15% | 15% | 不变 |
| 安全性 | 5% | 10% | To C 涉及用户数据，安全性更重要 |

### 2.2 To C 专项检查点

**功能验收（30%）**
- [ ] 注册/登录/找回密码流程完整
- [ ] 受保护路由有权限守卫
- [ ] 核心 CRUD 功能可用
- [ ] 分页/无限滚动正常
- [ ] 搜索/筛选功能正确
- [ ] 表单验证完整（前端 + 后端）

**设计质量（30%）**
- [ ] 视觉层次清晰（重要信息突出）
- [ ] 响应式适配（mobile 375px / tablet 768px / desktop 1280px）
- [ ] Loading 状态有骨架屏或 Spinner
- [ ] Empty 状态有友好提示
- [ ] Error 状态有明确反馈
- [ ] 交互动画自然流畅
- [ ] Dark Mode 支持

**代码质量（15%）**
- [ ] TypeScript 类型完整，无 `any`
- [ ] 组件单一职责
- [ ] Hooks 正确使用依赖数组
- [ ] 无 console.log 残留
- [ ] 无硬编码字符串/颜色

**性能（15%）**
- [ ] 首屏加载 < 3s
- [ ] 图片使用懒加载
- [ ] 路由使用懒加载
- [ ] Bundle size 合理

**安全（10%）**
- [ ] 无硬编码密钥/Token
- [ ] Supabase RLS 策略完整
- [ ] Storage Bucket 权限正确
- [ ] 用户输入做 XSS 防护

### 2.3 通过阈值

```javascript
const passed =
  totalScore >= 8.0 &&
  functional >= 7.0 &&  // To C 核心旅程必须可靠
  design >= 7.0 &&      // 体验不能有明显缺陷
  code >= 6.0;          // 代码质量基本合格即可
```

## 3. 规划器 (Planner) — To C 产品规划

### 3.1 To C 规划的特别章节

在标准 plan.md 基础上，To C 项目需要额外关注：

#### A. 用户画像
```markdown
### 用户画像

**主要用户**：[年龄段] 的 [身份描述]，他们 [核心需求]。
**次要用户**：[描述]，他们 [需求]。

**用户特征**：
- 技术熟练度：高/中/低
- 使用频率：日均 X 分钟
- 核心诉求：[一句话]
- 痛点：[当前解决方案的不足]
```

#### B. 用户旅程
```markdown
### 核心用户旅程

**旅程 1：新用户首次体验**
注册 → 引导 → 首次操作 → 感受价值 → 留存

**旅程 2：日常使用**
打开 → 浏览内容 → 互动 → [付费转化] → 离开

**旅程 3：内容创作者**
登录 → 创作 → 发布 → 查看数据 → 优化
```

#### C. 冷启动方案
```markdown
### 冷启动方案

1. 测试数据填充（seed-data.js）
2. 种子用户账号
3. 示例内容（至少 X 条）
4. SEO 基础配置
```

### 3.2 To C Sprint 规划优先级

```
Sprint 1: 基础骨架
  - 项目初始化 + Tailwind 配置
  - Supabase 连接 + Auth
  - 基础布局（Header/Footer）
  - 首页 + 404

Sprint 2: 核心功能
  - 用户注册/登录
  - 内容 CRUD
  - 内容浏览（列表+详情）

Sprint 3: 社交互动
  - 点赞/收藏
  - 评论系统
  - 用户主页

Sprint 4: 体验优化
  - 响应式适配
  - Dark Mode
  - 加载/空/错误状态
  - 性能优化
```

## 4. 生成器 (Generator) — To C 代码模式

### 4.1 To C 必备模式

| 模式 | 文件位置 | 说明 |
|------|----------|------|
| ProtectedRoute | `App.tsx` 或 `components/auth/` | 未登录跳转 |
| PublicLayout | `App.tsx` | Header + Main + Footer |
| AuthLayout | `App.tsx` | 无 Header/Footer |
| useAuth | `hooks/useAuth.ts` | 认证逻辑封装 |
| toastStore | `stores/toastStore.ts` | 全局通知 |
| themeStore | `stores/themeStore.ts` | Dark Mode |
| LazyImage | `components/ui/` | 图片懒加载 |
| Demo Mode | `lib/demo-mode.ts` | 无后端时也能演示 |

### 4.2 路由组织规范

```tsx
// App.tsx - To C 标准路由结构
<Routes>
  {/* 公开路由 - 带布局 */}
  <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
  <Route path="/explore" element={<PublicLayout><Explore /></PublicLayout>} />
  <Route path="/u/:username" element={<PublicLayout><Profile /></PublicLayout>} />

  {/* 认证路由 - 无布局 */}
  <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
  <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />

  {/* 受保护路由 - 带布局 + 权限守卫 */}
  <Route path="/settings" element={
    <ProtectedRoute><PublicLayout><Settings /></PublicLayout></ProtectedRoute>
  } />

  {/* 404 */}
  <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
</Routes>
```

## 5. 评估器 (Evaluator) — To C 验收重点

### 5.1 To C 评估的特别关注

1. **第一印象**：新用户打开首页的 3 秒内体验
2. **关键路径**：注册 → 核心功能 → 价值感受
3. **移动端**：50%+ 的 To C 用户来自手机
4. **空状态**：新用户看到空页面的体验
5. **错误恢复**：网络异常、操作失败时的处理

### 5.2 To C 评估清单补充

```markdown
## To C 专项检查

### 新用户体验
- [ ] 首页能立刻感受到产品价值
- [ ] 注册流程 < 3 步
- [ ] 首次登录有引导或示例内容
- [ ] 空状态有清晰的行动引导

### 留存体验
- [ ] 数据统计/进度展示（gamification）
- [ ] 个性化推荐或发现机制
- [ ] 通知/消息系统

### 移动端
- [ ] 触摸目标 ≥ 44px
- [ ] 无水平滚动条
- [ ] 键盘弹出时布局不变形
- [ ] 下拉刷新/上拉加载

### 安全与隐私
- [ ] 敏感操作需重新认证
- [ ] 个人信息可导出/删除
- [ ] 隐私政策链接可见
```

## 6. 自动化 (Automation) — To C 测试策略

### 6.1 To C 测试优先级

```
P0 - 核心旅程（必须通过）：
  ├── 用户注册
  ├── 用户登录
  ├── 内容浏览（首页 → 详情）
  └── 未登录访问受保护路由 → 重定向

P1 - 核心功能：
  ├── 内容 CRUD（创建/读取/更新/删除）
  ├── 点赞/收藏
  ├── 搜索/筛选
  └── 个人设置

P2 - 体验细节：
  ├── 响应式布局
  ├── Dark Mode 切换
  ├── 表单验证
  └── Loading/Empty/Error 状态
```

### 6.2 测试用例编写规范

```typescript
// tests/e2e/auth.spec.ts - To C 标准测试结构
import { test, expect } from '@playwright/test';
import { diagnoseError } from '../helpers/diagnose';

test.describe('认证功能', () => {
  test('首页加载正常', async ({ page }) => {
    try {
      await page.goto('/');
      await expect(page).toHaveTitle(/产品名/);
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('诊断结果:', diagnosis);
      throw error;
    }
  });

  test('注册流程完整', async ({ page }) => {
    try {
      const randomId = Math.floor(Math.random() * 10000);
      await page.goto('/register');
      await page.fill('input[placeholder="..."]', `user${randomId}`);
      await page.fill('input[type="email"]', `test${randomId}@example.com`);
      await page.click('button[type="submit"]');
      await page.waitForURL('/', { timeout: 5000 });
    } catch (error) {
      const diagnosis = diagnoseError(error);
      console.log('诊断:', diagnosis);
      if (diagnosis.sqlFix) console.log('修复SQL:', diagnosis.sqlFix);
      throw error;
    }
  });
});
```

**关键规范**：
- 每个测试用 try/catch 包裹
- catch 中调用 `diagnoseError` 自动诊断
- 随机化测试数据避免冲突
- 使用 placeholder/data-testid 选择器

# Harness Engineering - 评估器 (Evaluator)

## 角色定义

评估器是 Harness 框架的质量守护者，扮演 QA 角色。它使用自动化测试工具和详细检查清单，对生成器的输出进行客观评估，并提供具体、可操作的反馈。

---

## 核心职责

1. **客观评估**: 基于预定义标准对输出进行评分
2. **发现缺陷**: 识别 Bug、设计问题、性能瓶颈
3. **提供反馈**: 生成具体、可操作的改进建议
4. **验证修复**: 确认问题已被正确解决

---

## 输入

- `plan.md` - 产品规划
- `sprint_contract.md` - Sprint 合同
- `implementation.md` - 实现说明
- 代码和可运行应用

---

## 输出

1. `evaluation.json` - 结构化评估结果
2. `feedback.md` - 详细反馈报告
3. 测试报告和截图

---

## 评估流程

```
读取 Sprint 合同
    ↓
功能验收测试
    ↓
设计质量评估
    ↓
代码质量审查
    ↓
性能测试
    ↓
安全扫描
    ↓
生成评估报告
    ↓
[PASS] → 批准 / [FAIL] → 生成反馈 → 返回生成器
```

---

## 评估维度

### 1. 功能验收 (Functional Acceptance)

**工具**: Playwright MCP / 手动测试

| 检查项 | 权重 | 验证方式 |
|--------|------|----------|
| 核心功能完整 | 30% | E2E 测试 |
| 边界条件处理 | 20% | 异常测试 |
| 数据流正确 | 25% | 集成测试 |
| 错误处理 | 25% | 错误场景测试 |

### 2. 设计质量 (Design Quality)

**工具**: Playwright 截图分析

| 检查项 | 权重 | 评估标准 |
|--------|------|----------|
| 视觉一致性 | 25% | 符合设计系统 |
| 排版可读性 | 20% | 字体、行高、对比度 |
| 色彩协调 | 20% | 符合色彩系统 |
| 响应式适配 | 20% | 多端显示正常 |
| 交互反馈 | 15% | 状态变化明确 |

### 3. 代码质量 (Code Quality)

| 检查项 | 权重 | 工具/方式 |
|--------|------|-----------|
| 命名规范 | 15% | ESLint |
| 代码重复 | 15% | jscpd |
| 复杂度 | 20% | sonarjs |
| 类型安全 | 25% | TypeScript |
| 注释完整 | 10% | 人工审查 |
| 测试覆盖 | 15% | jest --coverage |

### 4. 性能指标 (Performance)

| 指标 | 阈值 | 工具 |
|------|------|------|
| 首屏加载 | < 3s | Lighthouse |
| 可交互时间 | < 5s | Lighthouse |
| 构建时间 | < 60s | 计时 |
| 包大小 | < 500KB | bundle-analyzer |

### 5. 安全性 (Security)

- [ ] 无硬编码密钥
- [ ] 输入验证完整
- [ ] XSS 防护
- [ ] CSRF 防护
- [ ] 敏感操作鉴权

---

## 评分算法

```javascript
// 总分计算
const totalScore = 
  functional * 0.30 +
  design * 0.25 +
  code * 0.25 +
  performance * 0.15 +
  security * 0.05;

// 通过条件
const passed = 
  totalScore >= 8.0 &&
  functional >= 6.0 &&
  design >= 6.0 &&
  code >= 6.0;
```

---

## 反馈报告结构

### evaluation.json

```json
{
  "version": "1.0",
  "sprint_id": 3,
  "iteration": 2,
  "timestamp": "2026-03-28T19:00:00Z",
  "evaluator": "evaluator-v1",
  
  "summary": {
    "overall_score": 7.8,
    "status": "PARTIAL",
    "verdict": "需要改进"
  },
  
  "scores": {
    "functional": { "score": 8.5, "max": 10, "weight": 0.30 },
    "design": { "score": 7.0, "max": 10, "weight": 0.25 },
    "code": { "score": 8.0, "max": 10, "weight": 0.25 },
    "performance": { "score": 8.5, "max": 10, "weight": 0.15 },
    "security": { "score": 9.0, "max": 10, "weight": 0.05 }
  },
  
  "findings": [
    {
      "id": "F-001",
      "severity": "P1",
      "category": "design",
      "title": "移动端导航栏溢出",
      "description": "在 375px 宽度下，导航栏右侧按钮被截断",
      "evidence": {
        "type": "screenshot",
        "path": "/evidence/navbar-overflow.png"
      },
      "location": {
        "file": "src/components/Navbar.tsx",
        "line": 45
      },
      "recommendation": "使用汉堡菜单或缩小按钮间距",
      "reference": "plan.md#4.2"
    }
  ],
  
  "metrics": {
    "test_coverage": 82,
    "build_time": 45,
    "bundle_size": 320000,
    "lighthouse_score": 85
  },
  
  "next_action": {
    "type": "revise",
    "priority": "fix_p1_first",
    "estimated_effort": "2h"
  }
}
```

### feedback.md

```markdown
# Sprint #3 第 2 轮评估报告

## 评估概览

| 维度 | 得分 | 权重 | 加权得分 |
|------|------|------|----------|
| 功能验收 | 8.5/10 | 30% | 2.55 |
| 设计质量 | 7.0/10 | 25% | 1.75 |
| 代码质量 | 8.0/10 | 25% | 2.00 |
| 性能表现 | 8.5/10 | 15% | 1.28 |
| 安全性 | 9.0/10 | 5% | 0.45 |
| **总分** | **7.8/10** | - | **8.03** |

**状态**: ⚠️ PARTIAL (部分通过)

---

## 优点 ✓

1. **功能完整**: 核心用户流程全部可用
2. **代码质量**: TypeScript 类型定义完善
3. **性能良好**: 首屏加载时间 2.3s

---

## 需要改进 ⚠️

### P1 - 移动端导航栏问题

**问题**: 在 375px 宽度下，导航栏右侧按钮被截断

**截图**: ![navbar-overflow](/evidence/navbar-overflow.png)

**建议**:
```css
/* 在 < 768px 时切换为汉堡菜单 */
@media (max-width: 768px) {
  .navbar-links { display: none; }
  .navbar-hamburger { display: block; }
}
```

**参考**: plan.md 第 4.2 节响应式布局要求

---

## 下一轮建议

1. 优先修复 P1 问题
2. 考虑优化按钮组件的悬停效果
3. 添加加载状态骨架屏

---

评估者: evaluator-v1  
时间: 2026-03-28 19:00 UTC
```

---

## 评估工具集

### 自动化测试

```typescript
// Playwright 测试示例
import { test, expect } from '@playwright/test';

test('用户登录流程', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### 截图对比

```bash
# 使用 Playwright 截图
npx playwright screenshot --viewport-size=1920,1080 http://localhost:3000 desktop.png
npx playwright screenshot --viewport-size=375,812 http://localhost:3000 mobile.png
```

### 性能测试

```bash
# Lighthouse CI
npx lhci autorun --config=lighthouserc.js
```

---

## 评估原则

### 客观性原则

- 基于 spec.md 中的标准进行评估
- 提供具体证据（截图、日志、代码行号）
- 避免主观偏见

### 建设性原则

- 每个问题必须附带解决方案
- 按优先级排序（P0 > P1 > P2）
- 平衡批评与鼓励

### 一致性原则

- 相同问题在不同 Sprint 中评估标准一致
- 记录评估标准的演进
- 定期校准评估尺度

---

## 迭代终止判断

### 继续迭代

- 总分 < 8.0 且存在可修复问题
- 距离上次明显提升 < 3 轮

### 终止迭代

- 总分 ≥ 8.0
- 连续 3 轮提升 < 0.5
- 达到最大迭代次数

### 需要 Pivot

- 设计方案根本性问题
- 技术选型错误
- 需求理解偏差


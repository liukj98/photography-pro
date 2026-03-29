# Sprint #{N} 合同

## 基本信息
- **Sprint 编号**：{N}
- **目标描述**：{本 Sprint 要交付的功能}
- **基于计划**：plan.md 第 {X} 章节

---

## 验收标准

### 功能标准

- [ ] **标准 1**：{具体描述} — 权重: 30%
- [ ] **标准 2**：{具体描述} — 权重: 30%
- [ ] **标准 3**：{具体描述} — 权重: 40%

### 质量标准

- [ ] P0 E2E 测试 100% 通过
- [ ] P1 E2E 测试 ≥ 80% 通过
- [ ] TypeScript 编译无错误
- [ ] ESLint 无新增 Warning
- [ ] 构建成功 (`npm run build`)
- [ ] 无 P0/P1 级别 Bug

### 设计标准

- [ ] 响应式布局正常（mobile / tablet / desktop）
- [ ] Dark Mode 正常
- [ ] Loading 状态有 Skeleton/Spinner
- [ ] Empty 状态有友好提示
- [ ] Error 状态有明确反馈

### 安全标准

- [ ] 无硬编码密钥/Token
- [ ] RLS 策略完整
- [ ] Storage Bucket 权限正确

---

## 通过阈值

- 总分 ≥ **8.0/10**
- 任意单项 ≥ **6.0/10**
- P0 测试 **100% 通过**

---

## 约束条件

- 技术栈：React 19 + TypeScript + Vite + Tailwind + Supabase + Zustand
- 测试框架：Playwright
- UI 风格：与已有页面保持一致

---

## 时间盒

- 预计迭代次数：{N} 次
- 单次迭代最大耗时：{X} 小时

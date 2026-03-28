# Harness Engineering 框架

基于 Anthropic Engineering 的对抗性多智能体协作方法论，用于构建高质量软件产品的工程框架。

---

## 核心理念

```
┌─────────────────────────────────────────────────────────────┐
│                    Harness Framework                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  抽象接口层 (Abstract)                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │  │
│  │  │  规范器   │  │  规划器   │  │  生成器   │  │ 评估器  │ │  │
│  │  │  Spec    │  │ Planner  │  │Generator │  │Evaluator│ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │  │
│  │  ┌──────────┐  ┌───────────────────────────────────┐  │  │
│  │  │ 自动化测试│  │        自动化诊断与修复              │  │  │
│  │  │Automation│  │      Auto-Diagnostics & Repair     │  │  │
│  │  └──────────┘  └───────────────────────────────────┘  │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │ 实现                              │
│           ┌───────────────┼───────────────┐                  │
│           ▼               ▼               ▼                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │   Markdown   │ │ React+TS+    │ │  Playwright  │         │
│  │     PRD      │ │   Tailwind   │ │   Adapter    │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

**设计原则**:
- **抽象与实现分离**: 上层定义 What，下层实现 How
- **可插拔架构**: 组件可替换，接口保持稳定
- **自动化优先**: 测试、诊断、修复尽可能自动化
- **持续反馈**: 规划→生成→评估→反馈循环

---

## 模块架构

### 1. 规范器 (Spec) - `spec.md`
**职责**: 定义质量标准、评估准则和通信协议

**内容**:
- 四维评估体系（功能、设计、代码、性能、安全）
- Sprint 合同模板
- 反馈格式规范
- 状态传递协议

### 2. 规划器 (Planner) - `planner.md`
**职责**: 将用户需求转化为结构化规划

**输入**: 1-4 句话的用户需求
**输出**: 详细的 `plan.md` 规划文档

### 3. 生成器 (Generator) - `generator.md`
**职责**: 按 Sprint 实现功能，与评估器协作迭代

**输入**: `plan.md` + 评估反馈
**输出**: 可运行的代码

**具体实现**:
- React + TypeScript + Tailwind CSS
- Vue + TypeScript + UnoCSS（可替换）
- 任何符合接口的技术栈

### 4. 评估器 (Evaluator) - `evaluator.md`
**职责**: 对生成器输出进行客观评估

**输入**: 代码 + Sprint 合同
**输出**: `evaluation.json` + `feedback.md`

### 5. 自动化测试 (Automation) ⭐
**抽象接口**: `automation-abstract.md`
**职责**: 质量保证、错误诊断、自动修复

**核心接口**:
```typescript
interface IAutomationEngine {
  execute(config: TestConfig): Promise<ExecutionResult>;
  diagnose(error: Error): Diagnosis;
  autoFix?(issue: Issue): Promise<FixResult>;
  report(results: ExecutionResult[]): Report;
}
```

**具体实现**（可插拔）:
- **Playwright Adapter** - E2E 测试（已实现）
- **Vitest Adapter** - 单元测试（可扩展）
- **Cypress Adapter** - E2E 测试（可扩展）

### 6. 自动化诊断与修复 - `automation.md`
**职责**: 智能错误诊断和自动修复

**能力**:
- 错误模式自动识别
- RLS/权限问题自动生成修复 SQL
- 预检清单防止常见问题

---

## 完整工作流

```
用户输入需求
    ↓
┌─────────────────────────────────────┐
│  规划器 (Planner)                    │
│  - 解析需求                          │
│  - 生成 Plan                         │
└─────────────────────────────────────┘
    ↓ Plan
┌─────────────────────────────────────┐
│  Sprint 循环                         │
│  ┌───────────────────────────────┐  │
│  │ 生成器 (Generator)            │  │
│  │ - 读取 Plan                   │  │
│  │ - 编写代码                    │  │
│  └───────────────────────────────┘  │
│           ↓ 代码                     │
│  ┌───────────────────────────────┐  │
│  │ 自动化测试 (Automation)        │  │
│  │ - 运行测试套件                 │  │
│  │ - 捕获错误                     │  │
│  │ - 自动诊断                     │  │
│  │ - 尝试修复                     │  │
│  └───────────────────────────────┘  │
│           ↓ 报告                     │
│  ┌───────────────────────────────┐  │
│  │ 评估器 (Evaluator)            │  │
│  │ - 质量评分                    │  │
│  │ - 生成反馈                    │  │
│  └───────────────────────────────┘  │
│           ↓ 反馈                     │
│  达标? → 完成 : 返回生成器           │
└─────────────────────────────────────┘
    ↓
交付产品
```

---

## 文档结构

```
.harness/
├── README.md                      # 框架总览（本文件）
├── architecture.md                # 架构设计
│
├── spec.md                        # 规范器 - 质量标准
├── planner.md                     # 规划器 - 产品规划指南
├── generator.md                   # 生成器 - 开发指南
├── evaluator.md                   # 评估器 - 评估指南
│
├── automation.md                  # 自动化诊断与修复
├── automation-abstract.md         # 自动化测试抽象接口
│
├── adapters/                      # 适配器实现
│   └── playwright.adapter.ts     # Playwright 适配器
│
├── templates/                     # 模板文件
│   ├── plan-template.md
│   ├── sprint-contract-template.md
│   └── evaluation-template.json
│
├── output/                        # 生成物目录
│   ├── plan.md                   # 产品规划
│   ├── sprint-contract-*.md      # Sprint 合同
│   ├── implementation-*.md       # 实现说明
│   ├── evaluation-*.json         # 评估结果
│   └── feedback-*.md             # 详细反馈
│
└── state/                         # 状态目录
    └── sprint-current.json       # 当前 Sprint 状态
```

---

## 快速开始

### 第一步：描述需求

用 1-4 句话描述你的产品需求：

> "我想做一个摄影作品集网站，展示我的风光摄影作品，支持按地点分类浏览，有精美的图片画廊和关于我的介绍页面。"

### 第二步：生成规划

使用规划器生成详细的产品规划文档。

### 第三步：开始 Sprint

生成器读取规划，与评估器协商合同，开始开发。

### 第四步：迭代优化

```
生成器开发 → 自动化测试 → 诊断错误 → 自动修复
    ↓                ↓              ↓
    └────────────────┴──────────────┘
            ↓
    评估器验收 → 反馈 → 改进 → 重新评估
```

直到达到质量阈值或迭代上限。

---

## 自动化测试使用

### 配置测试引擎

```yaml
# .harness/config.yml
automation:
  adapter: playwright  # 或 vitest, cypress
  
  adapters:
    playwright:
      browser: chromium
      headless: true
      screenshot: on-failure
```

### 运行测试

```bash
# 运行自动化测试
npm run harness:test

# 自动修复常见问题
npm run harness:fix
```

---

## 扩展 Harness

### 添加新的测试适配器

实现 `IAutomationEngine` 接口：

```typescript
// adapters/vitest.adapter.ts
export class VitestAdapter implements IAutomationEngine {
  readonly name = 'Vitest';
  readonly capabilities = ['unit', 'integration'];
  
  async execute(config: TestConfig): Promise<ExecutionResult> {
    // 实现测试执行
  }
  
  diagnose(error: Error): Diagnosis {
    // 实现错误诊断
  }
}
```

### 添加新的错误模式

```yaml
# .harness/knowledge-base/errors.yml
errors:
  - pattern: "Your error pattern"
    category: category-name
    solution:
      type: code-change | config-change | sql-execution
      action: specific-action
```

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-03-28 | 初始框架建立 |
| v1.1 | 2026-03-28 | 添加自动化测试抽象层 |
| v1.2 | 2026-03-28 | 添加自动化诊断与修复 |

---

## 参考

- [Anthropic Engineering - Harness Design](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Playwright Documentation](https://playwright.dev)
- [Supabase Documentation](https://supabase.com/docs)

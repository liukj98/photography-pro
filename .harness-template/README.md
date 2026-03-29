# Harness To C 项目工程规范模板

> 基于 Harness Engineering 多智能体协作方法论，专为 To C 消费级产品设计的工程规范模板。

## 核心理念

将 **Harness Engineering 框架**（规范器→规划器→生成器→评估器→自动化测试）与 **To C 产品特征**（用户认证、内容管理、社交互动、个人中心、数据统计）深度结合，形成一套可复用的工程化标准。

```
┌─────────────────────────────────────────────────────────────┐
│              Harness To C 工程规范体系                         │
│                                                             │
│   Harness 层:  Spec → Planner → Generator → Evaluator       │
│                    ↓                                        │
│   To C 层:   用户系统 · 内容管理 · 社交互动 · 个人中心        │
│                    ↓                                        │
│   自动化层:  Playwright E2E · 错误诊断 · 自动修复             │
└─────────────────────────────────────────────────────────────┘
```

## 文档索引

| 文档 | 说明 |
|------|------|
| [docs/00-overview.md](docs/00-overview.md) | 总览：Harness 框架与 To C 项目的结合方式 |
| [docs/01-project-structure.md](docs/01-project-structure.md) | To C 项目目录结构规范 |
| [docs/02-tech-stack.md](docs/02-tech-stack.md) | 推荐技术栈与选型理由 |
| [docs/03-harness-framework.md](docs/03-harness-framework.md) | Harness 五大角色在 To C 中的具体映射 |
| [docs/04-testing-strategy.md](docs/04-testing-strategy.md) | To C 产品的测试策略与用例设计 |
| [docs/05-automation-diagnostics.md](docs/05-automation-diagnostics.md) | 自动化诊断与修复规范 |
| [docs/06-toc-patterns.md](docs/06-toc-patterns.md) | To C 常见功能模式（认证、内容、互动等） |
| [docs/07-state-management.md](docs/07-state-management.md) | 状态管理规范 |
| [docs/08-database-design.md](docs/08-database-design.md) | 数据库设计规范 |

## 模板文件

| 文件 | 用途 |
|------|------|
| [templates/plan-template.md](templates/plan-template.md) | To C 产品规划模板 |
| [templates/sprint-contract-template.md](templates/sprint-contract-template.md) | Sprint 合同模板 |
| [templates/evaluation-template.json](templates/evaluation-template.json) | 评估结果模板 |
| [templates/feedback-template.md](templates/feedback-template.md) | 反馈报告模板 |
| [templates/test-case-template.ts](templates/test-case-template.ts) | E2E 测试用例模板 |
| [templates/diagnose-config.js](templates/diagnose-config.js) | 诊断配置模板 |
| [templates/seed-data-template.js](templates/seed-data-template.js) | 测试数据填充模板 |
| [templates/env-template](templates/env-template) | 环境变量模板 |

## 快速使用

```bash
# 1. 复制模板到新项目
cp -r .harness-template my-toc-project/.harness-template

# 2. 将模板中的 harness 文件复制到项目根目录
cp -r .harness-template/templates/* .harness/

# 3. 阅读文档，按规范搭建项目
```

## 适用场景

- To C 消费级 Web 应用（内容平台、社区、工具类产品）
- 需要 Supabase / BaaS 作为后端的前端项目
- 需要 Playwright E2E 自动化测试的项目
- 团队使用 AI 辅助开发（Harness 模式）的项目

## 版本

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-03-29 | 初始版本，基于 photography-pro 总结 |

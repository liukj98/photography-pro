# Harness Engineering - 规范器 (Spec)

## 概述

规范器是整个 Harness 框架的基石，定义了产品的质量标准、评估准则和通信协议。所有生成器和评估器都必须遵循此规范。

---

## 1. 评估准则体系

### 1.1 设计质量准则 (Design Quality)

| 等级 | 描述 | 阈值 |
|------|------|------|
| A | 卓越 - 视觉惊艳，交互流畅，符合现代设计趋势 | ≥ 9.0 |
| B | 良好 - 视觉协调，无明显缺陷 | 7.0 - 8.9 |
| C | 及格 - 基本可用，但有改进空间 | 5.0 - 6.9 |
| D | 不及格 - 存在明显问题，需重写 | < 5.0 |

**检查点：**
- [ ] 视觉层次清晰
- [ ] 色彩搭配和谐
- [ ] 排版易读
- [ ] 响应式布局
- [ ] 交互反馈明确

### 1.2 原创性准则 (Originality)

| 等级 | 描述 | 阈值 |
|------|------|------|
| A | 高度原创 - 独特的设计语言 | ≥ 9.0 |
| B | 有创意 - 在参考基础上有明显改进 | 7.0 - 8.9 |
| C | 普通 - 标准实现，缺乏新意 | 5.0 - 6.9 |
| D | 抄袭 - 明显模仿或复制 | < 5.0 |

### 1.3 工艺准则 (Craftsmanship)

| 维度 | 权重 | 检查点 |
|------|------|--------|
| 代码质量 | 30% | 命名规范、注释清晰、无冗余 |
| 架构设计 | 25% | 模块划分合理、依赖清晰 |
| 性能优化 | 25% | 加载速度、渲染性能 |
| 可维护性 | 20% | 测试覆盖、文档完整 |

### 1.4 功能性准则 (Functionality)

| 测试类型 | 通过标准 |
|----------|----------|
| 单元测试 | 核心逻辑覆盖率 ≥ 80% |
| 集成测试 | 关键用户流程全部通过 |
| E2E 测试 | 使用 Playwright 验证 |
| 跨浏览器 | Chrome, Firefox, Safari |

---

## 2. Sprint 合同模板

每个 Sprint 开始前，生成器与评估器必须达成一致的合同：

```markdown
## Sprint 合同 #N

### 目标
[清晰描述本 Sprint 要交付的功能]

### 验收标准
1. [ ] 标准1: [具体描述] - 权重: X%
2. [ ] 标准2: [具体描述] - 权重: X%
3. [ ] 标准3: [具体描述] - 权重: X%

### 通过阈值
- 总分 ≥ 8.0/10
- 任意单项 ≥ 6.0/10

### 时间盒
- 预计耗时: X 小时
- 最大迭代次数: N 次
```

---

## 3. 反馈格式规范

### 3.1 评估器反馈结构

```json
{
  "sprint_id": "N",
  "iteration": "M",
  "overall_score": 7.5,
  "status": "PASS|FAIL|PARTIAL",
  "dimensions": {
    "design_quality": { "score": 8.0, "comments": [...] },
    "originality": { "score": 7.5, "comments": [...] },
    "craftsmanship": { "score": 7.0, "comments": [...] },
    "functionality": { "score": 8.0, "comments": [...] }
  },
  "actionable_items": [
    {
      "priority": "P0|P1|P2",
      "category": "design|function|performance|security",
      "description": "具体问题描述",
      "suggestion": "改进建议"
    }
  ],
  "next_step": "continue|pivot|finalize"
}
```

### 3.2 关键原则

1. **具体性**: 反馈必须具体到文件、函数、行号或 UI 元素
2. **可操作性**: 每个问题必须伴随明确的改进建议
3. **优先级**: 使用 P0(阻塞)、P1(重要)、P2(优化) 标记
4. **证据**: 截图、日志、测试报告作为附件

---

## 4. 状态传递规范

### 4.1 上下文重置时必须传递的文件

```
.harness/state/
├── sprint_current.json      # 当前 Sprint 状态
├── decisions.md             # 关键决策记录
├── tech_debt.md             # 技术债务清单
├── architecture.svg         # 架构图
└── checkpoints/
    ├── v1.0/                # 版本检查点
    └── v2.0/
```

### 4.2 状态文件格式

```json
{
  "version": "1.0.0",
  "last_updated": "2026-03-28T19:00:00Z",
  "sprint": {
    "id": 3,
    "status": "in_progress",
    "completed_tasks": [...],
    "pending_tasks": [...]
  },
  "context_summary": "300字以内的项目状态摘要",
  "key_decisions": [
    { "date": "...", "decision": "...", "rationale": "..." }
  ],
  "known_issues": [...]
}
```

---

## 5. 通信协议

### 5.1 智能体间通信方式

智能体通过读写约定的文件进行通信：

| 文件 | 写入者 | 读取者 | 说明 |
|------|--------|--------|------|
| `plan.md` | 规划器 | 生成器 | 产品规划 |
| `implementation.md` | 生成器 | 评估器 | 实现说明 |
| `evaluation.json` | 评估器 | 生成器 | 评估结果 |
| `feedback.md` | 评估器 | 生成器 | 详细反馈 |

### 5.2 消息格式

```markdown
---
from: planner|generator|evaluator
to: planner|generator|evaluator
timestamp: ISO8601
message_type: plan|implement|evaluate|feedback|request_clarification
---

## 内容
...
```

---

## 6. 迭代终止条件

### 6.1 正常终止

- 达到目标质量阈值（≥ 8.0/10）
- 连续 3 轮迭代分数提升 < 0.5
- 达到最大迭代次数上限

### 6.2 异常终止

- 出现根本性架构问题
- 技术债务累积到不可接受
- 需求理解出现重大偏差

---

## 7. 版本与演进

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-03-28 | 初始规范建立 |


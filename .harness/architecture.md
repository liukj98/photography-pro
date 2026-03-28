# Harness Engineering - 架构设计

## 核心原则

```
┌─────────────────────────────────────────────────────────────┐
│                    Harness Framework                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  抽象接口层 (Abstract)                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │  │
│  │  │  规范器   │  │  生成器   │  │  评估器   │  │ 自动化  │ │  │
│  │  │  Spec    │  │Generator │  │Evaluator │  │ Testing│ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ▲                                  │
│                           │ 实现                              │
│                           ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  具体实现层 (Concrete)                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │  │
│  │  │Markdown  │  │React+TS  │  │  Playwright Adapter  │ │  │
│  │  │  PRD     │  │   Code   │  │  (or Vitest/Cypress) │ │  │
│  │  └──────────┘  └──────────┘  └──────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**关键设计**：
- 上层定义**What**（做什么）
- 下层实现**How**（怎么做）
- 实现可替换，接口保持稳定

---

## 模块职责

### 1. 规范器 (Spec) - 质量标准定义
**抽象接口**：
- 定义质量维度（功能、设计、代码、性能、安全）
- 定义评估阈值
- 定义反馈格式

**具体实现**：
- `spec.md` - Markdown 格式的规范文档
- `spec.json` - 机器可读的配置（可选）

---

### 2. 规划器 (Planner) - 产品规划
**抽象接口**：
- 输入：用户需求
- 输出：结构化规划文档
- 约束：规划必须可执行、可验证

**具体实现**：
- `planner.md` - 规划指南模板
- `plan.md` - 生成的具体规划

---

### 3. 生成器 (Generator) - 代码实现
**抽象接口**：
- 输入：规划文档 + 评估反馈
- 输出：可运行代码
- 约束：符合规范、通过测试

**具体实现**：
- React + TypeScript + Tailwind
- Vue + TypeScript + UnoCSS（可替换）
- 任何符合接口的技术栈

---

### 4. 评估器 (Evaluator) - 质量评估
**抽象接口**：
- 输入：代码 + 规范
- 输出：评估报告
- 约束：客观、可重复、可操作

**具体实现**：
- `evaluator.md` - 人工评估指南
- 自动化评估脚本

---

### 5. 自动化测试 (Automation) - 质量保证 ⭐
**抽象接口**：
- 输入：应用代码、测试用例
- 输出：测试报告、修复建议
- 约束：可重复、可集成 CI/CD

**具体实现**（可插拔）：
- Playwright Adapter（E2E）
- Vitest Adapter（Unit）
- Cypress Adapter（E2E）
- 自定义 Adapter

---

## 编排工作流

```
用户输入
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
│  │ - 实现功能                    │  │
│  └───────────────────────────────┘  │
│           ↓ 代码                     │
│  ┌───────────────────────────────┐  │
│  │ 自动化测试 (Automation)        │  │
│  │ - 运行测试套件                 │  │
│  │ - 捕获错误                     │  │
│  │ - 自动诊断/修复                │  │
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
交付
```

---

## 接口定义

### 自动化测试接口

```typescript
// interfaces/automation.ts

/**
 * 自动化测试抽象接口
 * 任何测试框架都需要实现此接口
 */
export interface AutomationAdapter {
  name: string;
  version: string;
  
  // 初始化测试环境
  initialize(config: AutomationConfig): Promise<void>;
  
  // 运行测试套件
  run(testSuite: TestSuite): Promise<TestResult>;
  
  // 诊断错误
  diagnose(error: Error): DiagnosticResult;
  
  // 尝试自动修复
  autoFix?(issue: Issue): Promise<FixResult>;
  
  // 生成报告
  generateReport(results: TestResult[]): Report;
}

/**
 * 测试套件配置
 */
export interface TestSuite {
  name: string;
  type: 'unit' | 'integration' | 'e2e' | 'visual' | 'performance';
  testCases: TestCase[];
  config: {
    parallel: boolean;
    retries: number;
    timeout: number;
  };
}

/**
 * 单个测试用例
 */
export interface TestCase {
  id: string;
  name: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2';
  steps: TestStep[];
  expected: ExpectedResult;
}

/**
 * 测试结果
 */
export interface TestResult {
  testId: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  error?: ErrorDetails;
  screenshots?: string[];
  logs?: string[];
}

/**
 * 诊断结果
 */
export interface DiagnosticResult {
  category: 'runtime' | 'build' | 'network' | 'auth' | 'database' | 'storage' | 'ui';
  severity: 'critical' | 'error' | 'warning';
  cause: string;
  solution: string;
  autoFixable: boolean;
  fixAction?: FixAction;
}
```

---

## 具体实现：Playwright Adapter

```typescript
// adapters/playwright.adapter.ts
import { AutomationAdapter, TestSuite, TestResult } from '../interfaces/automation';

export class PlaywrightAdapter implements AutomationAdapter {
  name = 'Playwright';
  version = '1.40.0';
  
  async initialize(config: AutomationConfig): Promise<void> {
    // 初始化 Playwright
    // 启动浏览器
    // 配置测试环境
  }
  
  async run(testSuite: TestSuite): Promise<TestResult> {
    // 执行测试用例
    // 捕获屏幕截图
    // 记录性能指标
    // 返回结果
  }
  
  diagnose(error: Error): DiagnosticResult {
    // Playwright 特定的错误诊断
    // 例如：selector not found, timeout, page crash 等
  }
  
  generateReport(results: TestResult[]): Report {
    // 生成 HTML/JSON 报告
    // 包含截图、日志、性能数据
  }
}
```

---

## 配置示例

```yaml
# .harness/config.yml
automation:
  # 选择测试适配器
  adapter: playwright
  # adapter: vitest
  # adapter: cypress
  
  # 适配器配置
  adapters:
    playwright:
      browser: chromium
      headless: true
      screenshot: on-failure
      video: on-failure
      
    vitest:
      environment: jsdom
      coverage: true
      
    cypress:
      browser: chrome
      record: false
  
  # 测试套件
  suites:
    - name: auth
      type: e2e
      pattern: "tests/e2e/auth/**/*.spec.ts"
      priority: P0
      
    - name: components
      type: unit
      pattern: "src/**/*.test.ts"
      priority: P1
      
    - name: visual
      type: visual
      pattern: "tests/visual/**/*.spec.ts"
      threshold: 0.05
  
  # 自动修复配置
  autoFix:
    enabled: true
    requireApproval: true
    maxAttempts: 3
```

---

## 扩展：添加新适配器

实现 `AutomationAdapter` 接口即可添加新的测试框架：

```typescript
// adapters/vitest.adapter.ts
export class VitestAdapter implements AutomationAdapter {
  name = 'Vitest';
  
  async run(testSuite: TestSuite): Promise<TestResult> {
    // 使用 Vitest API 运行测试
  }
  
  diagnose(error: Error): DiagnosticResult {
    // Vitest 特定的错误诊断
  }
}
```

然后在配置中切换：
```yaml
automation:
  adapter: vitest
```


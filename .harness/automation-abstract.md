# Harness Engineering - 自动化测试抽象层

## 设计哲学

```
┌────────────────────────────────────────────────────────┐
│                  Automation Interface                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   execute   │  │  diagnose   │  │   autoFix   │     │
│  │   (运行)     │  │   (诊断)     │  │   (修复)     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└────────────────────────┬───────────────────────────────┘
                         │ 实现
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Playwright  │ │    Vitest    │ │    Cypress   │
│   Adapter    │ │   Adapter    │ │   Adapter    │
└──────────────┘ └──────────────┘ └──────────────┘
```

**核心思想**：
- 接口定义**能力**（能做什么）
- 适配器提供**实现**（怎么做）
- 调用者不关心具体实现

---

## 抽象接口定义

```typescript
// automation.interface.ts

/**
 * 自动化测试引擎接口
 * 所有测试适配器必须实现此接口
 */
export interface IAutomationEngine {
  readonly name: string;
  readonly version: string;
  readonly capabilities: AutomationCapability[];
  
  /**
   * 执行测试套件
   */
  execute(config: TestConfig): Promise<ExecutionResult>;
  
  /**
   * 诊断错误
   */
  diagnose(error: Error): Diagnosis;
  
  /**
   * 尝试自动修复
   */
  autoFix?(issue: Issue): Promise<FixResult>;
  
  /**
   * 生成报告
   */
  report(results: ExecutionResult[]): Report;
}

/**
 * 自动化能力枚举
 */
export type AutomationCapability = 
  | 'e2e'           // 端到端测试
  | 'unit'          // 单元测试
  | 'integration'   // 集成测试
  | 'visual'        // 视觉回归测试
  | 'performance'   // 性能测试
  | 'accessibility' // 可访问性测试
  | 'api'           // API 测试
  | 'mobile';       // 移动端测试

/**
 * 测试配置
 */
export interface TestConfig {
  type: TestType;
  target: string;           // 测试目标（URL、文件路径等）
  testCases: ITestCase[];   // 测试用例
  options: TestOptions;     // 测试选项
}

export type TestType = 'e2e' | 'unit' | 'integration' | 'visual' | 'performance';

export interface ITestCase {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  steps: ITestStep[];
  assertions: IAssertion[];
  metadata: {
    author: string;
    createdAt: string;
    tags: string[];
  };
}

export interface ITestStep {
  action: ActionType;
  target?: string;      // CSS selector, XPath, etc.
  value?: string;       // 输入值
  timeout?: number;     // 超时时间
  condition?: string;   // 前置条件
}

export type ActionType = 
  | 'navigate' | 'click' | 'type' | 'select' 
  | 'wait' | 'screenshot' | 'scroll' | 'hover'
  | 'assert' | 'api-call';

export interface IAssertion {
  type: AssertionType;
  target: string;
  expected: unknown;
  message: string;
}

export type AssertionType =
  | 'visible' | 'hidden' | 'exist' | 'not-exist'
  | 'text-equals' | 'text-contains' | 'text-matches'
  | 'attribute-equals' | 'css-equals'
  | 'url-equals' | 'url-contains'
  | 'api-status' | 'api-body';

export type Priority = 'P0' | 'P1' | 'P2';

export interface TestOptions {
  parallel: boolean;
  retries: number;
  timeout: number;
  headless: boolean;
  screenshots: 'never' | 'on-failure' | 'always';
  video: boolean;
  trace: boolean;
}

/**
 * 执行结果
 */
export interface ExecutionResult {
  config: TestConfig;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
  details: TestCaseResult[];
  artifacts: {
    screenshots: string[];
    videos: string[];
    traces: string[];
    logs: string[];
  };
  timestamp: string;
}

export interface TestCaseResult {
  testCaseId: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  steps: StepResult[];
  error?: ErrorInfo;
}

export interface StepResult {
  stepIndex: number;
  action: ActionType;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  screenshot?: string;
  error?: ErrorInfo;
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  type: ErrorType;
  recoverable: boolean;
  suggestedFix?: FixSuggestion;
}

export type ErrorType =
  | 'selector-not-found'
  | 'timeout'
  | 'assertion-failed'
  | 'network-error'
  | 'javascript-error'
  | 'api-error'
  | 'visual-mismatch'
  | 'unknown';

/**
 * 诊断结果
 */
export interface Diagnosis {
  error: Error;
  category: ErrorCategory;
  severity: Severity;
  cause: string;
  impact: string;
  suggestedFixes: FixSuggestion[];
  relatedErrors: string[];
}

export type ErrorCategory =
  | 'runtime' | 'build' | 'network' | 'auth' 
  | 'database' | 'storage' | 'ui' | 'configuration';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface FixSuggestion {
  id: string;
  description: string;
  action: FixAction;
  risk: RiskLevel;
  confidence: number;  // 0-1
  automated: boolean;
  rollbackAvailable: boolean;
}

export interface FixAction {
  type: 'code-change' | 'config-change' | 'sql-execution' | 'manual-step';
  target: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

export interface Issue {
  id: string;
  type: ErrorType;
  description: string;
  location: {
    file?: string;
    line?: number;
    column?: number;
    url?: string;
  };
  context: Record<string, unknown>;
}

export interface FixResult {
  success: boolean;
  issue: Issue;
  action: FixAction;
  error?: string;
  verification: {
    tested: boolean;
    passed: boolean;
  };
}

/**
 * 报告
 */
export interface Report {
  title: string;
  generatedAt: string;
  engine: string;
  results: ExecutionResult[];
  summary: {
    totalTests: number;
    passRate: number;
    avgDuration: number;
    topIssues: Issue[];
  };
  recommendations: string[];
  format: 'html' | 'json' | 'markdown' | 'junit';
}
```

---

## 适配器工厂

```typescript
// automation.factory.ts
import { IAutomationEngine } from './automation.interface';
import { PlaywrightAdapter } from './adapters/playwright.adapter';
import { VitestAdapter } from './adapters/vitest.adapter';
import { CypressAdapter } from './adapters/cypress.adapter';

export class AutomationFactory {
  private static adapters = new Map<string, new () => IAutomationEngine>([
    ['playwright', PlaywrightAdapter],
    ['vitest', VitestAdapter],
    ['cypress', CypressAdapter],
  ]);
  
  static register(name: string, adapter: new () => IAutomationEngine): void {
    this.adapters.set(name, adapter);
  }
  
  static create(name: string): IAutomationEngine {
    const AdapterClass = this.adapters.get(name);
    if (!AdapterClass) {
      throw new Error(`Unknown adapter: ${name}. Available: ${Array.from(this.adapters.keys()).join(', ')}`);
    }
    return new AdapterClass();
  }
  
  static list(): string[] {
    return Array.from(this.adapters.keys());
  }
}
```

---

## 使用示例

```typescript
// 使用示例
import { AutomationFactory } from './automation.factory';
import { TestConfig, Priority } from './automation.interface';

// 1. 创建引擎（通过配置切换）
const engine = AutomationFactory.create('playwright');
// const engine = AutomationFactory.create('vitest');

// 2. 定义测试配置
const config: TestConfig = {
  type: 'e2e',
  target: 'http://localhost:5173',
  testCases: [
    {
      id: 'auth-001',
      name: '用户注册流程',
      description: '验证用户能够成功注册',
      priority: Priority.P0,
      steps: [
        { action: 'navigate', target: '/register' },
        { action: 'type', target: '[name="username"]', value: 'testuser' },
        { action: 'type', target: '[name="email"]', value: 'test@example.com' },
        { action: 'type', target: '[name="password"]', value: 'Password123' },
        { action: 'click', target: 'button[type="submit"]' },
        { action: 'wait', value: '1000' },
      ],
      assertions: [
        { type: 'url-contains', target: '', expected: '/', message: '应跳转到首页' },
        { type: 'visible', target: '[data-testid="user-menu"]', expected: true, message: '应显示用户菜单' },
      ],
      metadata: {
        author: 'Harness',
        createdAt: '2026-03-28',
        tags: ['auth', 'register', 'critical'],
      },
    },
  ],
  options: {
    parallel: false,
    retries: 2,
    timeout: 30000,
    headless: true,
    screenshots: 'on-failure',
    video: false,
    trace: true,
  },
};

// 3. 执行测试
async function runTests() {
  console.log(`Using engine: ${engine.name} v${engine.version}`);
  
  const result = await engine.execute(config);
  
  console.log(`
测试完成:
- 总数: ${result.summary.total}
- 通过: ${result.summary.passed}
- 失败: ${result.summary.failed}
- 跳过: ${result.summary.skipped}
- 耗时: ${result.summary.duration}ms
  `);
  
  // 4. 处理失败的测试
  for (const detail of result.details) {
    if (detail.status === 'failed' && detail.error) {
      // 诊断错误
      const diagnosis = engine.diagnose(new Error(detail.error.message));
      console.log('诊断结果:', diagnosis);
      
      // 尝试自动修复
      if (engine.autoFix && diagnosis.suggestedFixes[0]?.automated) {
        const fixResult = await engine.autoFix({
          id: detail.testCaseId,
          type: detail.error.type,
          description: detail.error.message,
          location: {},
          context: { diagnosis },
        });
        console.log('修复结果:', fixResult);
      }
    }
  }
  
  // 5. 生成报告
  const report = engine.report([result]);
  console.log('报告已生成:', report.title);
}

runTests();
```

---

## 测试用例 DSL（领域特定语言）

为了简化测试编写，提供声明式 DSL：

```yaml
# tests/harness/auth.spec.yml
name: 认证测试套件
type: e2e
priority: P0
tags: [auth, critical]

testCases:
  - id: auth-register-001
    name: 用户注册成功
    description: 使用有效信息注册新用户
    steps:
      - navigate: /register
      - type:
          target: input[name="username"]
          value: "{{random.username}}"
      - type:
          target: input[name="email"]
          value: "{{random.email}}"
      - type:
          target: input[name="password"]
          value: "TestPass123!"
      - click: button[type="submit"]
      - wait: 2000
    assertions:
      - url-contains: /
      - visible: [data-testid="user-menu"]
      
  - id: auth-login-001
    name: 用户登录成功
    description: 使用正确凭据登录
    setup:
      - createUser:  # 前置条件
          email: "test@example.com"
          password: "TestPass123!"
    steps:
      - navigate: /login
      - type:
          target: input[name="email"]
          value: "test@example.com"
      - type:
          target: input[name="password"]
          value: "TestPass123!"
      - click: button[type="submit"]
    assertions:
      - url-contains: /
      - text-contains:
          target: [data-testid="welcome-message"]
          value: "欢迎回来"
```

DSL 会被编译为标准的 `ITestCase` 对象，然后由适配器执行。


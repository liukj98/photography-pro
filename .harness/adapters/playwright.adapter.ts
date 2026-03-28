// Playwright Adapter - AutomationEngine 的具体实现
// 将 Playwright 能力封装为 Harness 接口

import type {
  IAutomationEngine,
  TestConfig,
  ExecutionResult,
  TestCaseResult,
  StepResult,
  Diagnosis,
  Report,
  ErrorInfo,
  ErrorType,
  FixSuggestion,
  FixAction,
  Issue,
  FixResult,
  Priority,
} from '../automation-abstract';

export class PlaywrightAdapter implements IAutomationEngine {
  readonly name = 'Playwright';
  readonly version = '1.40.0';
  readonly capabilities = [
    'e2e',
    'visual',
    'api',
    'mobile',
  ] as const;

  private browser: any;
  private context: any;
  private page: any;

  async initialize(config: { headless?: boolean; slowMo?: number }): Promise<void> {
    const { chromium } = await import('playwright');
    this.browser = await chromium.launch({
      headless: config.headless ?? true,
      slowMo: config.slowMo ?? 0,
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: 'videos/' },
    });
    this.page = await this.context.newPage();
  }

  async execute(config: TestConfig): Promise<ExecutionResult> {
    const results: TestCaseResult[] = [];
    const startTime = Date.now();

    for (const testCase of config.testCases) {
      const result = await this.runTestCase(testCase, config);
      results.push(result);
    }

    const duration = Date.now() - startTime;

    return {
      config,
      summary: {
        total: results.length,
        passed: results.filter((r) => r.status === 'passed').length,
        failed: results.filter((r) => r.status === 'failed').length,
        skipped: results.filter((r) => r.status === 'skipped').length,
        duration,
      },
      details: results,
      artifacts: {
        screenshots: [],
        videos: [],
        traces: [],
        logs: [],
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async runTestCase(testCase: any, config: TestConfig): Promise<TestCaseResult> {
    const stepResults: StepResult[] = [];
    const startTime = Date.now();

    try {
      for (let i = 0; i < testCase.steps.length; i++) {
        const step = testCase.steps[i];
        const stepStart = Date.now();

        try {
          await this.executeStep(step);
          stepResults.push({
            stepIndex: i,
            action: step.action,
            status: 'passed',
            duration: Date.now() - stepStart,
          });
        } catch (error) {
          stepResults.push({
            stepIndex: i,
            action: step.action,
            status: 'failed',
            duration: Date.now() - stepStart,
            error: this.convertToErrorInfo(error),
          });
          throw error; // Stop test case on first failure
        }
      }

      // Execute assertions
      for (const assertion of testCase.assertions) {
        await this.executeAssertion(assertion);
      }

      return {
        testCaseId: testCase.id,
        status: 'passed',
        duration: Date.now() - startTime,
        steps: stepResults,
      };
    } catch (error) {
      return {
        testCaseId: testCase.id,
        status: 'failed',
        duration: Date.now() - startTime,
        steps: stepResults,
        error: this.convertToErrorInfo(error),
      };
    }
  }

  private async executeStep(step: any): Promise<void> {
    switch (step.action) {
      case 'navigate':
        await this.page.goto(step.target);
        break;
      case 'click':
        await this.page.click(step.target);
        break;
      case 'type':
        await this.page.fill(step.target, step.value);
        break;
      case 'wait':
        await this.page.waitForTimeout(parseInt(step.value));
        break;
      case 'screenshot':
        await this.page.screenshot({ path: `screenshots/${Date.now()}.png` });
        break;
      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
  }

  private async executeAssertion(assertion: any): Promise<void> {
    switch (assertion.type) {
      case 'visible':
        await this.page.waitForSelector(assertion.target, { state: 'visible' });
        break;
      case 'url-contains':
        const url = this.page.url();
        if (!url.includes(assertion.expected)) {
          throw new Error(`URL "${url}" does not contain "${assertion.expected}"`);
        }
        break;
      case 'text-contains':
        const text = await this.page.textContent(assertion.target);
        if (!text?.includes(assertion.expected as string)) {
          throw new Error(`Text does not contain "${assertion.expected}"`);
        }
        break;
      default:
        throw new Error(`Unknown assertion type: ${assertion.type}`);
    }
  }

  diagnose(error: Error): Diagnosis {
    const message = error.message;
    let errorType: ErrorType = 'unknown';
    let category = 'runtime' as const;
    let cause = 'Unknown error';
    let fixes: FixSuggestion[] = [];

    // Pattern matching for common Playwright errors
    if (message.includes('selector') && message.includes('not found')) {
      errorType = 'selector-not-found';
      category = 'ui';
      cause = 'Element not found in DOM';
      fixes = [
        {
          id: 'fix-selector-1',
          description: 'Check if selector is correct and element exists',
          action: {
            type: 'code-change',
            target: 'test file',
            content: 'Update selector to match actual DOM structure',
          } as FixAction,
          risk: 'low',
          confidence: 0.8,
          automated: false,
          rollbackAvailable: true,
        },
      ];
    } else if (message.includes('timeout')) {
      errorType = 'timeout';
      category = 'network';
      cause = 'Operation timed out';
      fixes = [
        {
          id: 'fix-timeout-1',
          description: 'Increase timeout value',
          action: {
            type: 'config-change',
            target: 'test config',
            content: 'Increase timeout from 30000 to 60000',
          } as FixAction,
          risk: 'low',
          confidence: 0.9,
          automated: true,
          rollbackAvailable: true,
        },
      ];
    } else if (message.includes('Email not confirmed')) {
      errorType = 'api-error';
      category = 'auth';
      cause = 'Supabase email confirmation is enabled';
      fixes = [
        {
          id: 'fix-auth-1',
          description: 'Disable email confirmation in Supabase Dashboard',
          action: {
            type: 'config-change',
            target: 'Supabase Auth',
            content: 'Go to Authentication > Providers > Email > Disable "Confirm email"',
          } as FixAction,
          risk: 'low',
          confidence: 0.95,
          automated: false,
          rollbackAvailable: true,
        },
        {
          id: 'fix-auth-2',
          description: 'Auto-confirm user after registration',
          action: {
            type: 'code-change',
            target: 'authStore.ts',
            content: 'Add auto-confirm logic after signUp',
          } as FixAction,
          risk: 'medium',
          confidence: 0.7,
          automated: true,
          rollbackAvailable: true,
        },
      ];
    } else if (message.includes('violates row-level security')) {
      errorType = 'api-error';
      category = message.includes('storage') ? 'storage' : 'database';
      cause = 'RLS policy is missing or too restrictive';
      fixes = [
        {
          id: 'fix-rls-1',
          description: 'Add permissive RLS policy',
          action: {
            type: 'sql-execution',
            target: 'Supabase SQL Editor',
            content: this.generateRLSFix(message),
          } as FixAction,
          risk: 'medium',
          confidence: 0.9,
          automated: true,
          rollbackAvailable: true,
        },
      ];
    }

    return {
      error,
      category,
      severity: this.calculateSeverity(errorType),
      cause,
      impact: this.calculateImpact(errorType),
      suggestedFixes: fixes,
      relatedErrors: [],
    };
  }

  private generateRLSFix(errorMessage: string): string {
    if (errorMessage.includes('storage')) {
      return `-- Fix Storage RLS
DROP POLICY IF EXISTS "Allow upload" ON storage.objects;
CREATE POLICY "Allow upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'photos');`;
    }
    return `-- Fix Table RLS
DROP POLICY IF EXISTS "Allow all" ON public.photos;
CREATE POLICY "Allow all" 
ON public.photos FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);`;
  }

  private calculateSeverity(errorType: ErrorType): 'critical' | 'high' | 'medium' | 'low' {
    const severityMap: Record<ErrorType, 'critical' | 'high' | 'medium' | 'low'> = {
      'selector-not-found': 'medium',
      'timeout': 'medium',
      'assertion-failed': 'high',
      'network-error': 'high',
      'javascript-error': 'critical',
      'api-error': 'high',
      'visual-mismatch': 'low',
      'unknown': 'medium',
    };
    return severityMap[errorType] || 'medium';
  }

  private calculateImpact(errorType: ErrorType): string {
    const impactMap: Record<ErrorType, string> = {
      'selector-not-found': 'Test cannot interact with required element',
      'timeout': 'Operation did not complete in expected time',
      'assertion-failed': 'Expected condition not met',
      'network-error': 'Cannot reach target application',
      'javascript-error': 'Application crashed or has critical error',
      'api-error': 'Backend operation failed',
      'visual-mismatch': 'UI does not match expected appearance',
      'unknown': 'Unknown impact on test execution',
    };
    return impactMap[errorType] || 'Unknown impact';
  }

  async autoFix(issue: Issue): Promise<FixResult> {
    // Implementation of automated fixes
    // This would apply the suggested fix automatically
    return {
      success: false,
      issue,
      action: {
        type: 'manual-step',
        target: 'user',
        content: 'Automated fix not implemented for this issue type',
      },
      verification: {
        tested: false,
        passed: false,
      },
    };
  }

  report(results: ExecutionResult[]): Report {
    const totalTests = results.reduce((sum, r) => sum + r.summary.total, 0);
    const totalPassed = results.reduce((sum, r) => sum + r.summary.passed, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.summary.duration, 0);

    return {
      title: 'Harness Automation Test Report',
      generatedAt: new Date().toISOString(),
      engine: `${this.name} v${this.version}`,
      results,
      summary: {
        totalTests,
        passRate: totalTests > 0 ? totalPassed / totalTests : 0,
        avgDuration: totalTests > 0 ? totalDuration / totalTests : 0,
        topIssues: this.extractTopIssues(results),
      },
      recommendations: this.generateRecommendations(results),
      format: 'html',
    };
  }

  private extractTopIssues(results: ExecutionResult[]): Issue[] {
    const issues: Issue[] = [];
    for (const result of results) {
      for (const detail of result.details) {
        if (detail.error) {
          issues.push({
            id: detail.testCaseId,
            type: detail.error.type,
            description: detail.error.message,
            location: {},
            context: {},
          });
        }
      }
    }
    return issues.slice(0, 5);
  }

  private generateRecommendations(results: ExecutionResult[]): string[] {
    const recommendations: string[] = [];
    const failedTests = results.flatMap((r) => r.details.filter((d) => d.status === 'failed'));

    if (failedTests.some((t) => t.error?.type === 'selector-not-found')) {
      recommendations.push('Review and update test selectors to match current DOM structure');
    }
    if (failedTests.some((t) => t.error?.type === 'timeout')) {
      recommendations.push('Consider increasing timeout values or optimizing application performance');
    }
    if (failedTests.some((t) => t.error?.type === 'api-error')) {
      recommendations.push('Check backend API configuration and RLS policies');
    }

    return recommendations;
  }

  private convertToErrorInfo(error: unknown): ErrorInfo {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      message: err.message,
      stack: err.stack,
      type: 'unknown',
      recoverable: false,
    };
  }

  async cleanup(): Promise<void> {
    await this.browser?.close();
  }
}

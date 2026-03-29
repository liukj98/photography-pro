# 技术栈规范

## 1. 推荐技术栈

| 层级 | 技术选择 | 版本 | 选型理由 |
|------|----------|------|----------|
| **框架** | React | 19.x | To C 产品需要丰富的生态和组件 |
| **语言** | TypeScript | 5.x | 类型安全，减少运行时错误 |
| **构建** | Vite | 8.x | 开发体验极佳，HMR 极快 |
| **样式** | Tailwind CSS | 3.x | 快速构建 UI，高度可定制 |
| **路由** | React Router DOM | 7.x | 声明式路由，支持嵌套布局 |
| **状态管理** | Zustand | 5.x | 轻量、简洁，适合 To C 中小项目 |
| **后端** | Supabase | 2.x | Auth + DB + Storage 一站式 BaaS |
| **测试** | Playwright | 1.x | E2E 测试首选，跨浏览器支持 |
| **Lint** | ESLint | 9.x | 代码质量保障 |
| **图标** | Lucide React | latest | 轻量图标库，风格统一 |
| **CSS 工具** | clsx + tailwind-merge | latest | 条件 className 合并 |

## 2. 为什么选这套栈

### 2.1 React + TypeScript + Vite
- React 生态最成熟，适合 To C 复杂交互
- TypeScript 保证代码质量，团队协作友好
- Vite 开发体验远超 CRA，构建速度快

### 2.2 Tailwind CSS
- 快速构建美观 UI，无需写自定义 CSS
- 原子化 CSS 避免样式冲突
- 响应式设计天然支持
- Dark Mode 内置支持

### 2.3 Zustand（而非 Redux）
- To C 项目状态管理需求通常较简单
- Zustand API 简洁，学习成本低
- 支持 persist 中间件，天然支持本地持久化
- 无需 Provider 包裹，减少嵌套

### 2.4 Supabase（而非自建后端）
- To C MVP 阶段无需搭建后端
- Auth + Database + Storage + RLS 一站式
- 免费tier 足够早期使用
- TypeScript 类型自动生成

### 2.5 Playwright（而非 Cypress/Vitest）
- To C 产品以用户体验为核心，E2E 测试价值最高
- Playwright 支持多浏览器、多设备
- 与 Harness 自动化诊断体系天然集成
- 测试失败自动截图/录屏

## 3. 核心依赖说明

### 必选依赖

```json
{
  "dependencies": {
    "react": "^19.x",
    "react-dom": "^19.x",
    "react-router-dom": "^7.x",
    "@supabase/supabase-js": "^2.x",
    "zustand": "^5.x",
    "clsx": "^2.x",
    "tailwind-merge": "^3.x",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "latest",
    "typescript": "~5.x",
    "tailwindcss": "^3.x",
    "postcss": "latest",
    "autoprefixer": "latest",
    "eslint": "^9.x",
    "eslint-plugin-react-hooks": "latest",
    "eslint-plugin-react-refresh": "latest",
    "typescript-eslint": "latest",
    "@playwright/test": "^1.x",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@types/node": "latest"
  }
}
```

### 可选依赖（按需添加）

| 依赖 | 场景 |
|------|------|
| `date-fns` | 日期格式化 |
| `framer-motion` | 复杂动画 |
| `react-query` / `@tanstack/react-query` | 服务端状态缓存（大规模数据） |
| `zod` | 运行时类型校验 |
| `react-dropzone` | 文件上传 |
| `react-hot-toast` | 替代自建 Toast |
| `swiper` | 轮播/滑动组件 |

## 4. 配置文件规范

### 4.1 Tailwind 配置

```javascript
// tailwind.config.js - To C 推荐配置
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 使用 CSS 变量实现主题切换
        background: 'var(--background)',
        surface: { DEFAULT: 'var(--surface)', hover: 'var(--surface-hover)' },
        primary: { DEFAULT: 'var(--primary)', hover: 'var(--primary-hover)' },
        secondary: 'var(--secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        border: 'var(--border)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-in': 'slideIn 0.2s ease-out forwards',
      },
    },
  },
};
```

**关键设计**：
- 使用 CSS 变量实现主题切换（light/dark）
- 字体栈包含中文字体回退
- 内置常用动画

### 4.2 ESLint 配置

```javascript
// eslint.config.js - ESLint 9 flat config
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
]);
```

### 4.3 Playwright 配置

```typescript
// playwright.config.ts - To C 项目配置
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.4 Vite 配置

```typescript
// vite.config.ts - 基础配置
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

To C 项目通常不需要复杂 Vite 配置，保持简洁即可。

## 5. 环境变量规范

```
# .env.example
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_ENV=development
```

- 开发环境：`.env.development`
- 生产环境：`.env.production`
- 两个文件都加入 `.gitignore`

## 6. 不推荐的技术选择

| 技术 | 不推荐原因 | 替代方案 |
|------|-----------|----------|
| Redux | To C 项目通常过度设计 | Zustand |
| CSS Modules | 与 Tailwind 冲突 | Tailwind |
| Next.js | To C SPA 通常不需要 SSR | Vite + React |
| Cypress | 配置复杂，速度较慢 | Playwright |
| styled-components | 运行时开销，与 Tailwind 冗余 | Tailwind |
| Axios | Supabase SDK 自带请求能力 | 直接使用 fetch / Supabase SDK |

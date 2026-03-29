# To C 项目结构规范

## 1. 标准目录结构

```
{project-name}/
├── index.html                          # HTML 入口
├── package.json                        # 项目配置
├── vite.config.ts                      # Vite 配置
├── tailwind.config.js                  # Tailwind 配置
├── eslint.config.js                    # ESLint 9 配置
├── playwright.config.ts                # Playwright E2E 配置
├── tsconfig.json                       # TypeScript 配置
├── postcss.config.js                   # PostCSS 配置
│
├── public/                             # 静态资源（不经过构建）
│   ├── favicon.svg
│   └── logo.svg
│
├── src/                                # 源代码
│   ├── main.tsx                        # 应用入口
│   ├── App.tsx                         # 根组件（路由配置）
│   ├── index.css                       # 全局样式 + Tailwind 指令
│   │
│   ├── assets/                         # 静态资源（经过构建处理）
│   │   └── images/
│   │
│   ├── components/                     # 组件目录
│   │   ├── ui/                         # 通用 UI 组件（可跨项目复用）
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── LazyImage.tsx           # 图片懒加载
│   │   │   └── ThemeSwitcher.tsx       # 主题切换
│   │   │
│   │   ├── layout/                     # 布局组件
│   │   │   ├── Header.tsx              # 公共导航栏
│   │   │   ├── Footer.tsx              # 公共页脚
│   │   │   └── Sidebar.tsx             # 侧边栏（可选）
│   │   │
│   │   ├── auth/                       # 认证相关组件
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ProtectedRoute.tsx      # 路由守卫
│   │   │   └── UserAvatar.tsx
│   │   │
│   │   └── interactions/               # 互动功能组件
│   │       ├── LikeButton.tsx
│   │       ├── FavoriteButton.tsx
│   │       ├── CommentSection.tsx
│   │       └── ShareButton.tsx
│   │
│   ├── pages/                          # 页面组件（每个文件 = 一个路由）
│   │   ├── Home.tsx                    # 首页
│   │   ├── Login.tsx                   # 登录页
│   │   ├── Register.tsx                # 注册页
│   │   ├── Explore.tsx                 # 发现/浏览页
│   │   ├── Profile.tsx                 # 个人主页（公开）
│   │   ├── Settings.tsx                # 个人设置（受保护）
│   │   ├── NotFound.tsx                # 404 页面
│   │   └── ...                         # 其他业务页面
│   │
│   ├── hooks/                          # 自定义 Hooks
│   │   ├── useAuth.ts                  # 认证逻辑
│   │   ├── usePhotos.ts               # 内容 CRUD
│   │   └── useInteractions.ts          # 互动功能
│   │
│   ├── stores/                         # Zustand 状态管理
│   │   ├── authStore.ts               # 认证状态
│   │   ├── themeStore.ts              # 主题状态
│   │   ├── toastStore.ts              # 全局通知状态
│   │   └── interactionStore.ts        # 互动状态
│   │
│   ├── types/                          # TypeScript 类型定义
│   │   └── index.ts                   # 集中导出所有类型
│   │
│   └── lib/                            # 工具库
│       ├── supabase.ts                 # Supabase 客户端
│       ├── utils.ts                    # 通用工具函数
│       └── constants.ts               # 常量定义
│
├── supabase/                           # 数据库相关
│   ├── init-dev.sql                   # 开发环境初始化脚本
│   ├── migrations/                    # 增量迁移文件
│   └── setup.md                       # 数据库设置说明
│
├── tests/                              # 测试文件
│   ├── e2e/                           # Playwright E2E 测试
│   │   ├── auth.spec.ts              # 认证流程测试
│   │   ├── explore.spec.ts           # 浏览流程测试
│   │   ├── interaction.spec.ts       # 互动功能测试
│   │   └── ...                       # 其他功能测试
│   ├── helpers/                       # 测试辅助函数
│   │   └── diagnose.ts              # 错误诊断助手
│   ├── fixtures/                      # 测试夹具
│   └── auto-fix.cjs                   # 自动修复脚本
│
├── scripts/                            # 工具脚本
│   ├── seed-data.js                   # 测试数据填充
│   ├── auto-commit.cjs               # 自动 Git 提交
│   └── README.md                     # 脚本使用说明
│
├── .harness/                           # Harness 工程规范（运行时）
│   ├── README.md
│   ├── spec.md                        # 质量标准
│   ├── planner.md                     # 规划指南
│   ├── generator.md                   # 开发指南
│   ├── evaluator.md                   # 评估指南
│   ├── automation.md                  # 自动化规范
│   ├── automation-abstract.md         # 测试抽象接口
│   ├── adapters/                      # 测试适配器
│   ├── scripts/diagnose.js           # 诊断脚本
│   ├── templates/                     # 文档模板
│   ├── output/                        # 生成物
│   └── state/                         # 状态文件
│
├── .harness-template/                  # 工程规范模板（本目录）
│
├── .env.example                        # 环境变量模板
├── .env.development                    # 开发环境配置（gitignore）
├── .env.production                     # 生产环境配置（gitignore）
│
└── README.md                           # 项目说明
```

## 2. 文件命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 页面组件 | PascalCase | `Profile.tsx`, `NotFound.tsx` |
| 通用组件 | PascalCase | `Button.tsx`, `LazyImage.tsx` |
| 自定义 Hook | camelCase + use 前缀 | `useAuth.ts`, `usePhotos.ts` |
| Store | camelCase + Store 后缀 | `authStore.ts`, `toastStore.ts` |
| 工具函数 | camelCase | `utils.ts`, `supabase.ts` |
| 类型文件 | camelCase | `index.ts` (types 目录下) |
| E2E 测试 | camelCase + .spec.ts | `auth.spec.ts` |
| SQL 文件 | kebab-case | `init-dev.sql`, `add-comments.sql` |

## 3. 组件分层原则

```
┌─────────────────────────────────┐
│  Pages（页面）                    │  路由级组件，组合多个模块
│  Home.tsx, Profile.tsx          │
├─────────────────────────────────┤
│  Feature Components（功能组件）   │  业务功能封装
│  auth/, interactions/           │
├─────────────────────────────────┤
│  Layout Components（布局组件）    │  页面骨架
│  Header, Footer, Sidebar        │
├─────────────────────────────────┤
│  UI Components（基础组件）        │  无业务逻辑，可复用
│  Button, Card, Input, Toast     │
└─────────────────────────────────┘
```

**依赖方向**：上层依赖下层，禁止反向依赖。

## 4. To C 项目特有目录说明

### `components/auth/` - 认证组件
To C 项目的核心，所有涉及用户身份的 UI 组件。

### `components/interactions/` - 互动组件
点赞、收藏、评论、分享等 To C 社交功能组件。

### `supabase/` - 数据库
To C 项目使用 Supabase 作为 BaaS，数据库脚本集中管理。

### `scripts/seed-data.js` - 测试数据
To C 产品冷启动时需要填充种子数据（测试用户、示例内容等）。

### `tests/e2e/` - 用户旅程测试
To C 产品以 E2E 测试为核心，覆盖完整用户旅程。

## 5. package.json scripts 规范

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "seed": "node scripts/seed-data.js",

    "harness:test": "playwright test",
    "harness:test:ui": "playwright test --ui",
    "harness:report": "playwright show-report",
    "harness:auto-test": "playwright test --reporter=list",
    "harness:auto-fix": "node tests/auto-fix.cjs",
    "harness:diagnose": "node .harness/scripts/diagnose.js"
  }
}
```

**命名约定**：
- 基础命令：`dev`, `build`, `lint`, `preview`
- 数据脚本：`seed`
- Harness 命令统一使用 `harness:` 前缀

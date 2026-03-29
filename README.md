# Photography Pro

一个基于 React + TypeScript + Supabase 的专业摄影作品展示平台。

## 功能特性

- 📸 **作品管理**：上传、编辑、删除摄影作品
- 🏷️ **分类标签**：支持多种摄影分类和标签系统
- 📷 **EXIF 信息**：展示相机、镜头、光圈等拍摄参数
- 👤 **用户系统**：注册、登录、个人主页
- ❤️ **互动功能**：点赞、收藏、浏览统计
- 💬 **评论系统**：作品下方评论互动
- 🎨 **响应式设计**：适配桌面和移动端

## 技术栈

- **前端**：React 19 + TypeScript + Vite
- **样式**：Tailwind CSS
- **状态管理**：Zustand
- **后端**：Supabase (PostgreSQL + Auth + Storage)
- **测试**：Playwright

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd photography-pro
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env.development
cp .env.example .env.production
```

编辑 `.env.development` 填入开发环境配置：

```env
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_dev_anon_key
VITE_APP_ENV=development
```

编辑 `.env.production` 填入生产环境配置：

```env
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_APP_ENV=production
```

### 4. 初始化数据库

在 Supabase SQL Editor 中执行 `supabase/init-dev.sql` 创建所有表结构。

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

## 环境隔离

项目支持开发环境和生产环境的数据隔离：

| 命令 | 环境 | 数据来源 |
|------|------|----------|
| `npm run dev` | 开发环境 | `.env.development` |
| `npm run build` | 生产环境 | `.env.production` |

### 开发环境配置建议

在开发环境的 Supabase Dashboard 中：

1. **关闭邮箱验证**：Authentication → Providers → Email → Confirm email: OFF
2. **创建 Storage Bucket**：Storage → New Bucket → `photos` (Public)
3. **设置 Storage 权限**：允许认证用户上传，公开访问

## 可用脚本

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run preview          # 预览生产构建

# 代码质量
npm run lint             # 运行 ESLint

# 测试数据
npm run seed             # 批量创建测试用户和照片

# 自动化测试
npm run harness:test     # 运行 Playwright 测试
npm run harness:test:ui  # 运行测试（UI 模式）
```

## 测试账号

运行 `npm run seed` 后会创建以下测试账号：

| 用户名 | 邮箱 | 密码 |
|--------|------|------|
| test_user1 | test1@example.com | Test123456! |
| test_user2 | test2@example.com | Test123456! |
| test_user3 | test3@example.com | Test123456! |
| photographer_a | photo@example.com | Test123456! |
| artist_demo | artist@example.com | Test123456! |

## 项目结构

```
photography-pro/
├── public/              # 静态资源
├── src/
│   ├── components/      # 组件
│   ├── hooks/           # 自定义 Hooks
│   ├── lib/             # 工具库/Supabase 客户端
│   ├── pages/           # 页面组件
│   ├── stores/          # Zustand 状态管理
│   ├── types/           # TypeScript 类型定义
│   ├── App.tsx          # 根组件
│   └── main.tsx         # 入口文件
├── supabase/
│   ├── migrations/      # 数据库迁移文件
│   └── init-dev.sql     # 开发环境初始化脚本
├── scripts/
│   ├── seed-data.js     # 测试数据填充脚本
│   └── README.md        # 脚本使用说明
├── .env.example         # 环境变量模板
├── .env.development     # 开发环境配置（不提交）
├── .env.production      # 生产环境配置（不提交）
└── package.json
```

## 部署

构建生产版本：

```bash
npm run build
```

将 `dist` 目录部署到你的服务器，或连接 Supabase Hosting / Vercel / Netlify。

## 开发指南

### 添加新功能

1. 在 `src/types/index.ts` 添加类型定义
2. 在 `src/pages/` 创建页面组件
3. 在 `src/components/` 创建可复用组件
4. 如需后端支持，在 `supabase/migrations/` 添加迁移文件

### 数据库变更

修改数据库结构后，记得更新 `supabase/init-dev.sql` 和 `supabase/migrations/` 中的迁移文件。

## License

MIT

# 产品规划: Photography Pro 摄影平台

## 1. 产品概述 (Product Overview)

### 1.1 一句话描述
一个专业的摄影爱好者社区平台，支持用户注册登录、上传摄影作品、浏览发现优质内容、追踪访问数据，打造完整的摄影创作与分享体验。

### 1.2 目标用户
- **主要用户**: 18-45 岁的摄影爱好者、业余摄影师、专业摄影师
- **使用场景**: 
  - 展示个人摄影作品
  - 发现和学习他人作品
  - 追踪作品受欢迎程度
  - 建立摄影师个人品牌

### 1.3 核心价值主张
1. **完整的创作展示**: 精美的作品画廊和个人主页
2. **数据驱动成长**: 详细的访问统计和互动数据
3. **社区发现**: 发现优秀摄影师和作品
4. **流畅体验**: 优雅的交互设计和响应式适配

---

## 2. 功能规格 (Feature Specification)

### 2.1 功能列表

| 优先级 | 功能模块 | 功能描述 | 验收标准 | 预估工时 |
|--------|----------|----------|----------|----------|
| P0 | 用户认证 | 注册、登录、登出、密码重置 | JWT 认证流程完整，表单验证完善 | 6h |
| P0 | 作品展示 | 图片画廊、作品详情、分类筛选 | Masonry 布局，懒加载，Lightbox | 8h |
| P0 | 个人主页 | 用户资料、作品集、访问量展示 | 响应式布局，数据展示完整 | 6h |
| P1 | 访问统计 | 作品浏览量、个人主页访问量 | 数据可视化图表，实时更新 | 4h |
| P1 | 作品管理 | 上传作品、编辑信息、删除 | 拖拽上传，图片压缩，表单验证 | 5h |
| P1 | 发现探索 | 首页推荐、热门作品、搜索 | 无限滚动，筛选功能 | 4h |
| P2 | 互动功能 | 点赞、收藏、评论 | 实时更新，防重复提交 | 4h |
| P2 | 用户设置 | 个人资料编辑、通知设置 | 表单验证，头像上传 | 3h |

### 2.2 用户旅程 (User Journeys)

#### 旅程 1: 新用户注册并发布首作品
```
访客 → 首页 → 点击注册 → 填写信息 → 邮箱验证 → 登录成功 
→ 进入个人主页 → 点击上传 → 拖拽图片 → 填写信息 → 发布成功
→ 查看作品 → 看到访问数据增长
```

#### 旅程 2: 浏览发现摄影作品
```
访客/用户 → 进入首页 → 浏览推荐作品 → 点击图片 → Lightbox 预览 
→ 查看作品详情 → 查看作者主页 → 浏览更多作品 → 关注作者
```

#### 旅程 3: 追踪作品数据
```
登录用户 → 进入个人主页 → 查看访问统计仪表盘 
→ 查看单作品数据 → 分析趋势 → 调整创作方向
```

#### 旅程 4: 管理个人内容
```
登录用户 → 个人主页 → 作品管理 → 编辑作品信息 
→ 删除不满意作品 → 调整展示顺序
```

### 2.3 页面清单

| 页面 | 路由 | 核心功能 | 复杂度 | 权限 |
|------|------|----------|--------|------|
| 首页/发现 | / | 推荐作品、搜索、分类筛选 | 高 | 公开 |
| 登录 | /login | 邮箱/用户名登录、记住我 | 中 | 公开 |
| 注册 | /register | 用户注册、邮箱验证 | 中 | 公开 |
| 重置密码 | /reset-password | 密码重置流程 | 低 | 公开 |
| 个人主页 | /u/:username | 用户资料、作品集、访问量 | 高 | 公开 |
| 作品详情 | /photo/:id | 大图展示、EXIF 信息、互动 | 中 | 公开 |
| 作品上传 | /upload | 拖拽上传、表单填写 | 高 | 登录 |
| 作品管理 | /manage | 作品列表、编辑、删除 | 中 | 登录 |
| 数据统计 | /stats | 访问趋势、热门作品 | 高 | 登录 |
| 用户设置 | /settings | 资料编辑、账号设置 | 中 | 登录 |

---

## 3. 技术设计 (Technical Design)

### 3.1 技术栈

| 层级 | 技术选择 | 选型理由 |
|------|----------|----------|
| 前端框架 | React 18 + TypeScript | 组件化开发，类型安全 |
| 样式方案 | Tailwind CSS + Headless UI | 原子化 CSS，无障碍组件 |
| 状态管理 | Zustand | 轻量级，TypeScript 友好 |
| 路由 | React Router v6 | 声明式路由，嵌套路由支持 |
| 构建工具 | Vite | 快速冷启动，HMR |
| 后端服务 | Supabase | 开箱即用的 Auth + DB + Storage |
| 数据库 | PostgreSQL (via Supabase) | 关系型数据库，JSON 支持 |
| 图片存储 | Supabase Storage | 与 Supabase 深度集成 |
| 部署 | Vercel | 前端一键部署，CDN 加速 |

### 3.2 数据模型

```typescript
// 用户实体
interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

// 作品实体
interface Photo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url: string;
  category: 'landscape' | 'portrait' | 'street' | 'nature' | 'architecture' | 'other';
  tags: string[];
  exif_data?: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutter?: string;
    iso?: number;
    focal_length?: string;
  };
  views_count: number;
  likes_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// 访问统计实体
interface ViewStats {
  id: string;
  user_id: string;
  photo_id?: string;
  view_type: 'profile' | 'photo';
  viewer_ip?: string;
  viewer_user_id?: string;
  created_at: string;
}

// 互动实体 (P2)
interface Like {
  id: string;
  user_id: string;
  photo_id: string;
  created_at: string;
}

interface Favorite {
  id: string;
  user_id: string;
  photo_id: string;
  created_at: string;
}
```

### 3.3 API 设计

| 方法 | 端点 | 功能 | 认证 |
|------|------|------|------|
| POST | /auth/signup | 用户注册 | 否 |
| POST | /auth/login | 用户登录 | 否 |
| POST | /auth/logout | 用户登出 | 是 |
| POST | /auth/reset-password | 密码重置 | 否 |
| GET | /users/:username | 获取用户资料 | 否 |
| PATCH | /users/me | 更新个人资料 | 是 |
| GET | /photos | 获取作品列表(分页) | 否 |
| GET | /photos/:id | 获取作品详情 | 否 |
| POST | /photos | 上传作品 | 是 |
| PATCH | /photos/:id | 更新作品信息 | 是 |
| DELETE | /photos/:id | 删除作品 | 是 |
| GET | /users/:username/stats | 获取访问统计 | 是(本人) |
| GET | /users/:username/photos | 获取用户作品 | 否 |
| POST | /photos/:id/view | 记录浏览 | 否 |
| POST | /photos/:id/like | 点赞作品 | 是 |

### 3.4 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (React)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Auth   │ │  Photo  │ │  Stats  │ │  User   │           │
│  │ Module  │ │ Module  │ │ Module  │ │ Module  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       └────────────┴───────────┴───────────┘                 │
│                    Zustand Store                             │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│                     Supabase Platform                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Auth       │  │  PostgreSQL │  │  Storage            │  │
│  │  (GoTrue)   │  │  Database   │  │  (Image Assets)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 视觉与交互设计 (Visual & UX Design)

### 4.1 设计语言

- **整体风格**: 现代极简，深色优先，突出摄影作品
- **色彩系统**:
  - 背景主色: #0a0a0a (深色模式) / #ffffff (浅色模式)
  - 表面色: #171717 / #f5f5f5
  - 主色: #3b82f6 (蓝色)
  - 辅助色: #8b5cf6 (紫色)
  - 成功: #22c55e
  - 警告: #f59e0b
  - 错误: #ef4444
  - 文字主色: #fafafa / #171717
  - 文字次色: #a3a3a3 / #737373
- **字体**: 
  - 中文: "Noto Sans SC", "PingFang SC", "Microsoft YaHei"
  - 英文: "Inter", system-ui
  - 代码: "JetBrains Mono"
- **圆角**: 
  - 大组件: 16px
  - 中组件: 12px
  - 小组件: 8px
  - 按钮: 9999px (全圆角)
- **阴影**: 
  - 卡片: 0 4px 6px -1px rgba(0, 0, 0, 0.3)
  - 悬浮: 0 20px 25px -5px rgba(0, 0, 0, 0.5)

### 4.2 布局原则

- **网格系统**: 12 列响应式网格
- **间距系统**: 4px 基准 (4, 8, 12, 16, 24, 32, 48, 64)
- **最大宽度**: 
  - 内容区: 1280px
  - 阅读区: 720px
- **响应式断点**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### 4.3 关键交互

| 交互 | 触发方式 | 动画效果 | 预期体验 |
|------|----------|----------|----------|
| 页面过渡 | 路由切换 | 淡入 200ms + 轻微上移 | 流畅自然 |
| 图片加载 | 进入视口 | 模糊到清晰渐变 | 渐进呈现 |
| Lightbox | 点击图片 | 缩放展开 300ms cubic-bezier | 沉浸式 |
| 表单提交 | 点击提交 | 按钮 Loading 状态 | 明确反馈 |
| 悬浮卡片 | 鼠标悬停 | 上移 4px + 阴影增强 | 可交互提示 |
| 下拉菜单 | 点击触发 | 缩放 + 淡入 150ms | 即时响应 |
| Toast 通知 | 操作触发 | 滑入 + 自动消失 | 不打断流程 |
| 无限滚动 | 滚动到底部 | Loading 骨架屏 | 无缝加载 |

### 4.4 组件规范

**按钮**:
- Primary: 蓝色背景，白色文字，全圆角
- Secondary: 透明背景，边框
- Ghost: 透明，悬浮显示背景

**卡片**:
- 图片卡片: 圆角 12px，悬浮阴影
- 信息卡片: 表面色背景，圆角 16px

**表单**:
- 输入框: 边框高亮，聚焦时主色边框
- 错误状态: 红色边框 + 错误提示

### 4.5 参考与灵感

- [Unsplash](https://unsplash.com) - 简洁的图片展示布局
- [500px](https://500px.com) - 摄影师社区设计
- [Behance](https://behance.net) - 作品集展示方式

---

## 5. AI 功能特性 (AI Features)

| 功能 | AI 应用场景 | 技术方案 |
|------|-------------|----------|
| 智能标签 | 上传图片后自动识别内容生成标签 | 调用 Vision API 分析图片 |
| 图片优化 | 自动调整图片最佳展示尺寸 | Sharp.js 服务端处理 |
| 相似推荐 | 基于浏览历史推荐相似作品 | 协同过滤算法 (P2) |
| 趋势预测 | 预测作品受欢迎程度 | 基于历史数据分析 (P2) |

---

## 6. 项目结构 (Project Structure)

```
photography-pro/
├── src/
│   ├── components/          # 组件目录
│   │   ├── ui/             # 基础 UI 组件
│   │   ├── auth/           # 认证相关组件
│   │   ├── photo/          # 图片相关组件
│   │   ├── layout/         # 布局组件
│   │   └── stats/          # 统计组件
│   ├── pages/              # 页面组件
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Profile.tsx
│   │   ├── PhotoDetail.tsx
│   │   ├── Upload.tsx
│   │   ├── Manage.tsx
│   │   ├── Stats.tsx
│   │   └── Settings.tsx
│   ├── hooks/              # 自定义 Hooks
│   ├── stores/             # Zustand Store
│   ├── lib/                # 工具函数
│   │   ├── supabase.ts     # Supabase 客户端
│   │   └── utils.ts        # 通用工具
│   ├── types/              # TypeScript 类型
│   └── styles/             # 全局样式
├── public/                 # 静态资源
├── supabase/               # Supabase 配置
│   ├── migrations/         # 数据库迁移
│   └── functions/          # Edge Functions
├── tests/                  # 测试文件
├── .env.example            # 环境变量示例
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 7. 里程碑与排期 (Milestones)

| 阶段 | 目标 | 功能范围 | 预计工时 | 依赖 |
|------|------|----------|----------|------|
| **MVP** | 核心功能可用 | 认证、作品展示、个人主页 | 20h | 无 |
| **V1.0** | 完整体验 | +上传管理、访问统计、响应式 | 15h | MVP |
| **V1.5** | 增强功能 | +互动功能、搜索发现 | 10h | V1.0 |
| **V2.0** | 高级特性 | +AI 功能、推荐算法 | 12h | V1.5 |

---

## 8. 风险与假设 (Risks & Assumptions)

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Supabase 免费额度限制 | 中 | 中 | 监控用量，准备升级方案 |
| 图片加载性能问题 | 中 | 高 | 使用 CDN、懒加载、渐进加载 |
| 移动端适配复杂 | 低 | 中 | Tailwind 响应式优先设计 |
| 用户数据隐私合规 | 中 | 高 | 遵守 GDPR，提供数据导出/删除 |
| 浏览器兼容性问题 | 低 | 低 | 测试主流浏览器，提供降级方案 |

### 假设

1. 用户使用现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)
2. 用户有基本的互联网使用经验
3. Supabase 服务稳定可用
4. 图片上传大小限制在 10MB 以内

---

## 附录

### A. 术语表

| 术语 | 定义 |
|------|------|
| Lightbox | 点击图片后弹出的全屏图片查看器 |
| Masonry | 瀑布流布局，图片高度不一的网格布局 |
| EXIF | 图片的元数据，包含相机、曝光等信息 |
| JWT | JSON Web Token，用于用户认证 |

### B. 性能目标

| 指标 | 目标 |
|------|------|
| 首屏加载时间 | < 2s |
| 可交互时间 | < 3.5s |
| 图片首屏加载 | < 1.5s |
| Lighthouse 性能分 | > 90 |
| Lighthouse 可访问性 | > 95 |

---

**规划版本**: v1.0  
**创建时间**: 2026-03-28  
**规划器**: Planner AI


# 开发环境测试脚本

## seed-data.js - 批量测试数据填充

用于在开发环境快速创建测试用户和照片数据。

### 功能

- 自动创建 5 个测试用户
- 每个用户上传 3-5 张随机照片
- 自动填充 EXIF 数据、标签等信息

### 使用方法

#### 1. 确保开发环境配置正确

`.env.development` 文件已配置：
```env
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_dev_anon_key
```

#### 2. 运行脚本

```bash
npm run seed
```

或直接使用 node：
```bash
node scripts/seed-data.js
```

### 测试账号

脚本会创建以下账号（如果已存在则直接登录）：

| 用户名 | 邮箱 | 密码 |
|--------|------|------|
| test_user1 | test1@example.com | Test123456! |
| test_user2 | test2@example.com | Test123456! |
| test_user3 | test3@example.com | Test123456! |
| photographer_a | photo@example.com | Test123456! |
| artist_demo | artist@example.com | Test123456! |

### 注意事项

1. 此脚本仅用于开发环境测试
2. 使用 picsum.photos 提供测试图片
3. 图片会自动上传到 Supabase Storage
4. 脚本会跳过已存在的用户（尝试登录）
5. 建议开发环境关闭邮箱验证功能

### 开发环境邮箱验证设置

Supabase Dashboard → Authentication → Providers → Email → Confirm email: **OFF**

这样注册后可以立即登录，无需验证邮箱。

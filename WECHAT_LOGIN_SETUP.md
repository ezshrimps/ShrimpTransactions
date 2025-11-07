# 微信登录配置指南

## 前置要求

1. **微信开放平台账号**
   - 访问 [微信开放平台](https://open.weixin.qq.com/)
   - 注册并认证开发者账号
   - 创建网站应用（Web 应用）

2. **获取微信 AppID 和 AppSecret**
   - 在微信开放平台 → 管理中心 → 网站应用
   - 创建应用后，获取 **AppID** 和 **AppSecret**

3. **配置授权回调域名**
   - 在应用设置中，添加授权回调域名
   - 例如：`transactions.ezshrimps.com`（不要带 `http://` 或 `https://`）

## 环境变量配置

在项目根目录的 `.env.local` 文件中添加：

```env
# 微信登录配置
WECHAT_APP_ID=你的微信AppID
WECHAT_APP_SECRET=你的微信AppSecret

# Supabase 服务端密钥（必需，用于创建用户）
# 在 Supabase Dashboard → Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key
```

## Supabase 配置

### 1. 获取 Service Role Key

1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击 **Settings** → **API**
4. 找到 **service_role** key（⚠️ 注意：这是敏感密钥，不要暴露给前端）
5. 复制并添加到 `.env.local`

### 2. 配置回调 URL

在 Supabase Dashboard → **Authentication** → **URL Configuration** 中：

- **Site URL**: `https://transactions.ezshrimps.com`（你的域名）
- **Redirect URLs**: 添加以下 URL：
  - `https://transactions.ezshrimps.com/**`
  - `https://transactions.ezshrimps.com/auth/wechat/callback`

## 部署配置

### Vercel 环境变量

在 Vercel Dashboard → 你的项目 → **Settings** → **Environment Variables** 中添加：

```
WECHAT_APP_ID=你的微信AppID
WECHAT_APP_SECRET=你的微信AppSecret
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key
```

⚠️ **重要**：`SUPABASE_SERVICE_ROLE_KEY` 是敏感信息，确保：
- 只在服务端使用（不会暴露给前端）
- 不要提交到 Git
- 只在 Vercel 环境变量中配置

## 测试微信登录

1. **本地测试**：
   ```bash
   npm run dev
   ```
   - 访问 `http://localhost:3000`
   - 点击"微信登录"按钮
   - 使用微信扫码登录

2. **生产环境测试**：
   - 确保所有环境变量已配置
   - 确保微信开放平台中配置的回调域名正确
   - 访问你的网站，测试微信登录流程

## 登录流程说明

1. 用户点击"微信登录"
2. 跳转到微信授权页面
3. 用户扫码或确认授权
4. 微信回调到 `/api/auth/wechat/callback`
5. 后端获取用户信息，创建/查找 Supabase 用户
6. 生成 Supabase session
7. 前端完成登录，跳转回首页

## 常见问题

### Q: 提示"微信登录未配置"
**A**: 检查 `.env.local` 中是否配置了 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`

### Q: 提示"需要配置 SUPABASE_SERVICE_ROLE_KEY"
**A**: 
1. 在 Supabase Dashboard 获取 service_role key
2. 添加到 `.env.local`（本地）和 Vercel 环境变量（生产）

### Q: 微信授权后提示"redirect_uri 参数错误"
**A**: 
1. 检查微信开放平台中配置的授权回调域名
2. 确保域名格式正确（不带协议，如：`transactions.ezshrimps.com`）
3. 确保回调 URL 路径正确：`/api/auth/wechat/callback`

### Q: 登录后无法获取用户信息
**A**: 
1. 检查微信应用是否已通过审核（未审核的应用可能无法获取用户信息）
2. 检查授权 scope 是否正确（代码中使用 `snsapi_userinfo`）

### Q: 生产环境登录失败
**A**: 
1. 确保 Vercel 环境变量已配置
2. 确保微信开放平台中配置的是生产域名
3. 检查 Supabase 的 Redirect URLs 是否包含生产域名

## 安全注意事项

1. **Service Role Key**：
   - ⚠️ 永远不要暴露给前端
   - ⚠️ 只在服务端 API 路由中使用
   - ⚠️ 不要提交到 Git

2. **微信 AppSecret**：
   - ⚠️ 同样敏感，只在服务端使用
   - ⚠️ 不要提交到 Git

3. **HTTPS**：
   - 生产环境必须使用 HTTPS
   - 微信 OAuth 要求回调 URL 必须是 HTTPS

## 下一步

配置完成后：
1. 重启开发服务器（如果本地测试）
2. 重新部署到 Vercel（如果生产环境）
3. 测试微信登录功能

如有问题，请查看浏览器控制台和服务器日志。


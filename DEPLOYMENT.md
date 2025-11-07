# 虾米记账本 - 部署指南

## 已完成的准备工作 ✅

- [x] 代码已推送到 GitHub: https://github.com/ezshrimps/ShrimpTransactions
- [x] Supabase 客户端已集成
- [x] API 路由已迁移到云端
- [x] 用户认证已实现
- [x] README 已更新

## 你需要完成的步骤

### 第一步：在 Supabase 创建数据表（必须）

1. 登录 [supabase.com](https://supabase.com)
2. 进入你的项目：https://mbuepmpgwnlcfclliyed.supabase.co
3. 点击左侧 **SQL Editor**
4. 点击 "New query"，粘贴以下 SQL 并执行：

```sql
-- 创建账单表
create table if not exists public.bills (
  id text primary key,
  name text not null,
  raw_input text,
  created_at timestamptz default now(),
  user_id text
);

-- 添加索引（提高查询性能）
create index if not exists bills_user_id_idx on public.bills(user_id);
create index if not exists bills_created_at_idx on public.bills(created_at desc);

-- 验证表已创建
select * from public.bills limit 1;
```

5. 确认执行成功（即使返回 0 rows 也正常）

### 第二步：配置 Supabase Email Auth（必须）

1. 在 Supabase 项目中，进入 **Authentication** → **Providers**
2. 找到 **Email** provider
3. 确认已启用（Enable Email provider）
4. 在 **URL Configuration** 中：
   - **Site URL**: 本地测试填 `http://localhost:3000`，部署后改为你的域名
   - **Redirect URLs**: 添加 `http://localhost:3000/**` 和你的生产域名

### 第三步：选择托管平台并部署

#### 选项 A：Vercel（推荐，最简单）

**优点**：
- 零配置，自动检测 Next.js
- 免费 SSL 证书
- 全球 CDN
- 自动 CI/CD

**步骤**：
1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 "Add New" → "Project"
3. 选择你的 GitHub 仓库：`ezshrimps/ShrimpTransactions`
4. 配置环境变量（Environment Variables）：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://mbuepmpgwnlcfclliyed.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idWVwbXBnd25sY2ZjbGxpeWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzOTgyMzgsImV4cCI6MjA3Nzk3NDIzOH0.RHeRHF8NDw1ORpr10WKD3lkWdk_v3572x50efhx1aPE
   ```
5. 点击 "Deploy"
6. 等待构建完成（约 2-3 分钟）
7. 部署成功后，Vercel 会提供一个域名（如 `https://shrimp-transactions.vercel.app`）

**部署后配置**：
- 回到 Supabase → Authentication → URL Configuration
- 将 **Site URL** 改为 Vercel 提供的域名
- 在 **Redirect URLs** 添加 `https://你的域名.vercel.app/**`

#### 选项 B：Render

**优点**：
- 支持持久存储（虽然现在已用 Supabase，不需要）
- 免费层足够使用

**步骤**：
1. 访问 [render.com](https://render.com) 并登录
2. Dashboard → "New" → "Web Service"
3. 连接 GitHub 仓库：`ezshrimps/ShrimpTransactions`
4. 配置：
   - **Name**: shrimp-transactions
   - **Environment**: Node
   - **Region**: Singapore（或离你最近的）
   - **Branch**: main
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Start Command**: `npm run start`
5. 添加环境变量（Environment Variables）：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://mbuepmpgwnlcfclliyed.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idWVwbXBnd25sY2ZjbGxpeWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzOTgyMzgsImV4cCI6MjA3Nzk3NDIzOH0.RHeRHF8NDw1ORpr10WKD3lkWdk_v3572x50efhx1aPE
   ```
6. 点击 "Create Web Service"
7. 等待部署完成

#### 选项 C：Netlify

1. 访问 [netlify.com](https://netlify.com) 并登录
2. "Add new site" → "Import an existing project"
3. 选择 GitHub → 找到 `ezshrimps/ShrimpTransactions`
4. 构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. 环境变量：同上
6. 点击 "Deploy site"

## 部署后验证

1. **访问网站**：打开托管平台提供的 URL
2. **测试登录**：
   - 右上角输入邮箱 → 点击"邮箱登录"
   - 查收邮件，点击登录链接
   - 确认登录成功（右上角显示邮箱）
3. **测试功能**：
   - 创建账单
   - 导入数据
   - 编辑模式拖拽
   - 预览模式设置预算
   - CSV 导入

## 常见问题

### Q: 构建失败，提示 "Module not found: @supabase/supabase-js"
**A**: 确认 `package.json` 中已包含该依赖。如果缺失，在本地运行：
```bash
npm install @supabase/supabase-js --legacy-peer-deps
git add package.json package-lock.json
git commit -m "Add supabase dependency"
git push origin main
```

### Q: 登录邮件收不到
**A**: 
1. 检查 Supabase → Authentication → Email Templates
2. 确认邮箱地址正确
3. 查看垃圾邮件文件夹
4. 在 Supabase → Authentication → Logs 查看发送日志

### Q: 页面显示"加载账单列表失败"
**A**:
1. 检查环境变量是否正确配置
2. 确认 Supabase `bills` 表已创建
3. 查看浏览器控制台的网络请求，检查具体错误

### Q: 需要开启 RLS（行级安全）吗？
**A**: 
- 目前代码已支持用户隔离（通过 user_id），但未开启 RLS
- 生产环境建议开启 RLS 并添加策略：

```sql
-- 启用 RLS
alter table public.bills enable row level security;

-- 允许用户读取自己的账单
create policy "Users can read own bills"
  on public.bills for select
  using (auth.uid()::text = user_id);

-- 允许用户创建自己的账单
create policy "Users can create own bills"
  on public.bills for insert
  with check (auth.uid()::text = user_id);

-- 允许用户更新自己的账单
create policy "Users can update own bills"
  on public.bills for update
  using (auth.uid()::text = user_id);

-- 允许用户删除自己的账单
create policy "Users can delete own bills"
  on public.bills for delete
  using (auth.uid()::text = user_id);
```

- 开启 RLS 后，需要修改 API 路由使用 Supabase 的 `auth.users()` 而不是请求头

## 推荐部署流程

1. ✅ **Vercel 部署**（最简单）
2. ✅ 更新 Supabase Email 配置（添加生产域名）
3. ⚠️ 开启 RLS（安全增强，可选）
4. ✅ 测试所有功能
5. ✅ 分享给用户使用

## 自定义域名（可选）

部署后，如果你有自己的域名：

**Vercel**：
1. Vercel Dashboard → 你的项目 → Settings → Domains
2. 添加自定义域名
3. 按提示配置 DNS（CNAME 或 A 记录）

**更新 Supabase**：
- 在 Supabase Authentication → URL Configuration 中添加新域名到 Redirect URLs

## 监控和维护

- **Vercel**: Dashboard 可查看部署日志、访问统计、错误追踪
- **Supabase**: Database → Table Editor 可查看/编辑数据
- **Analytics**: 可接入 Vercel Analytics 或 Google Analytics

---

需要帮助？查看详细文档或在 GitHub 提 Issue。


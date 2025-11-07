# 虾米记账本 - Shrimp Transactions

一个基于 Next.js 的可视化记账应用，支持云同步、拖拽编辑、预算管理等功能。

## 功能特性

### 核心功能
- **交互式堆叠柱状图**：使用 D3.js 实现的可拖拽、可交互的堆叠柱状图
- **云同步**：基于 Supabase 的云端数据存储，支持多设备同步
- **邮箱登录**：Magic Link 无密码登录，自动注册
- **两种显示模式**：
  - **编辑模式**：固定高度，颜色由金额决定（绿→红），支持拖拽、点击添加、右键编辑/删除
  - **预览模式**：按价格比例显示，查看预算对比，总额颜色反映预算使用情况

### 高级功能
- **CSV 导入**：上传 CSV 文件，映射列（类别/金额/备注），批量导入
- **预算管理**：为每个类别设置月预算，实时查看超支情况
- **撤销/重做**：支持 `Ctrl+Z` 和 `Ctrl+Y`
- **智能分类**：动态类别，会话保留空类别
- **首次使用教程**：引导新用户快速上手

## 技术栈

- **框架**：Next.js 16 (App Router, Turbopack)
- **数据库**：Supabase (PostgreSQL + Auth)
- **可视化**：D3.js
- **UI组件**：shadcn/ui
- **样式**：Tailwind CSS
- **类型安全**：TypeScript

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/ezshrimps/ShrimpTransactions.git
cd ShrimpTransactions
```

### 2. 安装依赖

```bash
npm install --legacy-peer-deps
```

### 3. 配置 Supabase

#### 3.1 创建 Supabase 项目
1. 访问 [supabase.com](https://supabase.com) 并登录
2. 点击 "New project"
3. 设置项目名称、数据库密码、选择区域
4. 等待项目初始化完成（约 1-2 分钟）

#### 3.2 创建数据表
在 Supabase 项目中，进入 **SQL Editor**，执行以下 SQL：

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
```

#### 3.3 获取 API 凭据
1. 进入项目 → **Settings** → **API**
2. 复制：
   - **Project URL**
   - **anon public** API key

### 4. 配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=你的项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon_key
```

### 5. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 部署到生产环境

### 推荐方式 1：Vercel（最简单）

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "New Project" → 选择你的 GitHub 仓库
3. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 点击 "Deploy"

**优点**：
- 一键部署，自动 CI/CD
- 全球 CDN 加速
- 免费额度充足

### 推荐方式 2：Render（适合需要持久文件系统）

1. 访问 [render.com](https://render.com)
2. New → Web Service → 连接 GitHub 仓库
3. 配置：
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Start Command**: `npm run start`
   - **Environment Variables**: 添加上述两个 Supabase 变量
4. Deploy

### 推荐方式 3：Netlify

1. 访问 [netlify.com](https://netlify.com)
2. Add new site → Import from Git
3. 配置环境变量并部署

## 数据格式说明

### 文本导入格式

```
超市: 10, 16, 54(hmart), 12
房租: 600
水电: 120, 165
餐厅: 32(麦当劳), 16, 26, 31.2
车油: 45, 39, 12, 34
```

格式规则：
- 每行一个类别：`类别名: 金额1, 金额2(备注), 金额3`
- 金额后可添加括号备注
- 多个金额用逗号分隔

### CSV 导入格式

上传 CSV 文件后，需要映射以下列：
- **类别列**：支出所属类别
- **金额列**：支出金额（支持 $、逗号分隔符）
- **备注列**（可选）：支出说明

示例 CSV：
```csv
类别,金额,备注
超市,25.50,购物
餐饮,18.00,午餐
车,45.00,加油
```

## 使用指南

### 编辑模式操作
- **添加支出**：点击类别的空白区域
- **移动支出**：拖拽支出条到其他类别
- **编辑支出**：右键点击支出条 → 修改
- **删除支出**：右键点击支出条 → 删除
- **撤销操作**：`Ctrl+Z`
- **重做操作**：`Ctrl+Y` 或 `Ctrl+Shift+Z`

### 预览模式操作
- **查看总额**：每个类别顶部显示总支出
- **设置预算**：点击类别下方的预算数字
- **预算提醒**：总额颜色表示预算使用情况
  - 绿色：<75% 充裕
  - 黄色：75-95% 接近
  - 橙色：95-100% 临界
  - 红色：>100% 超支

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Z` | 撤销当前账单的支出操作 |
| `Ctrl+Y` | 重做 |
| `Ctrl+Shift+Z` | 重做（备选） |

## 开发说明

### 项目结构

```
├── app/                    # Next.js App Router
│   ├── api/               # API 路由（Supabase 集成）
│   │   └── bills/         # 账单 CRUD 接口
│   ├── page.tsx           # 主页面
│   └── layout.tsx         # 根布局
├── components/            # React 组件
│   ├── expense-chart-interactive.tsx  # D3.js 交互图表
│   ├── auth-bar.tsx       # 登录组件
│   ├── onboarding-tour.tsx  # 首次使用教程
│   ├── import-csv-dialog.tsx  # CSV 导入
│   └── ui/                # shadcn/ui 基础组件
├── lib/                   # 工具函数
│   ├── expense-parser.ts  # 文本解析器
│   ├── bill-api.ts        # API 客户端（支持用户隔离）
│   ├── expense-utils.ts   # 数据转换工具
│   └── supabase-browser.ts  # Supabase 浏览器客户端
├── hooks/                 # 自定义 Hooks
│   ├── use-history.ts     # 撤销/重做管理
│   └── use-keyboard-shortcuts.ts  # 全局快捷键
└── data/                  # 本地数据（已弃用，现用 Supabase）
```

### 数据模型

```typescript
interface ExpenseEntry {
  id: string              // 唯一标识符
  category: string        // 类别
  amount: number          // 金额
  description?: string    // 备注（可选）
}

interface ExpenseConfig {
  id: string              // 账单 ID
  name: string            // 账单名称
  rawInput: string        // 原始文本
  expenses: ParsedExpenses  // 解析后的数据
  expenseList?: ExpenseList // 扁平化列表
  createdAt: number       // 创建时间
}
```

### Supabase 表结构

**bills 表**：
```sql
id text primary key,
name text not null,
raw_input text,
created_at timestamptz default now(),
user_id text
```

## 故障排查

### 问题：页面显示"加载账单列表失败"
- 检查 `.env.local` 中的 Supabase 环境变量是否正确
- 确认 Supabase 项目中 `bills` 表已创建
- 查看浏览器控制台的网络请求，检查 `/api/bills` 返回的错误信息

### 问题：登录链接发送失败
- 检查 Supabase 项目的 Email Auth 是否启用
- 在 Supabase Dashboard → Authentication → Settings 中确认 Email Provider 已配置

### 问题：数据不同步
- 确认已登录（右上角显示邮箱）
- 检查浏览器控制台是否有 API 错误

## 路线图

- [x] 云同步与用户隔离
- [x] 邮箱登录
- [x] CSV 导入
- [x] 预算管理
- [ ] 多币种支持
- [ ] 发票 OCR 识别
- [ ] 协作账本（家庭/室友）
- [ ] 移动端 PWA
- [ ] 多语言（中/英）
- [ ] 数据导出（PDF/Excel）

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

MIT

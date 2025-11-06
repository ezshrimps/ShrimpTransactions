# 记账本 - Stacked Bar Chart Transactions

一个基于 Next.js 的记账网站，使用交互式堆叠柱状图可视化支出数据。

## 功能特性

- **交互式堆叠柱状图**：使用 D3.js 实现的可拖拽、可交互的堆叠柱状图
- **两种显示模式**：
  - **编辑模式**：固定高度的支出条，颜色从绿到红（金额越大越红），支持拖拽移动类别，支持在空白区域点击添加新支出
  - **预览模式**：按价格比例显示，使用固定配色方案，显示价格轴
- **账单管理**：
  - 创建新账单
  - 导入账单数据
  - 编辑现有账单
  - 重命名账单
  - 删除账单
- **数据持久化**：账单数据保存在本地 `data/` 文件夹中
- **撤销/重做**：支持 `Ctrl+Z` 撤销和 `Ctrl+Y` 重做操作
- **固定类别**：7个固定支出类别（超市、车、房、餐饮、娱乐、订阅、其他）

## 技术栈

- **框架**：Next.js 16 (App Router)
- **可视化**：D3.js
- **UI组件**：shadcn/ui
- **样式**：Tailwind CSS
- **类型安全**：TypeScript

## 安装和运行

### 前置要求

- Node.js 18+ 
- npm 或 pnpm

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 运行开发服务器

```bash
npm run dev
# 或
pnpm dev
```

然后在浏览器中打开 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
# 或
pnpm build
```

## 数据格式

账单数据可以通过文本导入，格式如下：

```
超市: 10, 16, 54(hmart), 12
房租: 600
水电: 120, 165
餐厅: 32(麦当劳), 16, 26, 31.2
```

格式说明：
- 每行一个类别：`类别名: 金额1, 金额2(备注), 金额3`
- 金额后面可以添加括号备注，如 `54(hmart)`
- 多个金额用逗号分隔

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── api/               # API 路由（账单 CRUD）
│   ├── page.tsx           # 主页面
│   └── layout.tsx         # 布局组件
├── components/            # React 组件
│   ├── expense-chart-interactive.tsx  # 交互式图表组件
│   └── ui/                # shadcn/ui 组件
├── lib/                   # 工具函数
│   ├── expense-parser.ts  # 数据解析器
│   ├── bill-api.ts        # 账单 API 客户端
│   └── expense-utils.ts    # 支出工具函数
├── hooks/                 # React Hooks
│   ├── use-history.ts     # 撤销/重做历史管理
│   └── use-keyboard-shortcuts.ts  # 键盘快捷键
└── data/                  # 账单数据存储（.txt 文件）
```

## 主要功能说明

### 编辑模式

- 所有支出条高度固定（25px）
- 颜色根据金额从绿色渐变到红色
- 支持拖拽支出条在不同类别间移动
- 点击类别空白区域可添加新支出
- Y轴不显示价格

### 预览模式

- 支出条高度按价格比例显示
- 使用固定的配色方案
- 显示价格Y轴
- 不支持拖拽

### 快捷键

- `Ctrl+Z`：撤销操作
- `Ctrl+Y`：重做操作

## License

MIT


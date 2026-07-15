# EdgeKey 项目开发规范指南

本指南为AI助手提供EdgeKey项目开发迭代的标准流程和规范要求，确保代码质量和项目一致性。

## 项目架构概览

### 技术栈

- **前端框架**: Vue 3 + Vike（文件路由 + SSR）
- **服务端**: Hono（路由与中间件）
- **运行时**: Cloudflare Workers
- **数据库**: Cloudflare D1（原生SQLite）
- **ORM**: Prisma（Cloudflare适配器）
- **UI框架**: Tailwind CSS + daisyUI
- **构建工具**: Vite + Bun
- **认证**: Auth.js（管理员账号密码登录）
- **数据变更**: Telefunc（前后端同构RPC）

### 核心约束

1. **Cloudflare Workers环境限制**:
   - 禁止依赖`node:fs`、`node:path`等Node.js原生模块
   - 使用Web Crypto API（`crypto.subtle`）处理签名，避免第三方加密库
   - 脚本体积限制（免费版3MB），引入新依赖必须经过批准

2. **数据库特殊性**:
   - 使用Cloudflare D1（SQLite），非传统数据库
   - 开发环境使用本地D1模拟器，生产环境使用远程D1
   - 禁止使用`prisma migrate dev`，必须使用特定迁移工作流

### 项目结构

```
edgeKey/
├── pages/           # Vike页面路由
├── components/      # Vue组件
├── lib/             # 核心库（logger、error、http-client、utils）
├── modules/         # 业务模块（payment、email、order）
├── server/          # 服务端（Hono、中间件）
├── prisma/          # 数据库模型和迁移
├── assets/          # 静态资源
└── docs/            # 文档
```

**核心库文件**:
- `lib/logger.ts`: 日志模块（自动注入请求上下文、错误序列化）
- `lib/app-error.ts`: 错误处理模块（AppError类、错误工厂函数）
- `lib/http-client.ts`: HTTP 客户端（统一请求封装，支持超时、重试）
- `lib/request-context.ts`: 请求上下文管理（AsyncLocalStorage）

---

## 开发流程规范

### 1. 环境准备

```bash
bun install              # 安装依赖
bun run db:generate      # 生成Prisma客户端
bun run db:migrations:local  # 初始化本地数据库
bun run db:seed          # 初始化种子数据
bun run dev              # 启动开发服务器
```

### 2. 数据库变更流程

**重要**: 修改数据库表结构时必须遵循以下流程：

#### 步骤1: 修改Schema并生成迁移SQL

```bash
bunx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema prisma/schema.prisma \
  --script > prisma/migrations/000X_描述.sql
```

> [!WARNING]
> **必须手动核查生成的 SQL**，不要直接使用 `prisma migrate diff` 的输出。常见问题：
>
> **1. 枚举变更加新列 —— 实际不需要任何 DDL**
>
> Prisma 的 `enum` 在 SQLite 中就是普通 `TEXT` 列，数据库层面没有约束。因此：
> - 在 `schema.prisma` 的 enum 中新增值（如 `ProductDeliveryType` 加 `EXPRESS`），**不需要任何 SQL 迁移**，因为 SQLite 不关心列里存的文本内容。
> - 只有当 enum 对应的列首次创建时，才需要 `CREATE TABLE` / `ALTER TABLE ADD COLUMN`。
>
> **2. 加列操作不要用全表重建**
>
> `prisma migrate diff` 对 SQLite 经常生成 `CREATE _new_Table → INSERT → DROP TABLE → RENAME` 的全量重建模式。对于只是新增可空列的场景，应该替换为简单的：
> ```sql
> ALTER TABLE "TableName" ADD COLUMN "columnName" TEXT;
> ```
>
> **3. 正确的决策流程**
>
> | schema 变更类型 | 迁移 SQL |
> | --- |
> | enum 新增值 | 无 SQL（Prisma 层面约束，SQLite 无需 DDL） |
> | 新增可空列 | `ALTER TABLE ... ADD COLUMN ...` |
> | 新增非空列（有默认值） | `ALTER TABLE ... ADD COLUMN ... DEFAULT ...` |
> | 新增表 | `CREATE TABLE ...` |
> | 删除列 / 改列类型 | SQLite 不支持，需全表重建（此时才用 CREATE _new → INSERT → DROP → RENAME 模式） |

#### 步骤2: 同步到本地开发环境

```bash
bun run db:migrations:local
```

#### 步骤3: 部署前同步到生产环境

```bash
bun run db:migrations:remote
```

### 3. 代码提交与部署

```bash
bun run build    # 构建项目
bun run preview  # 本地预览构建结果
bun run deploy   # 部署到Cloudflare Workers
# 或
bun run up       # 构建并部署
```

---

## 代码规范

### 文件组织

- **页面文件**: `pages/`目录，遵循Vike文件路由约定
- **组件**: `components/`目录，通用组件
- **业务逻辑**: `lib/`目录
- **功能模块**: `modules/`目录
- **服务端**: `server/`目录
- **数据库**: `prisma/`目录
- **静态资源**: `assets/`目录

### 命名规范

- **Vue组件**: PascalCase（如`AppButton.vue`）
- **TypeScript文件**: camelCase（如`order-utils.ts`）
- **数据库模型**: PascalCase（如`Admin`、`Order`）
- **数据库字段**: camelCase（如`createdAt`、`paymentStatus`）

### TypeScript 类型引用规范

所有类型引用**必须在文件顶部使用 `import type` 导入**，禁止在变量声明、函数参数、泛型等位置使用内联 `import()` 写法。

```typescript
// bad：禁止内联引用
function handle(data: import("./types").SomeType) { ... }
// good：顶部统一导入
import type { SomeType } from "./types";
function handle(data: SomeType) { ... }
```

### 组件开发规范

**优先使用全局组件**：开发新功能前，先查看 `docs/components.md` 中是否已有可复用的组件。优先使用项目提供的全局组件，没有的才自己开发。

常用全局组件：
- `AppButton`: 统一按钮，支持 loading、variant、href 等
- `SecretInput`: 密码/密钥输入框，支持显示/隐藏
- `StatusTag`: 状态标签
- `ConfirmDialog`: 确认对话框
- `DataTable`: 数据表格
- `FilePickerModal`: 文件选择弹窗

**开发新组件时**：
- 使用`<script setup>`语法
- Props定义必须包含类型和默认值
- 事件使用`emit`函数触发
- 样式优先使用Tailwind CSS类，必要时使用daisyUI组件
- 如果是通用组件，应放在 `components/` 目录并更新 `docs/components.md`

---

## 架构设计规范

### 1. 中间件使用

- **请求上下文**: 通过`createRequestContext`和`runWithRequestContext`管理
- **数据库注入**: 通过`prismaMiddleware`注入Prisma实例
- **认证**: 通过`authjsSessionMiddleware`处理会话
- **API路由**: 独立的Hono子应用，优先于页面路由

### 2. 错误处理

使用项目内置的错误处理机制：

```typescript
import { AppError, toAppError, badRequestError, notFoundError, conflictError, unauthorizedError } from '@/lib/app-error';

// 使用预定义的错误工厂函数
throw notFoundError('订单不存在', 'ORDER_NOT_FOUND');
throw badRequestError('购买数量不合法', 'ORDER_QUANTITY_INVALID');
throw conflictError('数据已存在，请检查是否重复', 'UNIQUE_CONSTRAINT');
throw unauthorizedError('请先登录管理员账号');

// 转换未知错误
try {
  // 业务逻辑
} catch (error) {
  const appError = toAppError(error);
  logger.error('操作失败', appError);
  throw appError;
}
```

**错误工厂函数**:
- `badRequestError()`: 400 - 请求参数错误
- `unauthorizedError()`: 401 - 未授权
- `forbiddenError()`: 403 - 禁止访问
- `notFoundError()`: 404 - 资源不存在
- `conflictError()`: 409 - 数据冲突
- `rateLimitError()`: 429 - 请求过于频繁
- `externalServiceError()`: 502 - 外部服务错误
- `internalServerError()`: 500 - 服务器内部错误

### 3. HTTP 客户端

项目提供统一的 HTTP 请求封装，支持超时、重试、错误处理：

```typescript
import { httpRequest, httpPost } from '@/lib/http-client';

// GET 请求
const { ok, status, data } = await httpRequest('https://api.example.com/data', {
  headers: { Authorization: 'Bearer token' },
  timeoutMs: 10000,
  retries: 2,
});

// POST 请求
const { ok, status, data } = await httpPost('https://api.example.com/send', {
  to: 'user@example.com',
  subject: 'Hello',
}, {
  headers: { 'api-key': 'xxx' },
  timeoutMs: 15000,
});
```

**参数说明**:
- `timeoutMs`: 请求超时时间（默认 15000ms）
- `retries`: 重试次数（默认 0）
- `retryDelayMs`: 重试间隔（默认 1000ms）
- `headers`: 自定义请求头（自动包含 Content-Type 和 User-Agent）

### 4. 日志规范

使用项目内置的`logger`模块：

```typescript
import { logger } from '@/lib/logger';

logger.info('操作成功', { userId: 123, action: 'create_order' });
logger.warn('库存不足', { productId: 456, stock: 2 });
logger.error('支付失败', error, { orderId: 'ORD001' });
```

**日志级别使用原则**:
- `info`: 业务流程关键节点、重要操作记录
- `warn`: 可恢复的异常、资源不足、配置问题
- `error`: 不可恢复的错误、系统异常

---

## Telefunc 使用规范

- Telefunc函数放在对应页面目录下，以`.telefunc.ts`结尾
- 函数命名: `on[Action]`（如`onCreateOrder`、`onUpdateProduct`）
- 通过`getContext()`获取请求上下文（包含prisma实例）
- 返回值自动序列化为JSON
- 错误会自动转换为Telefunc Abort格式

```typescript
import { getContext } from 'telefunc';
import type { PrismaClient } from '../../generated/prisma/client';

export async function onCreateOrder(input: { productId: number; quantity: number }) {
  const { prisma } = getContext() as { prisma: PrismaClient };
  // 业务逻辑
  return { orderNo: 'ORD001' };
}
```

---

## 数据库开发工作流

### D1 事务限制与解决方案

> [!WARNING]
> **Cloudflare D1 不完全支持 Prisma 的交互式事务** (`prisma.$transaction(async (tx) => {...})`)

**本项目的解决方案：补偿性事务（Compensating Transaction）**

```typescript
// 1. 先执行主操作
const order = await createOrderRecord(prisma, {...});
// 2. 尝试执行关联操作
try {
  const result = await createPaymentForOrder(order.orderNo, prisma);
  return result;
} catch (error) {
  // 3. 如果失败，执行补偿操作（删除已创建的记录）
  await prisma.order.delete({ where: { id: order.id } })
    .catch(e => logger.error("Compensating delete failed:", e));
  throw error;
}
```

### 迁移文件限制说明

- **`prisma/migrations/` 中已存在的迁移文件视为历史记录，禁止修改、重命名或删除。**
- **数据库变更只能通过新增迁移文件完成，例如 `0002_*.sql`、`0003_*.sql`。**
- **提交前必须保证 `schema.prisma` 与迁移文件的职责一致，避免同一字段在多个迁移里重复定义。**

### 当前运行方式

- `bun dev` 运行在 Cloudflare 风格的本地开发环境中，Prisma 会通过 `env.DB` 连接到**本地 D1 模拟器**
- `bun run up` 部署后，Prisma 会通过同一个 `env.DB` 绑定连接到**远程 D1**
- `.env` 中的 `DATABASE_URL` 仅用于 Prisma CLI / 配置层，不参与当前应用运行时的数据库连接

---

## 绝对不要做的操作

1. **不要**假设 `bun dev` 使用的是 `prisma/db.sqlite`；当前它实际使用的是本地 D1 模拟器
2. **不要**使用 `prisma migrate dev`，这会偏离当前 D1 迁移工作流
3. **不要**反复覆盖 `prisma/migrations/0001_init.sql`；初始化迁移和后续增量迁移应分开维护
4. **不要**信任 Prisma 生成的迁移 SQL，必须手动核查。重点规则见上方「步骤1」中的决策流程表：enum 变更无需 DDL、新增列用 `ALTER TABLE`、只有删列/改类型才需要全表重建
5. **不要**使用`node:fs`、`node:path`等Node.js原生模块

---

## 常用命令

```bash
# 开发
bun install                    # 安装依赖
bun run dev                    # 启动开发服务器
bun run build                  # 构建项目
bun run preview                # 预览构建结果

# 数据库
bun run db:generate            # 生成Prisma客户端
bun run db:migrations:local    # 应用迁移到本地D1
bun run db:migrations:remote   # 应用迁移到远程D1
bun run db:seed                # 本地种子数据
bun run db:seed:remote         # 远程种子数据
bun run db:studio              # Prisma Studio

# 部署
bun run deploy                 # 部署到Cloudflare Workers
bun run up                     # 构建并部署
bun run types                  # 生成Wrangler类型
```

---

## 日志排查

当邮件发送异常或支付回调出现问题时，可在 Cloudflare Dashboard 查看 Workers 运行日志：

> 实时线上环境日志: `bunx wrangler tail --format pretty`

1. 进入 [dash.cloudflare.com](https://dash.cloudflare.com)
2. 左侧菜单 → **Workers & Pages** → 点击 **edgekey**
3. 顶部 tab → **Observability**
4. 在搜索框输入关键词过滤日志，例如：
   - `email.send.failed` — 邮件发送失败
   - `payment.notify.route_exception` — 支付回调路由异常
   - `payment.notify.diagnostic` — 支付回调校验异常诊断

---

## 参考资源

**项目文档**:
- `README.md`: 项目概述和快速开始
- `docs/components.md`: 组件使用指南
- `docs/payment-gateway-guide.md`: 支付网关开发指南

**官方文档**:
- [Vike](https://vike.dev/): 文件路由框架
- [Vue 3](https://vuejs.org/): 前端框架
- [Hono](https://hono.dev/): 服务端框架
- [Prisma](https://www.prisma.io/): ORM框架
- [Cloudflare Workers](https://developers.cloudflare.com/workers/): 运行时环境

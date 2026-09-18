# 喵的旅行日记管理后台

内部管理后台，使用 Vue 3、TypeScript、Vite、Element Plus、Vue Router 和 Pinia。

## 当前阶段

A1 管理员认证接入。实际后端 `miao-travel-server` 已提供登录、当前会话和退出接口；玩家查询等业务管理接口仍按后续阶段逐项接入。

## 本地运行

```bash
cp .env.example .env.local
npm install
npm run dev
```

环境变量：

- `VITE_APP_ENV`：`development`、`test` 或 `production`。
- `VITE_ADMIN_API_BASE_URL`：管理 API 独立入口，不包含末尾 `/`；本地开发留空时由 Vite 代理到 `http://127.0.0.1:3000`。

## 质量检查

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 安全边界

- 管理会话预期由后端通过 `HttpOnly + Secure + SameSite` Cookie 管理。
- API 请求固定使用 `credentials: include`，不把管理 token 保存到 `localStorage`。
- 前端路由和按钮权限只用于改善体验，后端必须对每个管理 API 独立鉴权。
- 所有管理数据只通过 `/admin/v1/*` 获取，浏览器不得直连 CloudBase 数据库。

## 本地管理员联调

先按后端 README 配置 `ADMIN_BOOTSTRAP_ACCOUNT` 和 `ADMIN_BOOTSTRAP_PASSWORD` 并启动 `miao-travel-server`，再运行 `npm run dev`。管理后台不内置默认账号或密码。

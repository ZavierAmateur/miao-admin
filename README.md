# 喵的旅行日记管理后台

内部管理后台，使用 Vue 3、TypeScript、Vite、Element Plus、Vue Router 和 Pinia。

## 当前阶段

A1 工程基线。实际后端 `miao-travel-server` 尚未交付 `/admin/v1/*` 管理接口，因此当前登录和业务页面不会使用假接口或假账号绕过鉴权。

## 本地运行

```bash
cp .env.example .env.local
npm install
npm run dev
```

环境变量：

- `VITE_APP_ENV`：`development`、`test` 或 `production`。
- `VITE_ADMIN_API_BASE_URL`：管理 API 独立入口，不包含末尾 `/`。

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

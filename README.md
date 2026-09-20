# 喵的旅行日记管理后台

内部管理后台，使用 Vue 3、TypeScript、Vite、Element Plus、Vue Router 和 Pinia。

## 当前范围

V1 是单管理员使用的简易内部后台，已接入实际后端 `miao-travel-server` 的管理员登录、玩家查询、资料查看、云存档诊断/回滚、封禁/解封和脱敏错误日志接口。不开发管理员管理、复杂角色配置、通知中心、占位指标仪表盘、告警或工单系统。

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
- 错误日志页只展示后端提供的脱敏字段，不展示请求体、Cookie、Token、存档正文或错误堆栈。

## 本地管理员联调

先按后端 README 配置 `ADMIN_BOOTSTRAP_ACCOUNT` 和 `ADMIN_BOOTSTRAP_PASSWORD` 并启动 `miao-travel-server`，再运行 `npm run dev`。管理后台不内置默认账号或密码。

## 联调 CloudBase 线上接口

后端 `miao-travel-wechat` 已部署时可直接运行：

```bash
npm run dev:cloud
```

然后访问终端显示的 `http://127.0.0.1:端口`。该模式仍让浏览器请求同源 `/admin/v1/*`，由只监听回环地址的本地 Vite 代理转发到 CloudBase；代理使用后端已登记的 Origin，并仅在本机响应中移除 Cookie 的 `Secure` 属性，使 HTTP 回环地址能够保存管理员会话。管理员密码仍由登录页输入，不写入前端环境文件、源码或 localStorage。

`.env.cloud` 只包含公开服务地址，不包含任何管理员密码、AppSecret 或 CloudBase API Key。迁移 CloudBase 环境时更新 `VITE_ADMIN_PROXY_TARGET`。

## V1 交付方式

V1 管理后台保持为单管理员使用的本地内部工具，不部署公网静态站点。需要使用时执行：

```bash
npm run dev:cloud
```

浏览器只访问回环地址，管理 API 继续由本地代理连接已部署的 CloudBase Run。这样不增加静态托管、HTTP 网关、域名和公网访问控制配置。需要多人异地使用时，再作为第二版独立评估正式部署方案。

V1 总收尾结果见 `docs/acceptance/A6B-V1简易后台总体验收报告.md`。

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

CloudBase 生产部署前执行完整检查：

```bash
npm run verify:cloud
```

该命令会使用 `.env.production` 构建 `dist`，并检查产物没有写入 CloudBase Run 直连域名、服务端 Secret、Source Map 等不应发布的内容。

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

## CloudBase 生产部署

生产后台采用“静态网站托管 + HTTP 网关同域分流”，不新增管理后台容器：

- 网关根路径 `/` 指向本仓库构建出的静态站点。
- 同一域名的 `/admin/v1` 指向现有 `miao-travel-wechat` 云托管服务，并开启路径透传。
- 后端 `ADMIN_WEB_ORIGIN` 必须配置为该网关 HTTPS Origin，且不带末尾 `/`。

该结构让页面和管理 API 保持同源，生产环境继续使用 `HttpOnly + Secure + SameSite=Strict` Cookie。不能把静态站点直接跨域连接 CloudBase Run 默认域名，也不能把管理员 token 改存到浏览器。

完整控制台步骤和验收清单见 [CloudBase 静态托管部署说明](docs/deployment/CloudBase静态托管部署说明.md)。

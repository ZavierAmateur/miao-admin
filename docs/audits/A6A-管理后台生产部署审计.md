# A6A 管理后台生产部署审计

## 审计日期

2026-09-20

## 当前状态

- `miao-admin` 与 `miao-travel-server` 的 `main` 均与远端一致，审计开始时工作区干净。
- 管理后台已通过本地同源代理连接 CloudBase Run，但尚未作为公网 Web 站点部署。
- 管理会话 Cookie 为 `HttpOnly; Secure; SameSite=Strict; Path=/admin/v1`，前端请求固定使用 `credentials: include`。
- 生产写请求只接受 `ADMIN_WEB_ORIGIN` 配置的来源。
- 原工程没有 `.env.production`，直接执行生产构建时环境标签会回退为 `development`。

## 风险结论

1. 把 Vue 站点部署到独立静态域名、再直连 CloudBase Run 服务域名，会形成跨站请求；`SameSite=Strict` Cookie 不会成为可靠的管理会话方案。
2. 把 token 返回前端并写入 localStorage 会降低现有安全基线，不接受。
3. 单独创建 Nginx/Node 管理容器可以实现同源代理，但会新增容器实例和维护成本，不符合当前免费资源优先的约束。
4. CloudBase HTTP 网关支持按域名和路径把静态托管与云托管映射到同一个入口；路径采用最长匹配，适合将 `/` 指向静态站点、`/admin/v1` 指向现有服务。

## 选定方案

- 静态页面：CloudBase 静态网站托管。
- 管理 API：现有 CloudBase Run `miao-travel-wechat`。
- 统一入口：CloudBase HTTP 网关的同一个 HTTPS 域名。
- 路由：`/` → 静态托管；`/admin/v1` → 云托管，并开启路径透传。
- SPA 刷新：静态托管错误页面回退到 `/index.html`。
- 后端来源：`ADMIN_WEB_ORIGIN=https://实际网关域名`，不保留末尾 `/`。

## 本阶段允许变更

- 增加生产环境文件、CloudBase 构建命令和产物安全检查。
- 增加部署说明、验收清单及后端计划同步记录。
- 不修改管理 API、数据库结构、RBAC、Cookie 安全属性或玩家数据。

## 最终验收门槛

- 本地 `verify:cloud` 全部通过并中文提交推送。
- CloudBase 静态托管构建成功，HTTP 网关两条路由使用同一域名。
- 更新 `ADMIN_WEB_ORIGIN` 后重新部署后端。
- 公网后台完成登录、刷新恢复、玩家只读查询、错误日志查询和退出登录。
- 浏览器确认 Cookie 保持 `HttpOnly + Secure + SameSite=Strict`；后台产物和网络响应无 Secret。

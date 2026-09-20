# CloudBase 静态托管部署说明

## 1. 部署结构

```text
同一个 HTTPS 网关域名
├── /admin/v1/*  → CloudBase Run: miao-travel-wechat（开启路径透传）
└── /*           → CloudBase 静态网站托管: miao-admin
```

HTTP 网关按最长路径匹配，因此 `/admin/v1` 会优先于根路径 `/`。浏览器始终请求同源 `/admin/v1/*`，无需跨域 Cookie，也不新增管理后台容器。

## 2. 部署前本地验收

在 `miao-admin` 根目录执行：

```bash
npm ci
npm run verify:cloud
```

成功后 `dist/` 是待发布产物。自检会确认：

- 生产环境构建完成；
- API 地址保持同源 `/admin/v1/*`；
- 产物不包含 CloudBase Run 直连域名、管理员密码、AppSecret、CloudBase API Key；
- 不发布 Source Map。

## 3. 创建静态网站托管部署

进入 CloudBase 环境 `cloud1-d3guut2kr1085b24f`：

1. 打开“静态网站托管”，选择 Git 仓库部署。
2. 仓库选择 `ZavierAmateur/miao-admin`，分支选择 `main`。
3. 项目名称建议填写 `miao-admin`。
4. Node.js 选择 `24.x`（`22.x` 也可）。
5. 安装命令填写 `npm ci`。
6. 构建命令填写 `npm run build:cloud`。
7. 构建产物目录填写 `dist`。
8. 第一版关闭自动部署，人工验收通过后再决定是否开启。
9. 部署成功后，将 SPA 错误页面或 404 回退配置为 `/index.html`，确保刷新 `/players`、`/errors` 不返回 404。

静态部署不需要配置管理员密码、AppSecret、CloudBase API Key 或后端公网地址。

## 4. 配置 HTTP 网关同域路由

在“HTTP 网关 → 路由管理”选定一个 HTTPS 默认域名或已备案自定义域名，建立两条规则。

### 规则一：管理 API

- 域名：与静态站点相同。
- 触发路径：`/admin/v1`。
- 关联资源：云托管服务 `miao-travel-wechat`。
- 路径透传：开启。不开启会剥掉 `/admin/v1` 前缀，后端将无法命中管理路由。

### 规则二：管理页面

- 域名：与管理 API 相同。
- 触发路径：`/`。
- 关联资源：静态网站托管 `miao-admin`。

保存后记录完整 Origin，例如：

```text
https://cloud1-d3guut2kr1085b24f.ap-shanghai.app.tcloudbase.com
```

上面只是格式示例，必须以控制台实际分配的域名为准。

## 5. 更新后端可信来源

进入 CloudBase Run 服务 `miao-travel-wechat` 的 Git 平台部署配置：

1. 将 `ADMIN_WEB_ORIGIN` 更新为第 4 步实际 HTTPS Origin。
2. 不带路径，不带末尾 `/`。
3. 其他 Secret 保持不变。
4. 发布新版本并自动切换流量。

示例：

```text
ADMIN_WEB_ORIGIN=https://实际网关域名
```

不要把该值写成静态托管独立 CDN 域名或 CloudBase Run 的直连域名，必须与浏览器地址栏 Origin 完全一致。

## 6. 公网验收

使用网关根地址执行：

1. 打开根路径，自动进入登录页。
2. 登录后进入玩家列表；刷新页面仍保持登录状态。
3. 打开玩家详情和云存档诊断，只做读取验收，不操作真实玩家回滚或封禁。
4. 打开错误日志并查询一条真实脱敏日志。
5. 退出登录后回到登录页，再刷新仍保持未登录。
6. 直接刷新 `/players` 与 `/errors`，确认 SPA 回退有效。
7. 浏览器确认 `miao_admin_session` 为 `HttpOnly`、`Secure`、`SameSite=Strict`，Path 为 `/admin/v1`。
8. 检查页面源码和 Network，确认没有管理员密码、AppSecret、CloudBase API Key 或玩家 token。

验收结束后在 `docs/acceptance/` 记录实际域名（可只记录主机名）、部署版本、测试结果和待办，再中文提交推送。

## 7. 回滚

- 页面异常：在静态网站托管切回上一成功版本，不改后端。
- API 路由异常：恢复 HTTP 网关上一条有效路由配置。
- Origin 配置异常：将 CloudBase Run 流量切回上一版本。
- 不通过放宽 Cookie、安全来源或把 token 放入 localStorage 来绕过部署问题。

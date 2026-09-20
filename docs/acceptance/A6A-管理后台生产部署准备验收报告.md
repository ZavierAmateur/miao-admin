# A6A 管理后台生产部署准备验收报告

## 验收日期

2026-09-20

## 自动验收

- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm test`：3 个测试文件、4 项测试通过。
- `npm run build:cloud`：通过，Vite 生产构建成功。
- CloudBase 产物自检：41 个文件，总大小 761876 Bytes。
- 产物使用 `production` 环境和同源 `/admin/v1/*`。
- 产物不包含 CloudBase Run 直连域名、管理员密码变量、AppSecret、CloudBase API Key 或 Vite 云端代理地址。
- 产物不包含 Source Map。
- `git diff --check`：通过。

## 已交付部署能力

- 新增 `.env.production`，避免生产包错误显示为开发环境。
- 新增 `build:cloud`、`check:cloud-dist` 和 `verify:cloud` 命令。
- 新增可重复执行的静态产物安全检查脚本。
- 冻结 CloudBase 静态托管 + HTTP 网关同域分流方案。
- 明确 `/admin/v1` 路由必须开启路径透传，后端 `ADMIN_WEB_ORIGIN` 必须等于浏览器实际网关 Origin。
- 补齐 Git 部署参数、SPA 回退、公网验收和回滚说明。

## 验收边界

- 当前通过的是生产部署包与配置方案验收，尚未创建 CloudBase 静态托管版本和 HTTP 网关路由。
- 待控制台配置后，必须继续验证公网登录、刷新会话恢复、玩家只读查询、错误日志、退出登录和 Cookie 安全属性。
- 不以真实玩家执行回滚、封禁或解封来验收 Web 部署。

## 结论

A6A 本地生产部署准备验收通过，可以提交推送并进入 CloudBase 控制台部署。公网验收完成前，不标记管理后台生产发布完成。

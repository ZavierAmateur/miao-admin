# A6C 用户管理命名与空列表诊断验收报告

## 验收日期

2026-09-20

## 验收内容

- 侧边栏、页面标题、用户 ID、用户详情、封禁提示和存档返回入口统一使用“用户”文案。
- 开发环境明确提示本地内存后端不包含 CloudBase 用户，并给出 `npm run dev:cloud` 命令。
- 云端模式空列表明确说明：只有完成小游戏平台登录的游戏用户才会出现，管理员账号不会出现在列表。
- 内部路由、API、`playerId` 和权限保持兼容。
- CloudBase 只读核对返回 1 条微信游戏用户记录，证明目标云环境已有可展示数据；核对过程没有输出用户标识或敏感配置。

## 验收命令

- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm test`：3 个测试文件、4 项测试通过。
- `npm run build`：通过。
- `git diff --check`：通过。

真实数据展示仍取决于使用 `npm run dev:cloud` 且目标 CloudBase 的 `players` 集合存在游戏登录记录。

本次目标 CloudBase 已确认存在 1 条微信记录。若页面仍为空，应停止旧 Vite 进程后重新执行 `npm run dev:cloud`，再通过新终端地址重新登录。

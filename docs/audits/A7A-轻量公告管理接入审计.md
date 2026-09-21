# A7A 轻量公告管理接入审计

日期：2026-09-21

## 审计结论

- 后端契约来源固定为 `miao-travel-server` 提交 `65c44b2`，不从旧项目或 CloudBase 数据库反推字段。
- 后台继续作为本地内部工具运行，不新增静态托管、HTTP 网关、独立域名或后台容器。
- 公告使用独立列表、详情、新增、更新和删除接口，不并入启动配置。
- 富文本编辑器只需覆盖标题、粗体、斜体、下划线、列表、居中和清除格式，不引入大型编辑器依赖。
- 图片统一调用通用 `/admin/v1/files/upload`；后台不直传 COS、不保存 SecretId/SecretKey，也不建设公告图片专用 API。

## 页面与权限

- `/announcements`：要求 `config:read`，支持标题、状态、平台筛选和普通页码分页。
- `/announcements/new`、`/announcements/:announcementId/edit`：要求 `config:write`。
- 新增、编辑、删除按钮继续由前端权限控制体验，最终权限仍由后端校验。
- 删除要求二次确认；首版不做批量删除、复制、版本回滚和审批流。

## 字段映射

- 基础：`title/status/platforms/sortOrder/autoPopup/startsAt/endsAt`。
- 正文：`contentHtml`。
- 图片：`images[].fileId/objectKey/url/alt`，顺序即游戏端在正文下方的展示顺序。
- 管理列表只使用后端摘要字段，不为展示列表额外请求详情。

## 风险控制

- 前端粘贴默认转成纯文本，减少从网页复制危险标记；最终仍以后端富文本白名单清理为准。
- 上传前先做 5MB 和最多 9 张的体验校验；文件头、管理员权限和 COS 上传结果由后端再次校验。
- COS 默认域名可能不能在浏览器预览时，页面仍保留“打开原图”链接；正式环境应由后端切换 `COS_PUBLIC_BASE_URL`。

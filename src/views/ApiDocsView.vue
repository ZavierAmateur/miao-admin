<script setup lang="ts">
const groups = [
  { title: '管理员认证', rows: [
    ['POST', '/admin/v1/auth/login', '公开', '登录并写入 HttpOnly Cookie'],
    ['GET', '/admin/v1/auth/me', '已登录', '读取当前管理员身份与权限'],
    ['POST', '/admin/v1/auth/logout', '已登录', '撤销当前会话'],
  ] },
  { title: '用户查询', rows: [
    ['GET', '/admin/v1/players', 'player:read', '精确 ID、平台、状态筛选及游标分页'],
    ['GET', '/admin/v1/players/:playerId', 'player:read', '基础信息、资料与云存档摘要'],
  ] },
  { title: '存档诊断与封禁', rows: [
    ['GET', '/admin/v1/players/:playerId/save', 'save:read', '读取当前/上一版摘要及 user 字段差异'],
    ['POST', '/admin/v1/players/:playerId/save-rollback', 'save:rollback', '按 expectedRevision 原子回滚并生成新 revision'],
    ['POST', '/admin/v1/players/:playerId/ban', 'player:ban', '临时或永久封禁；永久封禁仅超管'],
    ['POST', '/admin/v1/players/:playerId/unban', 'player:ban', '填写原因后解除封禁'],
  ] },
]
</script>

<template>
  <section>
    <header class="page-heading"><h1>请求接口文档</h1><p>管理后台当前实际使用的 API 契约；统一前缀为 <code>/admin/v1</code>。</p></header>
    <el-alert title="认证说明" description="浏览器通过 HttpOnly Cookie 携带会话；写请求校验管理后台 Origin。响应统一包含 code、msg、timestamp、requestId 和 data。" type="info" :closable="false" show-icon />
    <el-card v-for="group in groups" :key="group.title" shadow="never" class="docs-card">
      <template #header><strong>{{ group.title }}</strong></template>
      <el-table :data="group.rows.map(([method, path, permission, description]) => ({ method, path, permission, description }))">
        <el-table-column prop="method" label="方法" width="90"><template #default="scope"><el-tag>{{ scope.row.method }}</el-tag></template></el-table-column>
        <el-table-column prop="path" label="路径" min-width="320"><template #default="scope"><code>{{ scope.row.path }}</code></template></el-table-column>
        <el-table-column prop="permission" label="权限" width="150" />
        <el-table-column prop="description" label="说明" min-width="300" />
      </el-table>
    </el-card>
    <el-card shadow="never" class="docs-card">
      <template #header><strong>用户列表查询参数</strong></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="playerId">完整用户 ID，精确匹配</el-descriptions-item>
        <el-descriptions-item label="platform"><code>wechat | bytedance</code></el-descriptions-item>
        <el-descriptions-item label="status"><code>active | banned</code></el-descriptions-item>
        <el-descriptions-item label="cursor">服务端返回的不透明分页游标</el-descriptions-item>
        <el-descriptions-item label="limit">1～50，默认 20</el-descriptions-item>
      </el-descriptions>
    </el-card>
    <el-card shadow="never" class="docs-card">
      <template #header><strong>关键写请求</strong></template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="存档回滚"><code>{ expectedRevision: number, reason: string }</code></el-descriptions-item>
        <el-descriptions-item label="临时封禁"><code>{ type: 'temporary', expiresAt: number, reason: string, note?: string }</code></el-descriptions-item>
        <el-descriptions-item label="永久封禁"><code>{ type: 'permanent', reason: string, note?: string }</code></el-descriptions-item>
        <el-descriptions-item label="解除封禁"><code>{ reason: string }</code></el-descriptions-item>
      </el-descriptions>
    </el-card>
  </section>
</template>

<style scoped>
.docs-card { margin-top: 18px; }
code { color: #475569; }
</style>

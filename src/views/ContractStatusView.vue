<script setup lang="ts">
const rows = [
  { capability: '管理员登录与会话', endpoint: '/admin/v1/auth/*', status: '已接入' },
  { capability: '玩家检索与详情', endpoint: '/admin/v1/players/*', status: '已接入' },
  { capability: '云存档摘要与回滚', endpoint: '/admin/v1/players/:id/saves', status: '待后端实现' },
  { capability: '封禁与解封', endpoint: '/admin/v1/players/:id/ban', status: '待后端实现' },
  { capability: '管理审计', endpoint: '/admin/v1/audit-logs', status: '待后端实现' },
]
</script>

<template>
  <section>
    <header class="page-heading"><h1>接口状态</h1><p>A1 工程基线与后端管理契约的当前衔接状态。</p></header>
    <el-card shadow="never">
      <el-table :data="rows">
        <el-table-column prop="capability" label="能力" min-width="180" />
        <el-table-column prop="endpoint" label="计划接口" min-width="280">
          <template #default="scope"><code>{{ scope.row.endpoint }}</code></template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="140">
          <template #default="scope">
            <el-tag :type="scope.row.status === '已接入' ? 'success' : 'warning'">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </section>
</template>

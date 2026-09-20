<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import { getErrorLog, listErrorLogs, type AdminErrorLog } from '../api/adminErrors'
import { ApiRequestError } from '../api/types'

const loading = ref(false)
const detailLoading = ref(false)
const errorMessage = ref('')
const rows = ref<AdminErrorLog[]>([])
const selected = ref<AdminErrorLog | null>(null)
const detailVisible = ref(false)
const nextCursor = ref<string | null>(null)
const cursorHistory = ref<string[]>([])
const filters = reactive<{
  requestId: string
  code: string
  from: Date | null
  to: Date | null
}>({ requestId: '', code: '', from: null, to: null })

async function load(cursor?: string): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listErrorLogs({
      requestId: filters.requestId.trim() || undefined,
      code: filters.code.trim() || undefined,
      from: filters.from?.getTime(),
      to: filters.to?.getTime(),
      cursor,
      limit: 20,
    })
    rows.value = [...result.items]
    nextCursor.value = result.nextCursor
  } catch (error) {
    errorMessage.value = error instanceof ApiRequestError ? error.message : '错误日志加载失败'
  } finally {
    loading.value = false
  }
}

async function search(): Promise<void> {
  cursorHistory.value = []
  await load()
}

async function reset(): Promise<void> {
  filters.requestId = ''
  filters.code = ''
  filters.from = null
  filters.to = null
  await search()
}

async function nextPage(): Promise<void> {
  if (!nextCursor.value) return
  cursorHistory.value.push(nextCursor.value)
  await load(nextCursor.value)
}

async function previousPage(): Promise<void> {
  cursorHistory.value.pop()
  await load(cursorHistory.value.at(-1))
}

async function showDetail(value: unknown): Promise<void> {
  const row = value as AdminErrorLog
  detailVisible.value = true
  detailLoading.value = true
  selected.value = row
  try {
    selected.value = await getErrorLog(row.id)
  } catch (error) {
    errorMessage.value = error instanceof ApiRequestError ? error.message : '错误详情加载失败'
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

function formatTime(value: number): string {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'medium' }).format(value)
}

function statusType(statusCode: number): 'danger' | 'warning' {
  return statusCode >= 500 ? 'danger' : 'warning'
}

onMounted(() => load())
</script>

<template>
  <section>
    <header class="page-heading"><h1>错误日志</h1><p>查询脱敏后的接口错误，通过 requestId 关联 CloudBase 运行日志。</p></header>
    <el-card shadow="never" class="filter-card">
      <el-form inline @submit.prevent="search">
        <el-form-item label="Request ID"><el-input v-model="filters.requestId" clearable placeholder="输入完整 requestId" style="width: 260px" /></el-form-item>
        <el-form-item label="错误码"><el-input v-model="filters.code" clearable placeholder="如 SAVE_CONFLICT" style="width: 210px" /></el-form-item>
        <el-form-item label="开始时间"><el-date-picker v-model="filters.from" type="datetime" placeholder="不限" style="width: 190px" /></el-form-item>
        <el-form-item label="结束时间"><el-date-picker v-model="filters.to" type="datetime" placeholder="不限" style="width: 190px" /></el-form-item>
        <el-form-item><el-button type="primary" :icon="Search" :loading="loading" @click="search">查询</el-button></el-form-item>
        <el-form-item><el-button :disabled="loading" @click="reset">重置</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />
    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="rows" empty-text="暂无符合条件的错误日志">
        <el-table-column label="发生时间" min-width="180"><template #default="scope">{{ formatTime(scope.row.occurredAt) }}</template></el-table-column>
        <el-table-column label="错误码" min-width="190"><template #default="scope"><code>{{ scope.row.code }}</code></template></el-table-column>
        <el-table-column label="HTTP" width="90"><template #default="scope"><el-tag :type="statusType(scope.row.statusCode)">{{ scope.row.statusCode }}</el-tag></template></el-table-column>
        <el-table-column label="接口" min-width="250"><template #default="scope"><span class="method">{{ scope.row.method }}</span><code>{{ scope.row.path }}</code></template></el-table-column>
        <el-table-column prop="requestId" label="Request ID" min-width="260"><template #default="scope"><code>{{ scope.row.requestId }}</code></template></el-table-column>
        <el-table-column label="操作" width="90" fixed="right"><template #default="scope"><el-button link type="primary" @click="showDetail(scope.row)">详情</el-button></template></el-table-column>
      </el-table>
      <div class="pager">
        <el-button :disabled="cursorHistory.length === 0 || loading" @click="previousPage">上一页</el-button>
        <span>第 {{ cursorHistory.length + 1 }} 页</span>
        <el-button :disabled="!nextCursor || loading" @click="nextPage">下一页</el-button>
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="错误详情" width="680px">
      <el-descriptions v-if="selected" v-loading="detailLoading" :column="1" border>
        <el-descriptions-item label="发生时间">{{ formatTime(selected.occurredAt) }}</el-descriptions-item>
        <el-descriptions-item label="错误码"><code>{{ selected.code }}</code></el-descriptions-item>
        <el-descriptions-item label="提示信息">{{ selected.message }}</el-descriptions-item>
        <el-descriptions-item label="HTTP 状态">{{ selected.statusCode }}</el-descriptions-item>
        <el-descriptions-item label="请求接口"><span class="method">{{ selected.method }}</span><code>{{ selected.path }}</code></el-descriptions-item>
        <el-descriptions-item label="Request ID"><code>{{ selected.requestId }}</code></el-descriptions-item>
        <el-descriptions-item label="错误类型"><code>{{ selected.errorName }}</code></el-descriptions-item>
        <el-descriptions-item label="日志 ID"><code>{{ selected.id }}</code></el-descriptions-item>
      </el-descriptions>
      <template #footer><el-button @click="detailVisible = false">关闭</el-button></template>
    </el-dialog>
  </section>
</template>

<style scoped>
.filter-card { margin-bottom: 18px; }
.filter-card :deep(.el-form-item) { margin-bottom: 12px; }
.table-card { margin-top: 18px; }
.pager { display: flex; justify-content: flex-end; align-items: center; gap: 14px; margin-top: 18px; color: #6b7280; font-size: 14px; }
.method { display: inline-block; margin-right: 8px; color: #6e56cf; font-weight: 700; }
code { color: #334155; word-break: break-all; }
</style>

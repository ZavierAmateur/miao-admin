<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listPlayers, type PlayerListItem, type PlayerPlatform, type PlayerStatus } from '../api/adminPlayers'
import { ApiRequestError } from '../api/types'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const rows = ref<PlayerListItem[]>([])
const nextCursor = ref<string | null>(null)
const cursorHistory = ref<string[]>([])
const filters = reactive<{ playerId: string; platform: '' | PlayerPlatform; status: '' | PlayerStatus }>({
  playerId: '', platform: '', status: '',
})

async function load(cursor?: string): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listPlayers({
      playerId: filters.playerId.trim() || undefined,
      platform: filters.platform || undefined,
      status: filters.status || undefined,
      cursor,
      limit: 20,
    })
    rows.value = [...result.items]
    nextCursor.value = result.nextCursor
  } catch (error) {
    errorMessage.value = error instanceof ApiRequestError ? error.message : '玩家列表加载失败'
  } finally {
    loading.value = false
  }
}

async function search(): Promise<void> {
  cursorHistory.value = []
  await load()
}

async function nextPage(): Promise<void> {
  if (!nextCursor.value) return
  cursorHistory.value.push(nextCursor.value)
  await load(nextCursor.value)
}

async function previousPage(): Promise<void> {
  cursorHistory.value.pop()
  const previous = cursorHistory.value.at(-1)
  await load(previous)
}

function formatTime(value: number): string {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(value)
}

onMounted(() => load())
</script>

<template>
  <section>
    <header class="page-heading"><h1>玩家管理</h1><p>按玩家 ID 精确查询，或按平台与状态浏览玩家。</p></header>
    <el-card shadow="never" class="filter-card">
      <el-form inline @submit.prevent="search">
        <el-form-item label="玩家 ID"><el-input v-model="filters.playerId" clearable placeholder="输入完整 playerId" style="width: 280px" /></el-form-item>
        <el-form-item label="平台">
          <el-select v-model="filters.platform" clearable placeholder="全部" style="width: 130px">
            <el-option label="微信" value="wechat" /><el-option label="抖音" value="bytedance" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部" style="width: 130px">
            <el-option label="正常" value="active" /><el-option label="已封禁" value="banned" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" :icon="Search" :loading="loading" @click="search">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />
    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="rows" empty-text="暂无符合条件的玩家">
        <el-table-column prop="id" label="玩家 ID" min-width="260"><template #default="scope"><code>{{ scope.row.id }}</code></template></el-table-column>
        <el-table-column label="平台" width="100"><template #default="scope">{{ scope.row.platform === 'wechat' ? '微信' : '抖音' }}</template></el-table-column>
        <el-table-column label="状态" width="100"><template #default="scope"><el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">{{ scope.row.status === 'active' ? '正常' : '已封禁' }}</el-tag></template></el-table-column>
        <el-table-column label="最近登录" min-width="170"><template #default="scope">{{ formatTime(scope.row.lastLoginAt) }}</template></el-table-column>
        <el-table-column label="存档版本" width="110"><template #default="scope">{{ scope.row.save?.revision ?? '无' }}</template></el-table-column>
        <el-table-column label="操作" width="100" fixed="right"><template #default="scope"><el-button link type="primary" @click="router.push(`/players/${scope.row.id}`)">详情</el-button></template></el-table-column>
      </el-table>
      <div class="pager">
        <el-button :disabled="cursorHistory.length === 0 || loading" @click="previousPage">上一页</el-button>
        <span>第 {{ cursorHistory.length + 1 }} 页</span>
        <el-button :disabled="!nextCursor || loading" @click="nextPage">下一页</el-button>
      </div>
    </el-card>
  </section>
</template>

<style scoped>
.filter-card { margin-bottom: 18px; }
.filter-card :deep(.el-form-item) { margin-bottom: 0; }
.table-card { margin-top: 18px; }
.pager { display: flex; justify-content: flex-end; align-items: center; gap: 14px; margin-top: 18px; color: #6b7280; font-size: 14px; }
code { color: #334155; }
</style>

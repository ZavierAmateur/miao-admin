<script setup lang="ts">
import { Delete, Edit, Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deleteAnnouncement, listAnnouncements, type AnnouncementListItem, type AnnouncementPlatform, type AnnouncementStatus } from '../api/adminAnnouncements'
import { ApiRequestError } from '../api/types'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const errorMessage = ref('')
const rows = ref<AnnouncementListItem[]>([])
const page = ref(1)
const pageSize = 20
const total = ref(0)
const filters = reactive<{ keyword: string; status: '' | AnnouncementStatus; platform: '' | AnnouncementPlatform }>({
  keyword: '', status: '', platform: '',
})

async function load(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listAnnouncements({
      page: page.value,
      pageSize,
      keyword: filters.keyword.trim() || undefined,
      status: filters.status || undefined,
      platform: filters.platform || undefined,
    })
    rows.value = [...result.items]
    total.value = result.total
  } catch (error) {
    errorMessage.value = error instanceof ApiRequestError ? error.message : '公告列表加载失败'
  } finally {
    loading.value = false
  }
}

async function search(): Promise<void> {
  page.value = 1
  await load()
}

async function reset(): Promise<void> {
  filters.keyword = ''
  filters.status = ''
  filters.platform = ''
  await search()
}

function edit(value: unknown): void {
  const row = value as AnnouncementListItem
  void router.push({ name: 'announcement-edit', params: { announcementId: row.id } })
}

async function remove(value: unknown): Promise<void> {
  const row = value as AnnouncementListItem
  try {
    await ElMessageBox.confirm(`确定删除公告“${row.title}”吗？删除后不可恢复。`, '删除公告', {
      confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning',
    })
    await deleteAnnouncement(row.id)
    ElMessage.success('公告已删除')
    if (rows.value.length === 1 && page.value > 1) page.value -= 1
    await load()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error instanceof ApiRequestError ? error.message : '删除公告失败')
  }
}

function formatTime(value: number): string {
  if (value === 0) return '不限'
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(value)
}

function platformText(platforms: readonly AnnouncementPlatform[]): string {
  return platforms.map((platform) => platform === 'wechat' ? '微信' : '抖音').join('、')
}

onMounted(() => load())
</script>

<template>
  <section>
    <header class="page-heading heading-actions">
      <div><h1>公告管理</h1><p>维护公告正文与图片；游戏端按列表和详情分别读取。</p></div>
      <el-button v-if="auth.hasPermission('config:write')" type="primary" :icon="Plus" @click="router.push({ name: 'announcement-create' })">新增公告</el-button>
    </header>

    <el-card shadow="never" class="filter-card">
      <el-form inline @submit.prevent="search">
        <el-form-item label="标题"><el-input v-model="filters.keyword" clearable placeholder="输入标题关键字" style="width: 180px" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" style="width: 110px"><el-option label="全部" value="" /><el-option label="草稿" value="draft" /><el-option label="已发布" value="published" /></el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="filters.platform" placeholder="全部" style="width: 110px"><el-option label="全部" value="" /><el-option label="微信" value="wechat" /><el-option label="抖音" value="bytedance" /></el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" :icon="Search" :loading="loading" @click="search">查询</el-button></el-form-item>
        <el-form-item><el-button :disabled="loading" @click="reset">重置</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />
    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="rows" empty-text="暂无公告">
        <el-table-column prop="title" label="标题" min-width="260" show-overflow-tooltip />
        <el-table-column label="状态" width="100"><template #default="scope"><el-tag :type="scope.row.status === 'published' ? 'success' : 'info'">{{ scope.row.status === 'published' ? '已发布' : '草稿' }}</el-tag></template></el-table-column>
        <el-table-column label="平台" width="140"><template #default="scope">{{ platformText(scope.row.platforms) }}</template></el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="90" />
        <el-table-column label="图片" width="90"><template #default="scope">{{ scope.row.imageCount }} 张</template></el-table-column>
        <el-table-column label="自动弹出" width="100"><template #default="scope">{{ scope.row.autoPopup ? '是' : '否' }}</template></el-table-column>
        <el-table-column label="生效时间" min-width="170"><template #default="scope">{{ formatTime(scope.row.startsAt) }}</template></el-table-column>
        <el-table-column label="更新时间" min-width="170"><template #default="scope">{{ formatTime(scope.row.updatedAt) }}</template></el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button v-if="auth.hasPermission('config:write')" link type="primary" :icon="Edit" @click="edit(scope.row)">编辑</el-button>
            <el-button v-if="auth.hasPermission('config:write')" link type="danger" :icon="Delete" @click="remove(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager"><el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next, total" @current-change="load" /></div>
    </el-card>
  </section>
</template>

<style scoped>
.heading-actions { display: flex; align-items: flex-start; justify-content: space-between; }
.filter-card { margin-bottom: 18px; }
.filter-card :deep(.el-form-item) { margin-right: 12px; margin-bottom: 12px; }
.table-card { margin-top: 18px; }
.pager { display: flex; justify-content: flex-end; margin-top: 18px; }
</style>

<script setup lang="ts">
import { BellFilled, Delete, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deleteAnnouncement, getAnnouncement, listAnnouncements, updateAnnouncement, type AnnouncementInput, type AnnouncementListItem, type AnnouncementPlatform, type AnnouncementStatus } from '../api/adminAnnouncements'
import { ApiRequestError } from '../api/types'
import { useAuthStore } from '../stores/auth'
import AnnouncementEditor from '../components/AnnouncementEditor.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const loading = ref(false)
const errorMessage = ref('')
const rows = ref<AnnouncementListItem[]>([])
const page = ref(1)
const pageSize = 20
const total = ref(0)
const createVisible = ref(false)
const editingId = ref('')
const rowSaving = reactive<Record<string, boolean>>({})
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
  editingId.value = row.id
  createVisible.value = true
}

function openCreate(): void {
  editingId.value = ''
  createVisible.value = true
}

async function saved(): Promise<void> {
  createVisible.value = false
  editingId.value = ''
  if (route.query.action === 'new' || route.query.edit) await router.replace({ name: 'announcements' })
  page.value = 1
  await load()
}

function closeCreate(): void {
  createVisible.value = false
  editingId.value = ''
  if (route.query.action === 'new' || route.query.edit) void router.replace({ name: 'announcements' })
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

async function updateRow(
  row: AnnouncementListItem,
  patch: Partial<Pick<AnnouncementInput, 'status' | 'platforms' | 'autoPopup'>>,
  successMessage: string,
): Promise<void> {
  if (rowSaving[row.id]) return
  if (patch.platforms?.length === 0) {
    ElMessage.warning('至少选择一个平台')
    return
  }
  rowSaving[row.id] = true
  try {
    const current = await getAnnouncement(row.id)
    const updated = await updateAnnouncement(row.id, {
      title: current.title,
      contentHtml: current.contentHtml,
      images: current.images,
      status: patch.status ?? current.status,
      platforms: patch.platforms ?? current.platforms,
      sortOrder: current.sortOrder,
      autoPopup: patch.autoPopup ?? current.autoPopup,
      startsAt: current.startsAt,
      endsAt: current.endsAt,
    })
    const index = rows.value.findIndex((item) => item.id === row.id)
    if (index >= 0) {
      rows.value[index] = {
        id: updated.id,
        title: updated.title,
        status: updated.status,
        platforms: [...updated.platforms],
        sortOrder: updated.sortOrder,
        autoPopup: updated.autoPopup,
        startsAt: updated.startsAt,
        endsAt: updated.endsAt,
        imageCount: updated.images.length,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      }
    }
    ElMessage.success(successMessage)
  } catch (error) {
    ElMessage.error(error instanceof ApiRequestError ? error.message : '公告更新失败')
  } finally {
    rowSaving[row.id] = false
  }
}

function changeStatus(value: unknown, selected: unknown): void {
  void updateRow(value as AnnouncementListItem, { status: selected as AnnouncementStatus }, '公告状态已更新')
}

function togglePlatform(value: unknown, platform: AnnouncementPlatform, enabled: unknown): void {
  const row = value as AnnouncementListItem
  const platforms = enabled
    ? [...new Set([...row.platforms, platform])]
    : row.platforms.filter((item) => item !== platform)
  void updateRow(row, { platforms }, '投放平台已更新')
}

function changeAutoPopup(value: unknown, selected: unknown): void {
  void updateRow(value as AnnouncementListItem, { autoPopup: selected as boolean }, '自动弹出设置已更新')
}

function formatTime(value: number): string {
  if (value === 0) return '不限'
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(value)
}

onMounted(() => {
  editingId.value = typeof route.query.edit === 'string' ? route.query.edit : ''
  createVisible.value = route.query.action === 'new' || Boolean(editingId.value)
  void load()
})
</script>

<template>
  <section>
    <header class="page-heading heading-actions announcement-hero">
      <div class="hero-copy">
        <span class="hero-icon"><el-icon><BellFilled /></el-icon></span>
        <div><h1>公告管理</h1><p>统一管理游戏内公告、投放平台和展示时间。</p></div>
      </div>
      <el-button v-if="auth.hasPermission('config:write')" type="primary" size="large" :icon="Plus" @click="openCreate">新增公告</el-button>
    </header>

    <el-card shadow="never" class="filter-card">
      <div class="filter-heading"><strong>筛选公告</strong><span>共 {{ total }} 条记录</span></div>
      <el-form inline class="filter-form" @submit.prevent="search">
        <el-form-item label="标题"><el-input v-model="filters.keyword" clearable placeholder="输入标题关键字" style="width: 220px" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" style="width: 110px"><el-option label="全部" value="" /><el-option label="草稿" value="draft" /><el-option label="已发布" value="published" /></el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="filters.platform" placeholder="全部" style="width: 110px"><el-option label="全部" value="" /><el-option label="微信" value="wechat" /><el-option label="抖音" value="bytedance" /></el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" :icon="Search" :loading="loading" @click="search">查询</el-button></el-form-item>
        <el-form-item><el-button :icon="Refresh" :disabled="loading" @click="reset">重置</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />
    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="rows" empty-text="暂无公告" class="announcement-table">
        <el-table-column label="公告" min-width="180">
          <template #default="scope"><div class="title-cell"><span class="announcement-dot" :class="scope.row.status" /><div><strong>{{ scope.row.title }}</strong><small>更新于 {{ formatTime(scope.row.updatedAt) }}</small></div></div></template>
        </el-table-column>
        <el-table-column label="状态" width="130">
          <template #default="scope">
            <el-select class="table-select status-select" :model-value="scope.row.status" :disabled="!auth.hasPermission('config:write') || rowSaving[scope.row.id]" :loading="rowSaving[scope.row.id]" @change="changeStatus(scope.row, $event)">
              <el-option label="草稿" value="draft" /><el-option label="已发布" value="published" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="平台" width="200">
          <template #default="scope">
            <div class="platform-switches">
              <label><span>微信</span><el-switch :model-value="scope.row.platforms.includes('wechat')" :loading="rowSaving[scope.row.id]" :disabled="!auth.hasPermission('config:write') || rowSaving[scope.row.id]" @change="togglePlatform(scope.row, 'wechat', $event)" /></label>
              <label><span>抖音</span><el-switch :model-value="scope.row.platforms.includes('bytedance')" :loading="rowSaving[scope.row.id]" :disabled="!auth.hasPermission('config:write') || rowSaving[scope.row.id]" @change="togglePlatform(scope.row, 'bytedance', $event)" /></label>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="90" />
        <el-table-column label="图片" width="90"><template #default="scope">{{ scope.row.imageCount }} 张</template></el-table-column>
        <el-table-column label="自动弹出" width="130">
          <template #default="scope">
            <el-switch :model-value="scope.row.autoPopup" inline-prompt active-text="是" inactive-text="否" :loading="rowSaving[scope.row.id]" :disabled="!auth.hasPermission('config:write') || rowSaving[scope.row.id]" @change="changeAutoPopup(scope.row, $event)" />
          </template>
        </el-table-column>
        <el-table-column label="生效时间" min-width="170"><template #default="scope">{{ formatTime(scope.row.startsAt) }}</template></el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button v-if="auth.hasPermission('config:write')" link type="primary" :icon="Edit" @click="edit(scope.row)">编辑</el-button>
            <el-button v-if="auth.hasPermission('config:write')" link type="danger" :icon="Delete" @click="remove(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager"><el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next, total" @current-change="load" /></div>
    </el-card>

    <el-dialog
      v-model="createVisible"
      width="min(1120px, calc(100vw - 64px))"
      class="announcement-dialog"
      :close-on-click-modal="false"
      destroy-on-close
      @closed="closeCreate"
    >
      <template #header>
        <div class="dialog-heading"><span class="dialog-icon"><el-icon><component :is="editingId ? Edit : Plus" /></el-icon></span><div><h2>{{ editingId ? '编辑公告' : '新增公告' }}</h2><p>{{ editingId ? '修改公告内容与投放规则，保存后立即更新。' : '填写公告内容并设置投放规则，保存后可随时编辑。' }}</p></div></div>
      </template>
      <AnnouncementEditor :announcement-id="editingId" @saved="saved" @cancel="closeCreate" />
    </el-dialog>
  </section>
</template>

<style scoped>
.heading-actions { display: flex; align-items: center; justify-content: space-between; }
.announcement-hero { padding: 4px 2px 2px; }
.hero-copy { display: flex; align-items: center; gap: 16px; }
.hero-icon { display: grid; width: 48px; height: 48px; place-items: center; border-radius: 15px; color: #fff; background: linear-gradient(135deg, #409eff, #6b5de7); box-shadow: 0 10px 24px rgb(64 158 255 / 22%); font-size: 22px; }
.filter-card { margin-bottom: 18px; border-color: #e7ecf3; border-radius: 12px; }
.filter-card :deep(.el-card__body) { padding: 18px 20px 6px; }
.filter-heading { display: flex; justify-content: space-between; margin-bottom: 16px; }
.filter-heading strong { color: #293448; font-size: 14px; }
.filter-heading span { color: #98a2b3; font-size: 12px; }
.filter-card :deep(.el-form-item) { margin-right: 14px; margin-bottom: 12px; }
.table-card { margin-top: 18px; border-color: #e7ecf3; border-radius: 12px; }
.table-card :deep(.el-card__body) { padding: 8px 18px 18px; }
.announcement-table :deep(th.el-table__cell) { height: 48px; color: #667085; background: #fafbfc; font-weight: 600; }
.announcement-table :deep(td.el-table__cell) { padding: 14px 0; }
.table-select { width: 132px; }
.status-select { width: 96px; }
.table-select :deep(.el-select__wrapper) { min-height: 32px; border-radius: 8px; box-shadow: 0 0 0 1px #e2e7ef inset; }
.table-select :deep(.el-select__wrapper:hover) { box-shadow: 0 0 0 1px #9ec8ff inset; }
.platform-switches { display: flex; align-items: center; gap: 14px; }
.platform-switches label { display: flex; align-items: center; gap: 6px; color: #667085; font-size: 12px; }
.title-cell { display: flex; align-items: center; gap: 12px; }
.title-cell > div { display: grid; gap: 5px; min-width: 0; }
.title-cell strong { overflow: hidden; color: #273449; text-overflow: ellipsis; white-space: nowrap; }
.title-cell small { color: #98a2b3; font-size: 12px; }
.announcement-dot { width: 9px; height: 9px; flex: 0 0 auto; border-radius: 50%; background: #98a2b3; box-shadow: 0 0 0 4px #f2f4f7; }
.announcement-dot.published { background: #20b26b; box-shadow: 0 0 0 4px #e9f8f0; }
.pager { display: flex; justify-content: flex-end; margin-top: 18px; }
.dialog-heading { display: flex; align-items: center; gap: 14px; }
.dialog-heading h2 { margin: 0 0 5px; color: #182230; font-size: 21px; }
.dialog-heading p { margin: 0; color: #7b8495; font-size: 13px; }
.dialog-icon { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 13px; color: #fff; background: linear-gradient(135deg, #409eff, #6574e8); font-size: 19px; }
:deep(.announcement-dialog) { margin-top: 4vh; border-radius: 16px; overflow: hidden; }
:deep(.announcement-dialog .el-dialog__header) { padding: 20px 24px; border-bottom: 1px solid #edf0f5; }
:deep(.announcement-dialog .el-dialog__body) { max-height: calc(92vh - 94px); padding: 18px 24px 22px; overflow-y: auto; background: #f7f9fc; }
</style>

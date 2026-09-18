<script setup lang="ts">
import { ArrowLeft, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSaveDiagnostics, rollbackSave, type SaveDiagnostics } from '../api/adminPlayers'
import { ApiRequestError } from '../api/types'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const playerId = String(route.params.playerId)
const data = ref<SaveDiagnostics | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const rollbackVisible = ref(false)
const rollbackReason = ref('')
const submitting = ref(false)
const canRollback = computed(() => auth.hasPermission('save:rollback'))

function formatTime(value: number): string {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'medium' }).format(value)
}

function displayValue(value: unknown): string {
  return value === null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value)
}

async function load(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    data.value = await getSaveDiagnostics(playerId)
  } catch (error) {
    errorMessage.value = error instanceof ApiRequestError ? error.message : '云存档诊断加载失败'
  } finally {
    loading.value = false
  }
}

async function confirmRollback(): Promise<void> {
  if (!data.value?.previous || rollbackReason.value.trim().length < 2) return
  submitting.value = true
  try {
    const result = await rollbackSave(playerId, data.value.current.revision, rollbackReason.value.trim())
    ElMessage.success(`已从 revision ${result.sourceRevision} 回滚，新 revision 为 ${result.revision}`)
    rollbackVisible.value = false
    rollbackReason.value = ''
    await load()
  } catch (error) {
    ElMessage.error(error instanceof ApiRequestError ? error.message : '回滚失败')
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <section v-loading="loading">
    <el-button text :icon="ArrowLeft" @click="router.push(`/players/${playerId}`)">返回玩家详情</el-button>
    <header class="page-heading detail-heading">
      <div><h1>云存档诊断</h1><p><code>{{ playerId }}</code></p></div>
      <el-button v-if="canRollback" type="danger" :icon="RefreshLeft" :disabled="!data?.previous" @click="rollbackVisible = true">回滚上一版</el-button>
    </header>
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />
    <template v-if="data">
      <div class="version-grid">
        <el-card v-for="item in [{ title: '当前版本', value: data.current }, { title: '上一版本', value: data.previous }]" :key="item.title" shadow="never">
          <template #header><strong>{{ item.title }}</strong></template>
          <el-descriptions v-if="item.value" :column="1" border>
            <el-descriptions-item label="Revision">{{ item.value.revision }}</el-descriptions-item>
            <el-descriptions-item label="客户端版本">{{ item.value.clientVersion }}</el-descriptions-item>
            <el-descriptions-item label="服务端保存">{{ formatTime(item.value.serverSavedAt) }}</el-descriptions-item>
            <el-descriptions-item label="大小">{{ item.value.sizeBytes.toLocaleString() }} Bytes</el-descriptions-item>
            <el-descriptions-item label="Hash"><code class="hash">{{ item.value.hash }}</code></el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="没有上一版本" :image-size="64" />
        </el-card>
      </div>
      <el-card shadow="never" class="diff-card">
        <template #header><strong>user 字段差异（{{ data.changes.length }}）</strong></template>
        <el-table :data="[...data.changes]" empty-text="两个版本没有字段差异">
          <el-table-column prop="field" label="字段" width="220"><template #default="scope"><code>{{ scope.row.field }}</code></template></el-table-column>
          <el-table-column label="上一版" min-width="260"><template #default="scope"><span class="value">{{ displayValue(scope.row.previous) }}</span></template></el-table-column>
          <el-table-column label="当前版" min-width="260"><template #default="scope"><span class="value">{{ displayValue(scope.row.current) }}</span></template></el-table-column>
        </el-table>
      </el-card>
    </template>

    <el-dialog v-model="rollbackVisible" title="确认回滚云存档" width="520px">
      <el-alert title="回滚会生成新的 revision，不会降低版本号；玩家下次同步将读取回滚后的内容。" type="warning" :closable="false" show-icon />
      <el-form label-position="top" class="dialog-form">
        <el-form-item label="操作原因" required><el-input v-model="rollbackReason" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="请填写可审计的回滚原因" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="rollbackVisible = false">取消</el-button><el-button type="danger" :loading="submitting" :disabled="rollbackReason.trim().length < 2" @click="confirmRollback">确认回滚</el-button></template>
    </el-dialog>
  </section>
</template>

<style scoped>
.detail-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-top: 16px; }
.version-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.diff-card { margin-top: 18px; }
.dialog-form { margin-top: 18px; }
.hash { word-break: break-all; }
.value { white-space: pre-wrap; word-break: break-word; }
code { color: #475569; }
</style>

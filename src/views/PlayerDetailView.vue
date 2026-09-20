<script setup lang="ts">
import { ArrowLeft, Lock, Unlock, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { banPlayer, getPlayer, getSaveDiagnostics, unbanPlayer, type PlayerDetail, type SaveDiagnostics } from '../api/adminPlayers'
import { ApiRequestError } from '../api/types'
import { useAuthStore } from '../stores/auth'
import { buildPlayerSaveRows, stringifyPlayerSave } from '../utils/playerSavePresentation'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const player = ref<PlayerDetail | null>(null)
const saveDiagnostics = ref<SaveDiagnostics | null>(null)
const loading = ref(true)
const saveLoading = ref(false)
const errorMessage = ref('')
const saveErrorMessage = ref('')
const playerId = String(route.params.playerId)
const banVisible = ref(false)
const unbanVisible = ref(false)
const submitting = ref(false)
const banForm = reactive<{ type: 'temporary' | 'permanent'; expiresAt: Date | null; reason: string; note: string }>({
  type: 'temporary', expiresAt: null, reason: '', note: '',
})
const unbanReason = ref('')
const canBan = computed(() => auth.hasPermission('player:ban'))
const canReadSave = computed(() => auth.hasPermission('save:read'))
const isAdmin = computed(() => auth.identity?.role === 'admin')
const saveRows = computed(() => buildPlayerSaveRows(saveDiagnostics.value?.current.user ?? {}))
const coreSaveRows = computed(() => saveRows.value.filter((item) => item.core))
const moreSaveRows = computed(() => saveRows.value.filter((item) => !item.core))
const rawSaveJson = computed(() => stringifyPlayerSave(saveDiagnostics.value?.current.user ?? {}))

function formatTime(value?: number): string {
  return value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'long', timeStyle: 'medium' }).format(value) : '--'
}

async function load(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  saveErrorMessage.value = ''
  saveDiagnostics.value = null
  let shouldLoadSave = false
  try {
    player.value = await getPlayer(playerId)
    shouldLoadSave = Boolean(player.value.save && canReadSave.value)
  } catch (error) {
    errorMessage.value = error instanceof ApiRequestError ? error.message : '用户详情加载失败'
  } finally {
    loading.value = false
  }
  if (shouldLoadSave) await loadSaveContent()
}

async function loadSaveContent(): Promise<void> {
  saveLoading.value = true
  saveErrorMessage.value = ''
  try {
    saveDiagnostics.value = await getSaveDiagnostics(playerId)
  } catch (error) {
    saveErrorMessage.value = error instanceof ApiRequestError ? error.message : '存档内容加载失败'
  } finally {
    saveLoading.value = false
  }
}

async function confirmBan(): Promise<void> {
  if (banForm.reason.trim().length < 2) return
  if (banForm.type === 'temporary' && !banForm.expiresAt) return
  submitting.value = true
  try {
    await banPlayer(playerId, {
      type: banForm.type,
      ...(banForm.type === 'temporary' && banForm.expiresAt ? { expiresAt: banForm.expiresAt.getTime() } : {}),
      reason: banForm.reason.trim(),
      ...(banForm.note.trim() ? { note: banForm.note.trim() } : {}),
    })
    ElMessage.success('用户已封禁，已有会话的下一次请求将被拒绝')
    banVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(error instanceof ApiRequestError ? error.message : '封禁失败')
  } finally {
    submitting.value = false
  }
}

async function confirmUnban(): Promise<void> {
  if (unbanReason.value.trim().length < 2) return
  submitting.value = true
  try {
    await unbanPlayer(playerId, unbanReason.value.trim())
    ElMessage.success('用户已解封')
    unbanVisible.value = false
    unbanReason.value = ''
    await load()
  } catch (error) {
    ElMessage.error(error instanceof ApiRequestError ? error.message : '解封失败')
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <section v-loading="loading">
    <el-button text :icon="ArrowLeft" @click="router.push('/players')">返回用户列表</el-button>
    <header class="page-heading detail-heading">
      <div><h1>用户详情</h1><p><code>{{ playerId }}</code></p></div>
      <div v-if="player" class="heading-actions">
        <el-button v-if="player.save && canReadSave" :icon="View" @click="router.push(`/players/${playerId}/save`)">存档诊断</el-button>
        <el-button v-if="canBan && player.status === 'active'" type="danger" :icon="Lock" @click="banVisible = true">封禁用户</el-button>
        <el-button v-if="canBan && player.status === 'banned'" type="success" :icon="Unlock" @click="unbanVisible = true">解除封禁</el-button>
      </div>
    </header>
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />
    <template v-if="player">
      <div class="detail-grid">
        <el-card shadow="never">
          <template #header><strong>基础信息</strong></template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="平台">{{ player.platform === 'wechat' ? '微信' : '抖音' }}</el-descriptions-item>
            <el-descriptions-item label="状态"><el-tag :type="player.status === 'active' ? 'success' : 'danger'">{{ player.status === 'active' ? '正常' : '已封禁' }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="App ID">{{ player.appId }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(player.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="最近登录">{{ formatTime(player.lastLoginAt) }}</el-descriptions-item>
            <el-descriptions-item v-if="player.ban" label="封禁原因">{{ player.ban.reason }}</el-descriptions-item>
            <el-descriptions-item v-if="player.ban" label="封禁到期">{{ player.ban.permanent ? '永久' : formatTime(player.ban.expiresAt) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-card shadow="never">
          <template #header><strong>微信资料</strong></template>
          <div v-if="player.profile" class="profile">
            <el-avatar :size="72" :src="player.profile.avatarUrl">猫</el-avatar>
            <div><strong>{{ player.profile.nickName }}</strong><small>资料更新：{{ formatTime(player.profile.updatedAt) }}</small></div>
          </div>
          <el-empty v-else description="用户尚未授权头像昵称" :image-size="72" />
        </el-card>
      </div>
      <el-card shadow="never" class="save-card">
        <template #header><strong>云存档摘要</strong></template>
        <el-descriptions v-if="player.save" :column="3" border>
          <el-descriptions-item label="Revision">{{ player.save.revision }}</el-descriptions-item>
          <el-descriptions-item label="客户端版本">{{ player.save.clientVersion }}</el-descriptions-item>
          <el-descriptions-item label="大小">{{ player.save.sizeBytes.toLocaleString() }} Bytes</el-descriptions-item>
          <el-descriptions-item label="客户端保存">{{ formatTime(player.save.clientSavedAt) }}</el-descriptions-item>
          <el-descriptions-item label="服务端保存">{{ formatTime(player.save.serverSavedAt) }}</el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="暂无云存档" :image-size="72" />
      </el-card>
      <el-card v-if="player.save && canReadSave" v-loading="saveLoading" shadow="never" class="save-card">
        <template #header>
          <div class="card-heading">
            <strong>当前游戏进度</strong>
            <el-button text type="primary" @click="loadSaveContent">刷新</el-button>
          </div>
        </template>
        <el-alert v-if="saveErrorMessage" :title="saveErrorMessage" type="error" :closable="false" show-icon />
        <template v-else-if="saveDiagnostics">
          <el-alert title="当前 V1 云存档只包含 user 白名单字段，本地设置、引导和活动数据不会显示在这里。" type="info" :closable="false" show-icon />
          <el-descriptions v-if="coreSaveRows.length" :column="4" border class="progress-summary">
            <el-descriptions-item v-for="item in coreSaveRows" :key="item.key" :label="item.label">
              <span class="save-value">{{ item.displayValue }}</span>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="存档中没有可展示的 user 字段" :image-size="64" />

          <el-collapse class="save-details">
            <el-collapse-item :title="`更多存档字段（${moreSaveRows.length}）`" name="more">
              <el-table :data="moreSaveRows" empty-text="没有其他存档字段" size="small">
                <el-table-column prop="label" label="名称" min-width="180" />
                <el-table-column prop="key" label="字段" min-width="190"><template #default="scope"><code>{{ scope.row.key }}</code></template></el-table-column>
                <el-table-column label="当前值" min-width="280"><template #default="scope"><span class="save-value">{{ scope.row.displayValue }}</span></template></el-table-column>
              </el-table>
            </el-collapse-item>
            <el-collapse-item title="查看原始 JSON" name="json">
              <pre class="raw-json">{{ rawSaveJson }}</pre>
            </el-collapse-item>
          </el-collapse>
        </template>
      </el-card>
      <el-alert v-else-if="player.save && !canReadSave" title="当前账号没有查看存档内容的权限。" type="info" :closable="false" show-icon class="save-card" />
    </template>

    <el-dialog v-model="banVisible" title="封禁用户" width="560px">
      <el-alert title="封禁将在用户已有会话的下一次资料或云存档请求时生效。永久封禁仅超级管理员可执行。" type="warning" :closable="false" show-icon />
      <el-form label-position="top" class="dialog-form">
        <el-form-item label="封禁类型" required>
          <el-radio-group v-model="banForm.type">
            <el-radio value="temporary">临时封禁</el-radio>
            <el-radio value="permanent" :disabled="!isAdmin">永久封禁</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="banForm.type === 'temporary'" label="到期时间" required>
          <el-date-picker v-model="banForm.expiresAt" type="datetime" placeholder="选择未来时间" :disabled-date="(date: Date) => date.getTime() < Date.now() - 86_400_000" />
        </el-form-item>
        <el-form-item label="封禁原因" required><el-input v-model="banForm.reason" maxlength="200" show-word-limit /></el-form-item>
        <el-form-item label="内部备注"><el-input v-model="banForm.note" type="textarea" :rows="3" maxlength="500" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><el-button @click="banVisible = false">取消</el-button><el-button type="danger" :loading="submitting" :disabled="banForm.reason.trim().length < 2 || (banForm.type === 'temporary' && !banForm.expiresAt)" @click="confirmBan">确认封禁</el-button></template>
    </el-dialog>

    <el-dialog v-model="unbanVisible" title="解除封禁" width="520px">
      <el-form label-position="top"><el-form-item label="解封原因" required><el-input v-model="unbanReason" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="请填写可审计的解封原因" /></el-form-item></el-form>
      <template #footer><el-button @click="unbanVisible = false">取消</el-button><el-button type="success" :loading="submitting" :disabled="unbanReason.trim().length < 2" @click="confirmUnban">确认解封</el-button></template>
    </el-dialog>
  </section>
</template>

<style scoped>
.detail-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-top: 16px; }
.heading-actions { display: flex; gap: 10px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.profile { display: flex; align-items: center; gap: 18px; min-height: 120px; }
.profile strong, .profile small { display: block; }
.profile strong { margin-bottom: 10px; font-size: 18px; }
.profile small { color: #6b7280; }
.save-card { margin-top: 18px; }
.card-heading { display: flex; align-items: center; justify-content: space-between; }
.progress-summary { margin-top: 16px; }
.save-details { margin-top: 16px; }
.save-value { white-space: pre-wrap; word-break: break-word; }
.raw-json { margin: 0; padding: 16px; overflow: auto; border-radius: 6px; background: #0f172a; color: #e2e8f0; line-height: 1.55; }
.dialog-form { margin-top: 18px; }
code { color: #475569; }

@media (max-width: 1100px) {
  .detail-grid { grid-template-columns: 1fr; }
  .progress-summary { --el-descriptions-table-border: 1px solid var(--el-border-color-lighter); }
}
</style>

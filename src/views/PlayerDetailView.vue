<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPlayer, type PlayerDetail } from '../api/adminPlayers'
import { ApiRequestError } from '../api/types'

const route = useRoute()
const router = useRouter()
const player = ref<PlayerDetail | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const playerId = String(route.params.playerId)

function formatTime(value?: number): string {
  return value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'long', timeStyle: 'medium' }).format(value) : '--'
}

onMounted(async () => {
  try {
    player.value = await getPlayer(playerId)
  } catch (error) {
    errorMessage.value = error instanceof ApiRequestError ? error.message : '玩家详情加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section v-loading="loading">
    <el-button text :icon="ArrowLeft" @click="router.push('/players')">返回玩家列表</el-button>
    <header class="page-heading detail-heading"><h1>玩家详情</h1><p><code>{{ playerId }}</code></p></header>
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
          </el-descriptions>
        </el-card>
        <el-card shadow="never">
          <template #header><strong>微信资料</strong></template>
          <div v-if="player.profile" class="profile">
            <el-avatar :size="72" :src="player.profile.avatarUrl">猫</el-avatar>
            <div><strong>{{ player.profile.nickName }}</strong><small>资料更新：{{ formatTime(player.profile.updatedAt) }}</small></div>
          </div>
          <el-empty v-else description="玩家尚未授权头像昵称" :image-size="72" />
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
    </template>
  </section>
</template>

<style scoped>
.detail-heading { margin-top: 16px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.profile { display: flex; align-items: center; gap: 18px; min-height: 120px; }
.profile strong, .profile small { display: block; }
.profile strong { margin-bottom: 10px; font-size: 18px; }
.profile small { color: #6b7280; }
.save-card { margin-top: 18px; }
code { color: #475569; }
</style>

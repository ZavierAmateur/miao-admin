<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listLevelLeaderboard, type LevelLeaderboardItem } from '../api/adminLeaderboards'
import { ApiRequestError } from '../api/types'

type LeaderboardTab = 'level' | 'challenge'

const router = useRouter()
const activeTab = ref<LeaderboardTab>('level')
const loading = ref(false)
const errorMessage = ref('')
const rows = ref<LevelLeaderboardItem[]>([])
const page = ref(1)
const hasMore = ref(false)

async function load(targetPage = page.value): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listLevelLeaderboard(targetPage)
    rows.value = [...result.items]
    page.value = result.page
    hasMore.value = result.hasMore
  } catch (error) {
    errorMessage.value = error instanceof ApiRequestError ? error.message : '闯关榜加载失败'
  } finally {
    loading.value = false
  }
}

function formatTime(value: number): string {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(value)
}

onMounted(() => load())
</script>

<template>
  <section>
    <header class="page-heading"><h1>排行榜</h1><p>查看全平台用户的排行榜数据；游戏内微信好友榜由微信开放数据域独立提供。</p></header>
    <el-card shadow="never" class="ranking-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="闯关榜" name="level">
          <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon class="result-alert" />
          <el-table v-loading="loading" :data="rows">
            <template #empty><el-empty description="暂无闯关榜数据" :image-size="92" /></template>
            <el-table-column prop="rank" label="排名" width="90" align="center" />
            <el-table-column label="微信头像" width="100" align="center">
              <template #default="scope"><el-avatar :size="40" :src="scope.row.avatarUrl || ''">猫</el-avatar></template>
            </el-table-column>
            <el-table-column label="微信昵称" min-width="150">
              <template #default="scope">{{ scope.row.nickName || '未授权' }}</template>
            </el-table-column>
            <el-table-column prop="playerId" label="用户 ID" min-width="260">
              <template #default="scope"><code>{{ scope.row.playerId }}</code></template>
            </el-table-column>
            <el-table-column label="平台" width="100">
              <template #default="scope">{{ scope.row.platform === 'wechat' ? '微信' : '抖音' }}</template>
            </el-table-column>
            <el-table-column label="当前关卡" width="120" align="center">
              <template #default="scope"><strong>第 {{ scope.row.level }} 关</strong></template>
            </el-table-column>
            <el-table-column label="达到时间" min-width="180">
              <template #default="scope">{{ formatTime(scope.row.reachedAt) }}</template>
            </el-table-column>
            <el-table-column label="更新时间" min-width="180">
              <template #default="scope">{{ formatTime(scope.row.updatedAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="scope"><el-button link type="primary" @click="router.push(`/players/${scope.row.playerId}`)">用户详情</el-button></template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-button :disabled="page <= 1 || loading" @click="load(page - 1)">上一页</el-button>
            <span>第 {{ page }} 页 · 每页20条</span>
            <el-button :disabled="!hasMore || loading" @click="load(page + 1)">下一页</el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="挑战榜" name="challenge">
          <el-empty description="挑战榜暂未开放" :image-size="120">
            <p class="empty-hint">V1 仅开发闯关榜，挑战榜页签为后续版本预留。</p>
          </el-empty>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </section>
</template>

<style scoped>
.ranking-card { min-height: 520px; }
.result-alert { margin-bottom: 18px; }
.pager { display: flex; justify-content: flex-end; align-items: center; gap: 14px; margin-top: 18px; color: #6b7280; font-size: 14px; }
.empty-hint { margin: 0; color: #6b7280; line-height: 1.7; }
code { color: #334155; }
</style>

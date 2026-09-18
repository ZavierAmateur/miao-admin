<script setup lang="ts">
import { Bell, DataAnalysis, Link, User } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { runtimeConfig } from '../config/runtime'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()
const environmentLabel = computed(() => ({
  development: '开发环境',
  test: '测试环境',
  production: '生产环境',
})[runtimeConfig.environment])
</script>

<template>
  <el-container class="admin-shell">
    <el-aside width="240px" class="sidebar">
      <div class="brand">
        <div class="brand-mark">喵</div>
        <div><strong>旅行日记</strong><span>管理后台</span></div>
      </div>
      <el-menu router :default-active="route.path" class="side-menu">
        <el-menu-item index="/"><el-icon><DataAnalysis /></el-icon><span>仪表盘</span></el-menu-item>
        <el-menu-item index="/contract-status"><el-icon><Link /></el-icon><span>接口状态</span></el-menu-item>
      </el-menu>
      <div class="sidebar-foot">V1 · Internal</div>
    </el-aside>

    <el-container>
      <el-header class="topbar">
        <el-tag :type="runtimeConfig.environment === 'production' ? 'danger' : 'warning'" effect="dark">
          {{ environmentLabel }}
        </el-tag>
        <div class="topbar-actions">
          <el-button text circle aria-label="通知"><el-icon><Bell /></el-icon></el-button>
          <el-divider direction="vertical" />
          <el-icon><User /></el-icon><span>{{ auth.identity?.displayName ?? '未登录' }}</span>
        </div>
      </el-header>
      <el-main class="content"><RouterView /></el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.admin-shell { min-height: 100vh; }
.sidebar { display: flex; flex-direction: column; background: #172033; color: #fff; }
.brand { display: flex; gap: 12px; align-items: center; height: 72px; padding: 0 22px; border-bottom: 1px solid #2c3850; }
.brand-mark { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 12px; background: #6e56cf; font-size: 20px; font-weight: 800; }
.brand strong, .brand span { display: block; }
.brand span { margin-top: 3px; color: #aeb8ca; font-size: 12px; }
.side-menu { flex: 1; border: 0; background: transparent; }
.side-menu :deep(.el-menu-item) { color: #cbd3df; }
.side-menu :deep(.el-menu-item:hover), .side-menu :deep(.el-menu-item.is-active) { background: #252f46; color: #fff; }
.sidebar-foot { padding: 18px 24px; color: #78849a; font-size: 12px; }
.topbar { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e6eaf0; background: #fff; }
.topbar-actions { display: flex; align-items: center; gap: 10px; color: #4b5563; font-size: 14px; }
.content { padding: 28px 32px; background: #f4f7fb; }
</style>

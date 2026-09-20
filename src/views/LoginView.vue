<script setup lang="ts">
import { Lock, User } from '@element-plus/icons-vue'
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiRequestError } from '../api/types'
import { useAuthStore } from '../stores/auth'

const form = reactive({ account: '', password: '' })
const loading = ref(false)
const errorMessage = ref('')
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const backendUnavailable = computed(() => route.query.unavailable === '1')

async function submit(): Promise<void> {
  errorMessage.value = ''
  loading.value = true
  try {
    await auth.login(form.account, form.password)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/'
    await router.replace(redirect)
  } catch (error) {
    errorMessage.value = error instanceof ApiRequestError ? error.message : '管理服务暂时不可用，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="intro">
      <div class="eyebrow">MIAO TRAVEL · INTERNAL</div>
      <h1>让每一次运营操作<br />都有边界，也有记录。</h1>
      <p>玩家查询、云存档诊断与脱敏错误日志按权限开放，高风险操作均由后端鉴权。</p>
      <div class="guard-list"><span>HttpOnly 会话</span><span>RBAC 权限</span><span>全链路审计</span></div>
    </section>

    <section class="login-panel">
      <el-card shadow="never" class="login-card">
        <template #header><div><h2>管理员登录</h2><p>仅限已授权的内部账号</p></div></template>
        <el-alert
          v-if="backendUnavailable || errorMessage"
          :title="errorMessage || '管理服务暂时不可用'"
          description="请确认 miao-travel-server 已启用管理员认证并可从当前环境访问。"
          type="error"
          :closable="false"
          show-icon
        />
        <el-form :model="form" label-position="top" class="login-form" @submit.prevent="submit">
          <el-form-item label="管理员账号">
            <el-input v-model="form.account" placeholder="请输入管理员账号" autocomplete="username" :prefix-icon="User" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" autocomplete="current-password" show-password :prefix-icon="Lock" />
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit"
            native-type="submit"
            :loading="loading"
            :disabled="!form.account.trim() || !form.password"
          >
            登录
          </el-button>
        </el-form>
        <p class="security-note">登录凭据不会保存到浏览器本地存储。</p>
      </el-card>
    </section>
  </main>
</template>

<style scoped>
.login-page { display: grid; min-height: 100vh; grid-template-columns: minmax(540px, 1.15fr) minmax(520px, .85fr); background: #111827; }
.intro { display: flex; flex-direction: column; justify-content: center; padding: 88px clamp(64px, 8vw, 130px); color: #fff; background: radial-gradient(circle at 15% 20%, #493c8d 0, transparent 36%), linear-gradient(145deg, #111827 10%, #1f2940 100%); }
.eyebrow { color: #b8aafa; font-size: 12px; font-weight: 700; letter-spacing: .18em; }
h1 { margin: 24px 0; font-size: clamp(38px, 4vw, 58px); line-height: 1.2; letter-spacing: -.04em; }
.intro p { max-width: 560px; color: #bcc5d4; font-size: 16px; line-height: 1.8; }
.guard-list { display: flex; gap: 12px; margin-top: 30px; }
.guard-list span { padding: 8px 12px; border: 1px solid #3c4860; border-radius: 999px; color: #d9deea; font-size: 12px; }
.login-panel { display: grid; place-items: center; padding: 64px; background: #f4f7fb; }
.login-card { width: 100%; max-width: 440px; border: 0; border-radius: 18px; box-shadow: 0 20px 60px rgb(23 32 51 / 10%); }
.login-card h2 { margin: 0 0 8px; color: #172033; font-size: 28px; }
.login-card p { margin: 0; color: #7b8495; }
.login-form { margin-top: 24px; }
.submit { width: 100%; margin-top: 8px; }
.security-note { margin-top: 18px !important; text-align: center; font-size: 12px; }
</style>

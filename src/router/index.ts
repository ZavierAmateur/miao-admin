import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { pinia } from '../stores/pinia'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true, title: '管理员登录' },
    },
    {
      path: '/',
      component: () => import('../layouts/AdminLayout.vue'),
      children: [
        {
          path: '',
          redirect: { name: 'players' },
        },
        {
          path: 'players',
          name: 'players',
          component: () => import('../views/PlayersView.vue'),
          meta: { title: '用户管理', permission: 'player:read' },
        },
        {
          path: 'players/:playerId',
          name: 'player-detail',
          component: () => import('../views/PlayerDetailView.vue'),
          meta: { title: '用户详情', permission: 'player:read' },
        },
        {
          path: 'players/:playerId/save',
          name: 'player-save',
          component: () => import('../views/SaveDiagnosticsView.vue'),
          meta: { title: '云存档诊断', permission: 'save:read' },
        },
        {
          path: 'errors',
          name: 'errors',
          component: () => import('../views/ErrorLogsView.vue'),
          meta: { title: '错误日志', permission: 'error:read' },
        },
        {
          path: 'announcements',
          name: 'announcements',
          component: () => import('../views/AnnouncementsView.vue'),
          meta: { title: '公告管理', permission: 'config:read' },
        },
        {
          path: 'announcements/new',
          name: 'announcement-create',
          redirect: { name: 'announcements', query: { action: 'new' } },
          meta: { title: '新增公告', permission: 'config:write' },
        },
        {
          path: 'announcements/:announcementId/edit',
          name: 'announcement-edit',
          redirect: (to) => ({ name: 'announcements', query: { edit: String(to.params.announcementId) } }),
          meta: { title: '编辑公告', permission: 'config:write' },
        },
      ],
    },
    {
      path: '/forbidden',
      name: 'forbidden',
      component: () => import('../views/ForbiddenView.vue'),
      meta: { public: true, title: '无权访问' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { public: true, title: '页面不存在' },
    },
  ],
})

router.beforeEach(async (to) => {
  document.title = `${to.meta.title} - 喵的旅行日记管理后台`
  const auth = useAuthStore(pinia)
  if (!auth.sessionChecked) {
    try {
      await auth.restoreSession()
    } catch {
      if (!to.meta.public) return { name: 'login', query: { redirect: to.fullPath, unavailable: '1' } }
    }
  }
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'players' }
  if (to.meta.public) return true
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.permission && !auth.hasPermission(to.meta.permission)) {
    return { name: 'forbidden' }
  }
  return true
})

export default router

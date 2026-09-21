<script setup lang="ts">
import { ArrowDown, ArrowLeft, ArrowUp, Delete, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createAnnouncement, getAnnouncement, updateAnnouncement, uploadFile, type AnnouncementImage, type AnnouncementPlatform, type AnnouncementStatus } from '../api/adminAnnouncements'
import { ApiRequestError } from '../api/types'
import SimpleRichTextEditor from '../components/SimpleRichTextEditor.vue'

const props = withDefaults(defineProps<{
  embedded?: boolean
  announcementId?: string
}>(), {
  embedded: false,
  announcementId: '',
})
const emit = defineEmits<{
  saved: []
  cancel: []
}>()

interface EditableImage {
  fileId: string
  objectKey: string
  url: string
  alt: string
}

const route = useRoute()
const router = useRouter()
const announcementId = computed(() => props.announcementId || (typeof route.params.announcementId === 'string' ? route.params.announcementId : ''))
const isEditing = computed(() => Boolean(announcementId.value))
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const errorMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const startsAt = ref<Date | null>(null)
const endsAt = ref<Date | null>(null)
const form = reactive<{
  title: string
  contentHtml: string
  images: EditableImage[]
  status: AnnouncementStatus
  platforms: AnnouncementPlatform[]
  sortOrder: number
  autoPopup: boolean
}>({
  title: '', contentHtml: '<p><br></p>', images: [], status: 'draft', platforms: ['wechat'], sortOrder: 0, autoPopup: false,
})

async function load(): Promise<void> {
  if (!isEditing.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const value = await getAnnouncement(announcementId.value)
    form.title = value.title
    form.contentHtml = value.contentHtml
    form.images = value.images.map((image) => ({ ...image }))
    form.status = value.status
    form.platforms = [...value.platforms]
    form.sortOrder = value.sortOrder
    form.autoPopup = value.autoPopup
    startsAt.value = value.startsAt > 0 ? new Date(value.startsAt) : null
    endsAt.value = value.endsAt > 0 ? new Date(value.endsAt) : null
  } catch (error) {
    errorMessage.value = error instanceof ApiRequestError ? error.message : '公告详情加载失败'
  } finally {
    loading.value = false
  }
}

function chooseFile(): void {
  fileInput.value?.click()
}

async function handleFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (form.images.length >= 9) {
    ElMessage.warning('公告图片最多 9 张')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('单张图片不能超过 5MB')
    return
  }
  uploading.value = true
  try {
    const uploaded = await uploadFile(file)
    form.images.push({ fileId: uploaded.fileId, objectKey: uploaded.objectKey, url: uploaded.url, alt: '' })
    ElMessage.success('图片上传成功')
  } catch (error) {
    ElMessage.error(error instanceof ApiRequestError ? error.message : '图片上传失败')
  } finally {
    uploading.value = false
  }
}

function moveImage(index: number, offset: -1 | 1): void {
  const next = index + offset
  if (next < 0 || next >= form.images.length) return
  const current = form.images[index]
  const target = form.images[next]
  if (!current || !target) return
  form.images.splice(index, 1, target)
  form.images.splice(next, 1, current)
}

function removeImage(index: number): void {
  form.images.splice(index, 1)
}

async function save(): Promise<void> {
  const title = form.title.trim()
  const plainText = form.contentHtml.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  if (!title) { ElMessage.warning('请输入公告标题'); return }
  if (!plainText) { ElMessage.warning('请输入公告正文'); return }
  if (form.platforms.length === 0) { ElMessage.warning('至少选择一个平台'); return }
  const start = startsAt.value?.getTime() ?? 0
  const end = endsAt.value?.getTime() ?? 0
  if (start > 0 && end > 0 && end <= start) { ElMessage.warning('结束时间必须晚于开始时间'); return }

  saving.value = true
  try {
    const input = {
      title,
      contentHtml: form.contentHtml,
      images: form.images.map((image): AnnouncementImage => ({ ...image, alt: image.alt.trim() })),
      status: form.status,
      platforms: [...form.platforms],
      sortOrder: form.sortOrder,
      autoPopup: form.autoPopup,
      startsAt: start,
      endsAt: end,
    }
    if (isEditing.value) await updateAnnouncement(announcementId.value, input)
    else await createAnnouncement(input)
    ElMessage.success(isEditing.value ? '公告已更新' : '公告已创建')
    if (props.embedded) emit('saved')
    else await router.push({ name: 'announcements' })
  } catch (error) {
    ElMessage.error(error instanceof ApiRequestError ? error.message : '公告保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)

function cancel(): void {
  if (props.embedded) emit('cancel')
  else void router.push({ name: 'announcements' })
}
</script>

<template>
  <section v-loading="loading" :class="{ 'embedded-editor': embedded }">
    <template v-if="!embedded">
      <el-button class="back-button" text :icon="ArrowLeft" @click="cancel">返回公告列表</el-button>
      <header class="page-heading"><h1>{{ isEditing ? '编辑公告' : '新增公告' }}</h1><p>正文使用轻量富文本；图片会由游戏端依次展示在正文下方。</p></header>
    </template>
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />

    <el-form label-position="top" class="editor-form" @submit.prevent="save">
      <el-card shadow="never" class="editor-card basic-card">
        <template #header><div class="section-title"><span class="section-index">1</span><div><strong>基础信息</strong><small>设置公告的展示范围与生效规则</small></div></div></template>
        <div class="form-grid">
          <el-form-item label="公告标题" class="full"><el-input v-model="form.title" maxlength="100" show-word-limit placeholder="请输入公告标题" /></el-form-item>
          <el-form-item label="状态"><el-segmented v-model="form.status" :options="[{ label: '草稿', value: 'draft' }, { label: '已发布', value: 'published' }]" /></el-form-item>
          <el-form-item label="投放平台"><el-checkbox-group v-model="form.platforms"><el-checkbox-button value="wechat">微信</el-checkbox-button><el-checkbox-button value="bytedance">抖音</el-checkbox-button></el-checkbox-group></el-form-item>
          <el-form-item label="排序（数值越大越靠前）"><el-input-number v-model="form.sortOrder" :min="-100000" :max="100000" /></el-form-item>
          <el-form-item label="打开游戏时自动弹出"><div class="switch-field"><el-switch v-model="form.autoPopup" /><span>{{ form.autoPopup ? '已开启' : '未开启' }}</span></div></el-form-item>
          <el-form-item label="开始时间"><el-date-picker v-model="startsAt" type="datetime" placeholder="不填表示立即生效" style="width: 100%" /></el-form-item>
          <el-form-item label="结束时间"><el-date-picker v-model="endsAt" type="datetime" placeholder="不填表示长期有效" style="width: 100%" /></el-form-item>
        </div>
      </el-card>

      <el-card shadow="never" class="editor-card content-card">
        <template #header><div class="section-title"><span class="section-index">2</span><div><strong>公告正文</strong><small>建议简洁清晰，重点信息尽量前置</small></div></div></template>
        <SimpleRichTextEditor v-model="form.contentHtml" />
        <div class="editor-tip">支持标题、粗体、斜体、下划线、列表和居中；图片将在正文后依次展示。</div>
      </el-card>

      <el-card shadow="never" class="editor-card image-card">
        <template #header><div class="section-title"><span class="section-index">3</span><div><strong>正文图片</strong><small>可选，最多上传 9 张图片</small></div></div></template>
        <div class="image-actions">
          <input ref="fileInput" class="file-input" type="file" accept="image/jpeg,image/png,image/webp" @change="handleFile">
          <el-button :icon="UploadFilled" :loading="uploading" :disabled="form.images.length >= 9" @click="chooseFile">上传图片</el-button>
          <span class="help-text">JPEG / PNG / WebP，单张不超过 5MB，最多 9 张。</span>
        </div>
        <el-empty v-if="form.images.length === 0" description="暂无图片，游戏端将只展示正文" :image-size="72" />
        <div v-else class="image-list">
          <article v-for="(image, index) in form.images" :key="image.fileId" class="image-row">
            <img :src="image.url" :alt="image.alt || `公告图片 ${index + 1}`">
            <div class="image-fields">
              <strong>第 {{ index + 1 }} 张</strong>
              <el-input v-model="image.alt" maxlength="200" show-word-limit placeholder="图片说明（可选）" />
              <a :href="image.url" target="_blank" rel="noreferrer">打开原图</a>
            </div>
            <div class="image-row-actions">
              <el-button circle :icon="ArrowUp" :disabled="index === 0" title="上移" @click="moveImage(index, -1)" />
              <el-button circle :icon="ArrowDown" :disabled="index === form.images.length - 1" title="下移" @click="moveImage(index, 1)" />
              <el-button circle type="danger" :icon="Delete" title="移除" @click="removeImage(index)" />
            </div>
          </article>
        </div>
      </el-card>

      <div class="footer-actions">
        <div class="footer-hint">{{ form.status === 'published' ? '保存后将按生效时间向所选平台展示' : '草稿不会在游戏端展示' }}</div>
        <el-button size="large" @click="cancel">取消</el-button>
        <el-button type="primary" size="large" :loading="saving" @click="save">{{ isEditing ? '保存修改' : '创建公告' }}</el-button>
      </div>
    </el-form>
  </section>
</template>

<style scoped>
.back-button { margin: -8px 0 18px; }
.editor-form { display: grid; gap: 16px; }
.embedded-editor { padding: 2px 2px 0; }
.editor-card { border-color: #e8edf5; border-radius: 12px; }
.editor-card :deep(.el-card__header) { padding: 16px 20px; background: #fbfcfe; }
.editor-card :deep(.el-card__body) { padding: 20px; }
.section-title { display: flex; align-items: center; gap: 12px; }
.section-title > div { display: grid; gap: 3px; }
.section-title strong { color: #1f2937; font-size: 15px; }
.section-title small { color: #8a94a6; font-size: 12px; font-weight: 400; }
.section-index { display: grid; width: 28px; height: 28px; place-items: center; border-radius: 9px; color: #fff; background: linear-gradient(135deg, #409eff, #6574e8); font-size: 13px; font-weight: 700; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 24px; }
.form-grid .full { grid-column: 1 / -1; }
.help-text { margin: 10px 0 0; color: #6b7280; font-size: 13px; }
.switch-field { display: flex; align-items: center; gap: 10px; color: #6b7280; font-size: 13px; }
.editor-tip { margin-top: 12px; padding: 10px 12px; border-radius: 8px; color: #667085; background: #f6f8fb; font-size: 12px; }
.image-actions { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.file-input { display: none; }
.image-list { display: grid; gap: 14px; }
.image-row { display: grid; grid-template-columns: 160px minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 14px; border: 1px solid #e5e7eb; border-radius: 8px; }
.image-row img { width: 160px; height: 100px; border-radius: 6px; background: #f3f4f6; object-fit: cover; }
.image-fields { display: grid; gap: 9px; }
.image-fields a { color: #409eff; font-size: 13px; text-decoration: none; }
.image-row-actions { display: flex; gap: 8px; }
.footer-actions { position: sticky; bottom: 0; z-index: 3; display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin: 0 -2px; padding: 16px 2px 2px; background: linear-gradient(to bottom, rgb(255 255 255 / 0%), #fff 28%); }
.footer-hint { margin-right: auto; color: #8a94a6; font-size: 12px; }
@media (max-width: 1100px) { .form-grid { grid-template-columns: 1fr; } .form-grid .full { grid-column: auto; } }
</style>

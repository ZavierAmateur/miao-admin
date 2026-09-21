<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const editor = ref<HTMLElement | null>(null)

function syncFromModel(): void {
  if (editor.value && editor.value.innerHTML !== props.modelValue) editor.value.innerHTML = props.modelValue
}

function emitValue(): void {
  emit('update:modelValue', editor.value?.innerHTML ?? '')
}

function command(name: string, value?: string): void {
  editor.value?.focus()
  document.execCommand(name, false, value)
  emitValue()
}

function pastePlainText(event: ClipboardEvent): void {
  event.preventDefault()
  document.execCommand('insertText', false, event.clipboardData?.getData('text/plain') ?? '')
  emitValue()
}

watch(() => props.modelValue, () => void nextTick(syncFromModel))
onMounted(syncFromModel)
</script>

<template>
  <div class="rich-editor">
    <div class="toolbar" role="toolbar" aria-label="富文本工具栏">
      <el-button-group>
        <el-button title="正文" @mousedown.prevent="command('formatBlock', 'p')">正文</el-button>
        <el-button title="二级标题" @mousedown.prevent="command('formatBlock', 'h2')">标题</el-button>
        <el-button title="粗体" @mousedown.prevent="command('bold')"><strong>B</strong></el-button>
        <el-button title="斜体" @mousedown.prevent="command('italic')"><em>I</em></el-button>
        <el-button title="下划线" @mousedown.prevent="command('underline')"><u>U</u></el-button>
        <el-button title="无序列表" @mousedown.prevent="command('insertUnorderedList')">列表</el-button>
        <el-button title="居中" @mousedown.prevent="command('justifyCenter')">居中</el-button>
        <el-button title="清除格式" @mousedown.prevent="command('removeFormat')">清除格式</el-button>
      </el-button-group>
    </div>
    <div
      ref="editor"
      class="editor-area"
      contenteditable="true"
      role="textbox"
      aria-multiline="true"
      data-placeholder="请输入公告正文"
      @input="emitValue"
      @blur="emitValue"
      @paste="pastePlainText"
    />
  </div>
</template>

<style scoped>
.rich-editor { overflow: hidden; border: 1px solid #dcdfe6; border-radius: 4px; background: #fff; }
.toolbar { padding: 8px; border-bottom: 1px solid #ebeef5; background: #f8fafc; }
.editor-area { min-height: 260px; padding: 16px; outline: none; color: #303133; line-height: 1.75; }
.editor-area:empty::before { color: #a8abb2; content: attr(data-placeholder); pointer-events: none; }
.editor-area:focus { box-shadow: inset 0 0 0 1px #409eff; }
</style>

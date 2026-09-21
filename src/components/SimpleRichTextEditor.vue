<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { executeFormatCommand, executeTextColorCommand } from '../utils/richTextCommands'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const editor = ref<HTMLElement | null>(null)
const savedRange = ref<ReturnType<typeof document.createRange> | null>(null)
const customColor = ref('#409eff')
const active = reactive({ bold: false, italic: false, underline: false, strikeThrough: false })
const presetColors = [
  { name: '默认黑', value: '#303133' },
  { name: '强调红', value: '#f56c6c' },
  { name: '提示橙', value: '#e6a23c' },
  { name: '成功绿', value: '#67c23a' },
  { name: '链接蓝', value: '#409eff' },
  { name: '重点紫', value: '#8b5cf6' },
]

function syncFromModel(): void {
  if (editor.value && editor.value.innerHTML !== props.modelValue) editor.value.innerHTML = props.modelValue
}

function emitValue(): void {
  emit('update:modelValue', editor.value?.innerHTML ?? '')
}

function selectionBelongsToEditor(range: ReturnType<typeof document.createRange>): boolean {
  return Boolean(editor.value?.contains(range.commonAncestorContainer))
}

function updateActiveFormats(): void {
  if (typeof document.queryCommandState !== 'function') return
  active.bold = document.queryCommandState('bold')
  active.italic = document.queryCommandState('italic')
  active.underline = document.queryCommandState('underline')
  active.strikeThrough = document.queryCommandState('strikeThrough')
}

function rememberSelection(): void {
  const selection = globalThis.getSelection()
  if (selection?.rangeCount) {
    const range = selection.getRangeAt(0)
    if (selectionBelongsToEditor(range)) savedRange.value = range.cloneRange()
  }
  updateActiveFormats()
}

function restoreSelection(): void {
  editor.value?.focus()
  const selection = globalThis.getSelection()
  if (!selection || !savedRange.value) return
  selection.removeAllRanges()
  selection.addRange(savedRange.value)
}

function command(name: string, value?: string): void {
  restoreSelection()
  executeFormatCommand(document.execCommand.bind(document), name, value)
  rememberSelection()
  emitValue()
}

function applyColor(color: string): void {
  customColor.value = color
  restoreSelection()
  executeTextColorCommand(document.execCommand.bind(document), color)
  rememberSelection()
  emitValue()
}

function applyCustomColor(event: Event): void {
  applyColor((event.target as HTMLInputElement).value)
}

function pastePlainText(event: ClipboardEvent): void {
  event.preventDefault()
  document.execCommand('insertText', false, event.clipboardData?.getData('text/plain') ?? '')
  rememberSelection()
  emitValue()
}

function handleSelectionChange(): void {
  const selection = globalThis.getSelection()
  if (!selection?.rangeCount || !selectionBelongsToEditor(selection.getRangeAt(0))) return
  rememberSelection()
}

watch(() => props.modelValue, () => void nextTick(syncFromModel))
onMounted(() => {
  syncFromModel()
  document.addEventListener('selectionchange', handleSelectionChange)
})
onBeforeUnmount(() => document.removeEventListener('selectionchange', handleSelectionChange))
</script>

<template>
  <div class="rich-editor">
    <div class="toolbar" role="toolbar" aria-label="富文本工具栏" @mousedown.capture="rememberSelection">
      <el-button-group>
        <el-button title="正文" @mousedown.prevent="command('formatBlock', 'p')">正文</el-button>
        <el-button title="二级标题" @mousedown.prevent="command('formatBlock', 'h2')">标题</el-button>
      </el-button-group>
      <el-button-group>
        <el-button data-testid="bold" title="粗体（可与其他格式组合）" :class="{ active: active.bold }" @mousedown.prevent="command('bold')"><strong>B</strong></el-button>
        <el-button data-testid="italic" title="斜体（可与其他格式组合）" :class="{ active: active.italic }" @mousedown.prevent="command('italic')"><em>I</em></el-button>
        <el-button data-testid="underline" title="下划线（可与其他格式组合）" :class="{ active: active.underline }" @mousedown.prevent="command('underline')"><u>U</u></el-button>
        <el-button title="删除线" :class="{ active: active.strikeThrough }" @mousedown.prevent="command('strikeThrough')"><s>S</s></el-button>
      </el-button-group>
      <div class="color-tools" aria-label="文字颜色">
        <span class="color-label">文字颜色</span>
        <button
          v-for="color in presetColors"
          :key="color.value"
          type="button"
          class="color-swatch"
          :style="{ '--swatch-color': color.value }"
          :title="color.name"
          :aria-label="color.name"
          @mousedown.prevent="applyColor(color.value)"
        />
        <label class="custom-color" title="自定义文字颜色">
          <span>A</span>
          <input data-testid="custom-color" type="color" :value="customColor" @mousedown="rememberSelection" @input="applyCustomColor">
        </label>
      </div>
      <el-button-group>
        <el-button title="无序列表" @mousedown.prevent="command('insertUnorderedList')">列表</el-button>
        <el-button title="有序列表" @mousedown.prevent="command('insertOrderedList')">编号</el-button>
      </el-button-group>
      <el-button-group>
        <el-button title="左对齐" @mousedown.prevent="command('justifyLeft')">左对齐</el-button>
        <el-button title="居中" @mousedown.prevent="command('justifyCenter')">居中</el-button>
        <el-button title="右对齐" @mousedown.prevent="command('justifyRight')">右对齐</el-button>
      </el-button-group>
      <el-button-group>
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
      @mouseup="rememberSelection"
      @keyup="rememberSelection"
      @paste="pastePlainText"
    />
  </div>
</template>

<style scoped>
.rich-editor { overflow: hidden; border: 1px solid #dcdfe6; border-radius: 8px; background: #fff; }
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 9px; border-bottom: 1px solid #ebeef5; background: #f8fafc; }
.toolbar :deep(.el-button.active) { z-index: 1; color: #409eff; background: #ecf5ff; border-color: #a0cfff; }
.color-tools { display: flex; height: 32px; align-items: center; gap: 6px; padding: 0 9px; border: 1px solid #dcdfe6; border-radius: 4px; background: #fff; }
.color-label { margin-right: 2px; color: #606266; font-size: 12px; }
.color-swatch { width: 18px; height: 18px; padding: 0; border: 2px solid #fff; border-radius: 50%; outline: 1px solid #d7dce4; background: var(--swatch-color); cursor: pointer; transition: transform .15s, box-shadow .15s; }
.color-swatch:hover { transform: scale(1.12); box-shadow: 0 0 0 2px rgb(64 158 255 / 18%); }
.custom-color { position: relative; display: grid; width: 24px; height: 24px; place-items: center; overflow: hidden; border-radius: 5px; color: #303133; font-size: 13px; font-weight: 700; cursor: pointer; }
.custom-color::after { position: absolute; right: 3px; bottom: 2px; left: 3px; height: 3px; border-radius: 2px; background: v-bind(customColor); content: ''; }
.custom-color input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.editor-area { min-height: 260px; padding: 16px; outline: none; color: #303133; line-height: 1.75; }
.editor-area:empty::before { color: #a8abb2; content: attr(data-placeholder); pointer-events: none; }
.editor-area:focus { box-shadow: inset 0 0 0 1px #409eff; }
</style>

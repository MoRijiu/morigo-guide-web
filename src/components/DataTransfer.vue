<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useCustomData } from '../composables/useCustomData'
import { useUserData } from '../composables/useUserData'
import {
  buildBackup,
  downloadBackup,
  parseBackup,
  parseBookmarks,
} from '../utils/dataTransfer'

const { customCategories, importCategories } = useCustomData()
const { favorites, recent, importUserData } = useUserData()

const open = ref(false)
const mode = ref<'merge' | 'replace'>('merge')
const message = ref('')
const isError = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function onExport() {
  downloadBackup(buildBackup(customCategories.value, favorites.value, recent.value))
  message.value = '已导出备份（含自定义站点、收藏、最近访问）'
  isError.value = false
}

function pickFile() {
  fileInput.value?.click()
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const text = await file.text()
    if (/\.html?$/i.test(file.name)) {
      const cats = parseBookmarks(text)
      const count = importCategories(cats, mode.value)
      message.value = `已从书签导入 ${count} 个站点（${cats.length} 个分类）`
    } else {
      const backup = parseBackup(text)
      const count = importCategories(backup.customCategories, mode.value)
      importUserData(backup.favorites, backup.recent, mode.value)
      message.value = `已导入 ${count} 个自定义站点、${backup.favorites.length} 条收藏`
    }
    isError.value = false
  } catch (err) {
    message.value = err instanceof Error ? err.message : '导入失败，文件格式不正确'
    isError.value = true
  }
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Icon icon="mdi:swap-horizontal" class="text-sm" />
      导入/导出
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-1.5 z-40 w-64 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg p-3 text-left"
    >
      <button
        type="button"
        class="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
        @click="onExport"
      >
        <Icon icon="mdi:download" class="text-sm" />
        导出备份 JSON
      </button>

      <div class="flex items-center gap-1.5 mt-2 px-2">
        <span class="text-[11px] text-surface-400 dark:text-surface-500">导入方式</span>
        <div class="flex rounded-md border border-surface-200 dark:border-surface-700 overflow-hidden" role="radiogroup" aria-label="导入方式">
          <button
            type="button"
            role="radio"
            :aria-checked="mode === 'merge'"
            class="px-2 py-1 text-[11px]"
            :class="mode === 'merge' ? 'bg-accent-600 text-white' : 'text-surface-500 dark:text-surface-400'"
            @click="mode = 'merge'"
          >合并</button>
          <button
            type="button"
            role="radio"
            :aria-checked="mode === 'replace'"
            class="px-2 py-1 text-[11px]"
            :class="mode === 'replace' ? 'bg-accent-600 text-white' : 'text-surface-500 dark:text-surface-400'"
            @click="mode = 'replace'"
          >覆盖</button>
        </div>
      </div>

      <button
        type="button"
        class="w-full flex items-center gap-1.5 px-2 py-1.5 mt-1 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
        @click="pickFile"
      >
        <Icon icon="mdi:upload" class="text-sm" />
        导入备份 JSON / 浏览器书签 HTML
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".json,.html,.htm,application/json,text/html"
        class="hidden"
        @change="onFile"
      />
      <p class="px-2 mt-1 text-[11px] text-surface-300 dark:text-surface-600">覆盖会替换现有自定义站点与收藏，请先导出备份。</p>
      <p
        v-if="message"
        class="px-2 mt-2 text-[11px]"
        :class="isError ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'"
        role="status"
      >{{ message }}</p>
    </div>
  </div>
</template>

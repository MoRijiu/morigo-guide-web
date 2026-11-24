<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { normalizeUrl } from '../composables/useCustomData'
import type { NavItem } from '../types'

const props = defineProps<{
  open: boolean
  /** 编辑时传入原条目与所属分类；新增时为 null */
  initial: { categoryName: string; item: NavItem } | null
  /** 可选的已有分类名（默认 + 自定义） */
  categoryNames: string[]
}>()

const emit = defineEmits<{
  save: [payload: { categoryName: string; item: NavItem }]
  close: []
}>()

const NEW_CATEGORY = '__new__'

const title = ref('')
const url = ref('')
const description = ref('')
const icon = ref('')
const categoryChoice = ref('')
const newCategory = ref('')
const error = ref('')
const titleRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.open,
  (v) => {
    if (!v) return
    error.value = ''
    if (props.initial) {
      title.value = props.initial.item.title
      url.value = props.initial.item.url
      description.value = props.initial.item.description
      icon.value = props.initial.item.icon === 'mdi:web' ? '' : props.initial.item.icon
      categoryChoice.value = props.initial.categoryName
    } else {
      title.value = ''
      url.value = ''
      description.value = ''
      icon.value = ''
      categoryChoice.value = props.categoryNames[0] ?? NEW_CATEGORY
    }
    newCategory.value = ''
    nextTick(() => titleRef.value?.focus())
  }
)

function onSubmit() {
  const t = title.value.trim()
  if (!t) {
    error.value = '请填写站点名称'
    return
  }
  const normalized = normalizeUrl(url.value)
  if (!normalized) {
    error.value = '网址不合法，请检查（如 example.com 或 https://example.com）'
    return
  }
  const cat =
    categoryChoice.value === NEW_CATEGORY ? newCategory.value.trim() : categoryChoice.value
  if (!cat) {
    error.value = '请填写新分类名称'
    return
  }
  emit('save', {
    categoryName: cat,
    item: {
      title: t,
      description: description.value.trim() || t,
      url: normalized,
      icon: icon.value.trim() || 'mdi:web',
    },
  })
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
    role="dialog"
    aria-modal="true"
    :aria-label="initial ? '编辑站点' : '添加站点'"
  >
    <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]" @click="emit('close')"></div>
    <form
      class="relative w-full sm:max-w-md bg-white dark:bg-surface-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-surface-100 dark:border-surface-800 p-5"
      @submit.prevent="onSubmit"
      @keydown.esc="emit('close')"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-surface-800 dark:text-surface-100">
          {{ initial ? '编辑站点' : '添加站点' }}
        </h3>
        <button
          type="button"
          class="p-1 rounded text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
          aria-label="关闭"
          @click="emit('close')"
        >
          <Icon icon="mdi:close" class="text-base" />
        </button>
      </div>

      <label class="block mb-3">
        <span class="text-xs text-surface-500 dark:text-surface-400">名称 *</span>
        <input
          ref="titleRef"
          v-model="title"
          type="text"
          maxlength="40"
          placeholder="如：我的博客"
          class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-300 dark:placeholder:text-surface-600 outline-none focus:border-accent-400"
        />
      </label>

      <label class="block mb-3">
        <span class="text-xs text-surface-500 dark:text-surface-400">网址 *</span>
        <input
          v-model="url"
          type="text"
          inputmode="url"
          placeholder="example.com 或 https://example.com"
          class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-300 dark:placeholder:text-surface-600 outline-none focus:border-accent-400"
        />
      </label>

      <label class="block mb-3">
        <span class="text-xs text-surface-500 dark:text-surface-400">描述</span>
        <input
          v-model="description"
          type="text"
          maxlength="60"
          placeholder="一句话说明这个站点是干什么的"
          class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-300 dark:placeholder:text-surface-600 outline-none focus:border-accent-400"
        />
      </label>

      <div class="flex gap-2 mb-3">
        <label class="block flex-1">
          <span class="text-xs text-surface-500 dark:text-surface-400">分类</span>
          <select
            v-model="categoryChoice"
            class="mt-1 w-full px-2 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-surface-800 dark:text-surface-100 outline-none focus:border-accent-400 dark:bg-surface-900"
          >
            <option v-for="name in categoryNames" :key="name" :value="name">{{ name }}</option>
            <option :value="NEW_CATEGORY">＋ 新建分类…</option>
          </select>
        </label>
        <label class="block flex-1">
          <span class="text-xs text-surface-500 dark:text-surface-400">图标（可选）</span>
          <input
            v-model="icon"
            type="text"
            placeholder="mdi:web"
            class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-300 dark:placeholder:text-surface-600 outline-none focus:border-accent-400"
          />
        </label>
      </div>

      <label v-if="categoryChoice === NEW_CATEGORY" class="block mb-3">
        <span class="text-xs text-surface-500 dark:text-surface-400">新分类名称 *</span>
        <input
          v-model="newCategory"
          type="text"
          maxlength="20"
          placeholder="如：我的收藏夹"
          class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-300 dark:placeholder:text-surface-600 outline-none focus:border-accent-400"
        />
      </label>

      <p v-if="error" class="text-xs text-red-500 mb-3" role="alert">{{ error }}</p>
      <p class="text-[11px] text-surface-400 dark:text-surface-500 mb-4">
        自定义站点只保存在这台设备的浏览器里，不会上传。
      </p>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="px-3.5 py-2 text-xs rounded-lg border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-surface-300 transition-colors"
          @click="emit('close')"
        >
          取消
        </button>
        <button
          type="submit"
          class="px-3.5 py-2 text-xs rounded-lg bg-accent-600 text-white font-medium hover:bg-accent-500 transition-colors"
        >
          {{ initial ? '保存' : '添加' }}
        </button>
      </div>
    </form>
  </div>
</template>

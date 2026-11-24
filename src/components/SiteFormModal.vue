<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { normalizeUrl } from '../composables/useCustomData'
import type { NavItem } from '../types'
import { useI18n } from '../i18n'
import siteConfig from '../config/site'

const { t, catName } = useI18n()

/** 下拉展示名：默认分类按语言显示本地化名（value 仍用原名作身份标识），自定义分类原样 */
function categoryLabel(name: string): string {
  const def = siteConfig.navigation.find((c) => c.name === name)
  return def ? catName(def) : name
}

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
  const name = title.value.trim()
  if (!name) {
    error.value = t('form.errName')
    return
  }
  const normalized = normalizeUrl(url.value)
  if (!normalized) {
    error.value = t('form.errUrl')
    return
  }
  const cat =
    categoryChoice.value === NEW_CATEGORY ? newCategory.value.trim() : categoryChoice.value
  if (!cat) {
    error.value = t('form.errCat')
    return
  }
  emit('save', {
    categoryName: cat,
    item: {
      title: name,
      description: description.value.trim() || name,
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
    :aria-label="initial ? t('form.editTitle') : t('form.addTitle')"
  >
    <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]" @click="emit('close')"></div>
    <form
      class="relative w-full sm:max-w-md bg-white dark:bg-surface-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-surface-100 dark:border-surface-800 p-5"
      @submit.prevent="onSubmit"
      @keydown.esc="emit('close')"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-surface-800 dark:text-surface-100">
          {{ initial ? t('form.editTitle') : t('form.addTitle') }}
        </h3>
        <button
          type="button"
          class="p-1 rounded text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
          :aria-label="t('form.close')"
          @click="emit('close')"
        >
          <Icon icon="mdi:close" class="text-base" />
        </button>
      </div>

      <label class="block mb-3">
        <span class="text-xs text-surface-500 dark:text-surface-400">{{ t('form.name') }}</span>
        <input
          ref="titleRef"
          v-model="title"
          type="text"
          maxlength="40"
          :placeholder="t('form.namePh')"
          class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-300 dark:placeholder:text-surface-600 outline-none focus:border-accent-400"
        />
      </label>

      <label class="block mb-3">
        <span class="text-xs text-surface-500 dark:text-surface-400">{{ t('form.url') }}</span>
        <input
          v-model="url"
          type="text"
          inputmode="url"
          placeholder="example.com / https://example.com"
          class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-300 dark:placeholder:text-surface-600 outline-none focus:border-accent-400"
        />
      </label>

      <label class="block mb-3">
        <span class="text-xs text-surface-500 dark:text-surface-400">{{ t('form.desc') }}</span>
        <input
          v-model="description"
          type="text"
          maxlength="60"
          :placeholder="t('form.descPh')"
          class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-300 dark:placeholder:text-surface-600 outline-none focus:border-accent-400"
        />
      </label>

      <div class="flex gap-2 mb-3">
        <label class="block flex-1">
          <span class="text-xs text-surface-500 dark:text-surface-400">{{ t('form.category') }}</span>
          <select
            v-model="categoryChoice"
            class="mt-1 w-full px-2 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-surface-800 dark:text-surface-100 outline-none focus:border-accent-400 dark:bg-surface-900"
          >
            <option v-for="name in categoryNames" :key="name" :value="name">{{ categoryLabel(name) }}</option>
            <option :value="NEW_CATEGORY">{{ t('form.newCategory') }}</option>
          </select>
        </label>
        <label class="block flex-1">
          <span class="text-xs text-surface-500 dark:text-surface-400">{{ t('form.icon') }}</span>
          <input
            v-model="icon"
            type="text"
            placeholder="mdi:web"
            class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-300 dark:placeholder:text-surface-600 outline-none focus:border-accent-400"
          />
        </label>
      </div>

      <label v-if="categoryChoice === NEW_CATEGORY" class="block mb-3">
        <span class="text-xs text-surface-500 dark:text-surface-400">{{ t('form.newCatName') }}</span>
        <input
          v-model="newCategory"
          type="text"
          maxlength="20"
          :placeholder="t('form.newCatPh')"
          class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent text-surface-800 dark:text-surface-100 placeholder:text-surface-300 dark:placeholder:text-surface-600 outline-none focus:border-accent-400"
        />
      </label>

      <p v-if="error" class="text-xs text-red-500 mb-3" role="alert">{{ error }}</p>
      <p class="text-[11px] text-surface-400 dark:text-surface-500 mb-4">
        {{ t('form.note') }}
      </p>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="px-3.5 py-2 text-xs rounded-lg border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-surface-300 transition-colors"
          @click="emit('close')"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          type="submit"
          class="px-3.5 py-2 text-xs rounded-lg bg-accent-600 text-white font-medium hover:bg-accent-500 transition-colors"
        >
          {{ initial ? t('form.save') : t('common.add') }}
        </button>
      </div>
    </form>
  </div>
</template>

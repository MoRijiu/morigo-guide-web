<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import type { SharePayload } from '../utils/share'
import { useI18n } from '../i18n'

const { t } = useI18n()

const props = defineProps<{ payload: SharePayload | null }>()
const emit = defineEmits<{ import: []; close: [] }>()

// 关闭口径统一：遮罩点击 / 按钮之外，补 Esc 关闭（弹窗打开时才生效）
function onDocKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.payload) emit('close')
}
onMounted(() => document.addEventListener('keydown', onDocKeyDown))
onBeforeUnmount(() => document.removeEventListener('keydown', onDocKeyDown))

const itemCount = computed(
  () => props.payload?.customCategories.reduce((s, c) => s + c.items.length, 0) ?? 0
)
</script>

<template>
  <div
    v-if="payload"
    class="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
    role="dialog"
    aria-modal="true"
    :aria-label="t('share.aria')"
  >
    <div class="absolute inset-0 bg-surface-950/40 backdrop-blur-[2px]" @click="emit('close')" />
    <div
      class="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-xl p-4 max-h-[85dvh] overflow-y-auto"
    >
      <div class="flex items-center gap-2">
        <Icon icon="mdi:share-variant" class="text-lg text-accent-600 dark:text-accent-400" />
        <h2 class="text-sm font-semibold text-surface-800 dark:text-surface-100">{{ t('share.title') }}</h2>
      </div>
      <p class="mt-1.5 text-xs text-surface-500 dark:text-surface-400">
        {{ t('share.desc', { cats: payload.customCategories.length, items: itemCount, fav: payload.favorites.length ? t('share.favPart', { n: payload.favorites.length }) : '' }) }}
      </p>

      <div v-if="payload.customCategories.length" class="mt-3 space-y-2.5">
        <div v-for="cat in payload.customCategories" :key="cat.name">
          <p class="text-[11px] font-medium text-surface-400 dark:text-surface-500">
            {{ cat.name }} ({{ cat.items.length }})
          </p>
          <ul class="mt-1 space-y-0.5">
            <li
              v-for="item in cat.items"
              :key="item.url"
              class="flex items-baseline gap-1.5 text-xs text-surface-600 dark:text-surface-300"
            >
              <span class="truncate">{{ item.title }}</span>
              <span class="shrink-0 text-[11px] text-surface-300 dark:text-surface-600 truncate max-w-[45%]">{{ item.url }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-4 flex gap-2">
        <button
          type="button"
          class="flex-1 px-3 py-2 rounded-md text-xs font-medium bg-accent-600 text-white hover:bg-accent-500 transition-colors"
          @click="emit('import')"
        >
          {{ t('share.import') }}
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-md text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400 transition-colors"
          @click="emit('close')"
        >
          {{ t('share.dismiss') }}
        </button>
      </div>
    </div>
  </div>
</template>

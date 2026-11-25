<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from '../i18n'

const { t } = useI18n()

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

// 关闭口径统一：遮罩点击 / 关闭按钮 / Esc（弹窗打开时才生效）
function onDocKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => document.addEventListener('keydown', onDocKeyDown))
onBeforeUnmount(() => document.removeEventListener('keydown', onDocKeyDown))

interface ShortcutRow {
  keys: string[]
  labelKey: string
}
interface ShortcutGroup {
  titleKey: string
  rows: ShortcutRow[]
}

const groups: ShortcutGroup[] = [
  {
    titleKey: 'help.groupSearch',
    rows: [
      { keys: ['Ctrl / ⌘', 'K'], labelKey: 'help.palette' },
      { keys: ['/'], labelKey: 'help.focusSearch' },
      { keys: ['↑', '↓'], labelKey: 'help.move' },
      { keys: ['Enter'], labelKey: 'help.open' },
    ],
  },
  {
    titleKey: 'help.groupSort',
    rows: [
      { keys: ['Alt', '↑', '↓'], labelKey: 'help.sortItem' },
      { keys: ['Alt', '↑', '↓'], labelKey: 'help.sortCategory' },
    ],
  },
  {
    titleKey: 'help.groupGeneral',
    rows: [
      { keys: ['Esc'], labelKey: 'help.esc' },
      { keys: ['?'], labelKey: 'help.help' },
    ],
  },
]
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
    role="dialog"
    aria-modal="true"
    :aria-label="t('help.title')"
  >
    <div class="absolute inset-0 bg-surface-950/40 backdrop-blur-[2px]" @click="emit('close')" />
    <div
      class="float-panel relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-xl p-4 max-h-[85dvh] overflow-y-auto"
    >
      <div class="flex items-center gap-2">
        <Icon icon="mdi:keyboard-outline" class="text-lg text-accent-600 dark:text-accent-400" />
        <h2 class="text-sm font-semibold text-surface-800 dark:text-surface-100">{{ t('help.title') }}</h2>
        <button
          type="button"
          class="ml-auto w-7 h-7 inline-flex items-center justify-center rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-200 dark:hover:bg-surface-800 transition-colors"
          :aria-label="t('help.close')"
          @click="emit('close')"
        >
          <Icon icon="mdi:close" class="text-base" />
        </button>
      </div>

      <div v-for="group in groups" :key="group.titleKey" class="mt-4 first:mt-3">
        <p class="text-[11px] font-medium text-surface-400 dark:text-surface-500">{{ t(group.titleKey) }}</p>
        <ul class="mt-1.5 divide-y divide-surface-100 dark:divide-surface-800">
          <li v-for="row in group.rows" :key="row.labelKey" class="flex items-center gap-3 py-1.5">
            <span class="flex items-center gap-1 shrink-0">
              <kbd v-for="k in row.keys" :key="k" class="kbd-hint">{{ k }}</kbd>
            </span>
            <span class="text-xs text-surface-600 dark:text-surface-300">{{ t(row.labelKey) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

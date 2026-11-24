<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import DynamicIcon from './DynamicIcon.vue'
import { fuzzyScoreFields } from '../utils/fuzzy'
import type { NavItem } from '../types'
import { useI18n } from '../i18n'

const { t } = useI18n()

export interface PaletteEntry {
  kind: 'site' | 'action' | 'category'
  id: string
  title: string
  hint?: string
  icon: string
  item?: NavItem
  categoryName?: string
  /** 分类展示名（按语言本地化），仅用于条目右侧标签；categoryName 仍是身份标识 */
  categoryLabel?: string
  actionId?: string
}

const props = defineProps<{
  open: boolean
  entries: PaletteEntry[]
}>()

const emit = defineEmits<{
  close: []
  pick: [entry: PaletteEntry]
}>()

const query = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLDivElement | null>(null)

const results = computed<PaletteEntry[]>(() => {
  const q = query.value.trim()
  if (!q) {
    // 空查询：动作与分类在前，站点给热门优先（entries 顺序已由父级排好）
    return props.entries.slice(0, 12)
  }
  const scored: { entry: PaletteEntry; score: number }[] = []
  for (const entry of props.entries) {
    const fields =
      entry.kind === 'site' && entry.item
        ? [entry.item.title, entry.item.description, entry.item.descriptionEn ?? '', entry.item.url, ...(entry.item.aliases ?? [])]
        : [entry.title, entry.hint]
    const score = fuzzyScoreFields(q, fields)
    if (score >= 0) scored.push({ entry, score: score + (entry.kind === 'site' ? 0 : 50) })
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((s) => s.entry)
})

watch(
  () => props.open,
  (v) => {
    if (v) {
      query.value = ''
      activeIndex.value = 0
      nextTick(() => inputRef.value?.focus())
    }
  }
)

watch(query, () => {
  activeIndex.value = 0
})

watch(activeIndex, () => {
  nextTick(() => {
    listRef.value
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  })
})

function move(delta: number) {
  if (!results.value.length) return
  activeIndex.value =
    (activeIndex.value + delta + results.value.length) % results.value.length
}

function pickActive() {
  const entry = results.value[activeIndex.value]
  if (entry) emit('pick', entry)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    move(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    move(-1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    pickActive()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
}

function kindLabel(entry: PaletteEntry): string {
  if (entry.kind === 'action') return t('palette.kindAction')
  if (entry.kind === 'category') return t('palette.kindCategory')
  return entry.categoryLabel ?? entry.categoryName ?? t('palette.kindSite')
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh] bg-surface-950/40 backdrop-blur-[2px]"
    role="dialog"
    aria-modal="true"
    :aria-label="t('palette.aria')"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-lg rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-2xl overflow-hidden">
      <div class="flex items-center gap-2 px-3.5 border-b border-surface-100 dark:border-surface-800">
        <Icon icon="mdi:magnify" class="text-lg text-surface-400 shrink-0" />
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          :placeholder="t('palette.placeholder')"
          class="flex-1 py-3 text-sm bg-transparent outline-none text-surface-800 dark:text-surface-100 placeholder:text-surface-300 dark:placeholder:text-surface-600"
          :aria-label="t('palette.searchAria')"
          @keydown="onKeydown"
        />
        <kbd class="kbd-hint shrink-0">Esc</kbd>
      </div>

      <div ref="listRef" class="max-h-[46vh] overflow-y-auto py-1.5" role="listbox">
        <button
          v-for="(entry, idx) in results"
          :key="entry.id"
          type="button"
          role="option"
          :aria-selected="idx === activeIndex"
          :data-active="idx === activeIndex"
          class="w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition-colors"
          :class="idx === activeIndex ? 'bg-accent-50 dark:bg-accent-500/10' : ''"
          @mouseenter="activeIndex = idx"
          @click="emit('pick', entry)"
        >
          <span class="w-7 h-7 rounded-md bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0">
            <DynamicIcon :icon="entry.icon" class="text-base text-surface-500 dark:text-surface-300" />
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-[13px] font-medium text-surface-700 dark:text-surface-200 truncate">{{ entry.title }}</span>
            <span v-if="entry.hint" class="block text-[11px] text-surface-400 dark:text-surface-500 truncate">{{ entry.hint }}</span>
          </span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500 shrink-0">{{ kindLabel(entry) }}</span>
        </button>
        <p v-if="!results.length" class="px-3.5 py-6 text-center text-xs text-surface-400 dark:text-surface-500">
          {{ t('palette.empty', { q: query }) }}
        </p>
      </div>

      <div class="flex items-center gap-3 px-3.5 py-2 border-t border-surface-100 dark:border-surface-800 text-[10px] text-surface-300 dark:text-surface-600">
        <span><kbd class="kbd-hint">↑</kbd><kbd class="kbd-hint">↓</kbd> {{ t('palette.select') }}</span>
        <span><kbd class="kbd-hint">Enter</kbd> {{ t('palette.run') }}</span>
        <span class="ml-auto flex items-center gap-1"><Icon icon="mdi:apple-keyboard-command" class="text-[11px]" />{{ t('palette.openHint') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useUserData } from '../composables/useUserData'
import type { NavItem, NavCategory } from '../types'
import { useI18n } from '../i18n'

const { t } = useI18n()

/**
 * 本地访问统计面板：数据全部来自 localStorage 的访问计数，
 * 不上报、不联网。展示总览、访问 Top、分类访问占比。
 */
const props = defineProps<{
  items: NavItem[]
  categories: NavCategory[]
  favoritesCount: number
}>()

const emit = defineEmits<{ 'open-item': [item: NavItem] }>()

const { visitCounts, totalVisits, clearStats } = useUserData()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const visitedCount = computed(() => Object.keys(visitCounts.value).length)

const itemByUrl = computed(() => {
  const map = new Map<string, NavItem>()
  for (const item of props.items) map.set(item.url, item)
  return map
})

const topItems = computed(() =>
  Object.entries(visitCounts.value)
    .map(([url, count]) => ({ item: itemByUrl.value.get(url), count }))
    .filter((x): x is { item: NavItem; count: number } => Boolean(x.item))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
)

const topMax = computed(() => topItems.value[0]?.count ?? 0)

const categoryStats = computed(() => {
  const rows = props.categories
    .map((cat) => ({
      name: cat.name,
      visits: cat.items.reduce((sum, item) => sum + (visitCounts.value[item.url] ?? 0), 0),
    }))
    .filter((r) => r.visits > 0)
    .sort((a, b) => b.visits - a.visits)
  const max = rows[0]?.visits ?? 0
  return rows.slice(0, 6).map((r) => ({
    ...r,
    pct: totalVisits.value ? Math.round((r.visits / totalVisits.value) * 100) : 0,
    width: max ? Math.max(4, Math.round((r.visits / max) * 100)) : 0,
  }))
})

function onClear() {
  if (window.confirm(t('stats.confirm'))) {
    clearStats()
  }
}

function onDocClick(e: MouseEvent) {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target as Node)) {
    open.value = false
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

function onOpenStatsEvent() {
  open.value = true
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
  window.addEventListener('morigo:open-stats', onOpenStatsEvent)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('morigo:open-stats', onOpenStatsEvent)
})
</script>

<template>
  <div ref="rootEl" class="relative">
    <button
      type="button"
      class="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Icon icon="mdi:chart-bar" class="text-sm" />
      {{ t('stats.button') }}
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-1.5 z-50 w-72 max-w-[calc(100vw-2.5rem)] rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg p-3 text-left"
      role="group"
      :aria-label="t('stats.aria')"
    >
      <div class="flex items-baseline justify-between px-1 mb-2">
        <p class="text-[11px] font-medium text-surface-400 dark:text-surface-500">{{ t('stats.title') }}</p>
        <p class="text-[11px] text-surface-300 dark:text-surface-600">{{ t('stats.localNote') }}</p>
      </div>

      <div class="grid grid-cols-3 gap-1.5 mb-3 text-center">
        <div class="rounded-md bg-surface-50 dark:bg-surface-800/60 py-1.5">
          <p class="text-sm font-semibold text-surface-800 dark:text-surface-100">{{ totalVisits }}</p>
          <p class="text-[10px] text-surface-400 dark:text-surface-500">{{ t('stats.total') }}</p>
        </div>
        <div class="rounded-md bg-surface-50 dark:bg-surface-800/60 py-1.5">
          <p class="text-sm font-semibold text-surface-800 dark:text-surface-100">{{ visitedCount }}</p>
          <p class="text-[10px] text-surface-400 dark:text-surface-500">{{ t('stats.visited') }}</p>
        </div>
        <div class="rounded-md bg-surface-50 dark:bg-surface-800/60 py-1.5">
          <p class="text-sm font-semibold text-surface-800 dark:text-surface-100">{{ favoritesCount }}</p>
          <p class="text-[10px] text-surface-400 dark:text-surface-500">{{ t('cat.favorites') }}</p>
        </div>
      </div>

      <template v-if="totalVisits > 0">
        <p class="px-1 text-[11px] font-medium text-surface-400 dark:text-surface-500 mb-1.5">{{ t('stats.top') }}</p>
        <ul class="mb-3">
          <li v-for="(row, idx) in topItems" :key="row.item.url">
            <button
              type="button"
              class="w-full flex items-center gap-2 px-1 py-1 rounded-md hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors text-left"
              :title="row.item.url"
              @click="emit('open-item', row.item)"
            >
              <span class="w-4 shrink-0 text-[11px] text-surface-300 dark:text-surface-600 text-right">{{ idx + 1 }}</span>
              <span class="flex-1 min-w-0">
                <span class="block truncate text-xs text-surface-700 dark:text-surface-200">{{ row.item.title }}</span>
                <span class="block h-1 mt-1 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                  <span
                    class="block h-full rounded-full bg-accent-500/80"
                    :style="{ width: `${topMax ? Math.max(6, Math.round((row.count / topMax) * 100)) : 0}%` }"
                  />
                </span>
              </span>
              <span class="shrink-0 text-[11px] font-medium text-surface-500 dark:text-surface-400">{{ t('stats.times', { n: row.count }) }}</span>
            </button>
          </li>
        </ul>

        <p class="px-1 text-[11px] font-medium text-surface-400 dark:text-surface-500 mb-1.5">{{ t('stats.byCategory') }}</p>
        <ul class="mb-3 space-y-1.5 px-1">
          <li v-for="row in categoryStats" :key="row.name" class="flex items-center gap-2">
            <span class="w-16 shrink-0 truncate text-[11px] text-surface-600 dark:text-surface-300">{{ row.name }}</span>
            <span class="flex-1 h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
              <span class="block h-full rounded-full bg-accent-400/80" :style="{ width: `${row.width}%` }" />
            </span>
            <span class="w-8 shrink-0 text-right text-[11px] text-surface-400 dark:text-surface-500">{{ row.pct }}%</span>
          </li>
        </ul>

        <div class="flex justify-end px-1">
          <button
            type="button"
            class="text-[11px] text-surface-400 dark:text-surface-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            @click="onClear"
          >
            {{ t('stats.clear') }}
          </button>
        </div>
      </template>

      <p v-else class="px-1 py-2 text-xs leading-relaxed text-surface-400 dark:text-surface-500">
        {{ t('stats.empty') }}
      </p>
    </div>
  </div>
</template>

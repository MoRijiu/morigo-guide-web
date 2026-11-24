<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import DynamicIcon from './DynamicIcon.vue'
import HighlightText from './HighlightText.vue'
import { toSlug } from '../utils/slug'
import { iconTint } from '../utils/iconTint'
import { useUserData } from '../composables/useUserData'
import type { NavItem } from '../types'

const props = defineProps<{
  item: NavItem
  keyword?: string
  /** 同组序号，仅用于入场动画错峰延迟 */
  index?: number
}>()

const { isFavorite, toggleFavorite, recordVisit } = useUserData()
const favorited = computed(() => isFavorite(props.item.url))
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

const itemId = computed(() => `nav-${toSlug(props.item.title)}`)
const tint = computed(() => iconTint(props.item.title))
const enterDelay = computed(() => `${Math.min(props.index ?? 0, 8) * 30}ms`)

function onToggleFavorite(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  toggleFavorite(props.item.url)
}

async function onCopyLink(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  try {
    await navigator.clipboard.writeText(props.item.url)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied.value = false), 1500)
  } catch {
    // 剪贴板不可用时静默忽略
  }
}
</script>

<template>
  <a
    :id="itemId"
    :href="item.url"
    target="_blank"
    rel="noopener noreferrer"
    class="nav-card group scroll-mt-20"
    :style="{ animationDelay: enterDelay }"
    @click="recordVisit(item.url)"
  >
    <div :class="['w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105', tint.bg]">
      <DynamicIcon :icon="item.icon" :class="'text-lg ' + tint.text" />
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="text-[13px] font-medium text-surface-700 dark:text-surface-200 truncate group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors duration-200">
        <HighlightText :text="item.title" :keyword="keyword" />
        <Icon v-if="item.hot" icon="mdi:fire" class="inline-block text-[11px] text-orange-400 ml-1 -mt-0.5" aria-label="热门" />
      </h3>
      <p class="text-[11px] text-surface-400 dark:text-surface-500 truncate mt-0.5 leading-tight">
        <HighlightText :text="item.description" :keyword="keyword" />
      </p>
    </div>
    <span class="flex items-center gap-0.5 shrink-0 self-start">
      <button
        type="button"
        :title="favorited ? '取消收藏' : '收藏'"
        :aria-label="favorited ? '取消收藏' : '收藏'"
        :aria-pressed="favorited"
        @click="onToggleFavorite"
        :class="[
          'p-1 rounded transition-all',
          favorited
            ? 'text-amber-400 opacity-100'
            : 'text-surface-300 dark:text-surface-600 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-amber-400',
        ]"
      >
        <Icon :icon="favorited ? 'mdi:star' : 'mdi:star-outline'" class="text-sm" />
      </button>
      <button
        type="button"
        :title="copied ? '已复制' : '复制链接'"
        aria-label="复制链接"
        @click="onCopyLink"
        :class="[
          'p-1 rounded transition-all',
          copied
            ? 'text-emerald-500 opacity-100'
            : 'text-surface-300 dark:text-surface-600 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-accent-500',
        ]"
      >
        <Icon :icon="copied ? 'mdi:check' : 'mdi:content-copy'" class="text-sm" />
      </button>
    </span>
  </a>
</template>

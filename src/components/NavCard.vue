<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import DynamicIcon from './DynamicIcon.vue'
import HighlightText from './HighlightText.vue'
import { toSlug } from '../utils/slug'
import { iconTint } from '../utils/iconTint'
import { copyText } from '../utils/clipboard'
import { useUserData } from '../composables/useUserData'
import { useCustomData } from '../composables/useCustomData'
import type { NavItem } from '../types'
import { useI18n } from '../i18n'

const { t, itemDesc } = useI18n()

const props = defineProps<{
  item: NavItem
  keyword?: string
  /** 同组序号，仅用于入场动画错峰延迟 */
  index?: number
  /** 键盘方向键当前选中态 */
  active?: boolean
  /** 所属分类名，用于判断是否为用户自定义条目 */
  categoryName?: string
  /** 布局：grid 网格卡片 / list 单列列表（列表态额外显示域名） */
  layout?: 'grid' | 'list'
  /** 密度：comfortable 舒适 / compact 紧凑 */
  density?: 'comfortable' | 'compact'
  /** 是否可拖拽排序（收藏分组 / 纯自定义分类） */
  sortable?: boolean
  /** 自定义条目可跨分类拖拽移动（拖到其他分类上松手） */
  crossDraggable?: boolean
  /** 正在被拖拽（半透明示意） */
  dragging?: boolean
}>()

const emit = defineEmits<{
  edit: [payload: { categoryName: string; item: NavItem }]
  remove: [payload: { categoryName: string; item: NavItem }]
  'sort-start': [payload: { item: NavItem; event: PointerEvent }]
  'sort-move': [payload: { item: NavItem; delta: number }]
  'context-menu': [payload: { item: NavItem; categoryName?: string; x: number; y: number }]
}>()

// ==================== 右键 / 长按菜单 ====================
function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  emit('context-menu', { item: props.item, categoryName: props.categoryName, x: e.clientX, y: e.clientY })
}

let longPressTimer: ReturnType<typeof setTimeout> | undefined
let longPressStart: { x: number; y: number } | null = null
let suppressNextClick = false

function clearLongPress() {
  clearTimeout(longPressTimer)
  longPressTimer = undefined
  longPressStart = null
}

function onPointerDown(e: PointerEvent) {
  // 仅主指针、且不落在卡片内按钮上时才计长按（按钮有自己的点击语义）
  if (!e.isPrimary || e.button !== 0) return
  if ((e.target as HTMLElement | null)?.closest('button')) return
  clearLongPress()
  longPressStart = { x: e.clientX, y: e.clientY }
  const { x, y } = longPressStart
  longPressTimer = setTimeout(() => {
    suppressNextClick = true
    try {
      navigator.vibrate?.(10)
    } catch {
      // 不支持震动时忽略
    }
    emit('context-menu', { item: props.item, categoryName: props.categoryName, x, y })
  }, 550)
}

function onPointerMove(e: PointerEvent) {
  if (!longPressStart) return
  if (Math.hypot(e.clientX - longPressStart.x, e.clientY - longPressStart.y) > 10) clearLongPress()
}

function onCardClick(e: MouseEvent) {
  if (suppressNextClick) {
    suppressNextClick = false
    e.preventDefault()
    return
  }
  recordVisit(props.item.url)
}

function onSortHandlePointerDown(e: PointerEvent) {
  // 拖拽由分类容器统一处理（指针移动实时重排）；此处只上报起点并阻止链接拖拽/页面滚动干扰
  e.preventDefault()
  e.stopPropagation()
  emit('sort-start', { item: props.item, event: e })
}

function onCardKeydown(e: KeyboardEvent) {
  if (!props.sortable || !e.altKey) return
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    e.stopPropagation()
    emit('sort-move', { item: props.item, delta: e.key === 'ArrowUp' ? -1 : 1 })
  }
}

const rootRef = ref<HTMLElement | null>(null)

// 键盘选中时把卡片滚进可视区（不抢焦点，焦点仍留在搜索框）
watch(
  () => props.active,
  (v) => {
    if (v) rootRef.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
)

const { isFavorite, toggleFavorite, recordVisit } = useUserData()
const { isCustomItem } = useCustomData()
/** 显示拖拽手柄：可排序，或可跨分类拖拽且本条目是自定义站点 */
const showHandle = computed(
  () => Boolean(props.sortable) || Boolean(props.crossDraggable && isCustom.value)
)
const favorited = computed(() => isFavorite(props.item.url))
const isCustom = computed(() =>
  props.categoryName ? isCustomItem(props.categoryName, props.item.url) : false
)

function onEdit(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  if (props.categoryName) emit('edit', { categoryName: props.categoryName, item: props.item })
}

function onRemove(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  if (props.categoryName) emit('remove', { categoryName: props.categoryName, item: props.item })
}
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

const host = computed(() => {
  try {
    return new URL(props.item.url).hostname
  } catch {
    return ''
  }
})

const itemId = computed(() => `nav-${toSlug(props.item.title)}`)
const tint = computed(() => iconTint(props.item.title))
const enterDelay = computed(() => `${Math.min(props.index ?? 0, 8) * 30}ms`)

function onToggleFavorite(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  toggleFavorite(props.item.url)
}

const copyFailed = ref(false)
async function onCopyLink(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  // copyText 内含 execCommand 兜底；再失败必须给可见反馈，不许静默吞错
  const ok = await copyText(props.item.url)
  clearTimeout(copyTimer)
  if (ok) {
    copied.value = true
    copyFailed.value = false
    copyTimer = setTimeout(() => (copied.value = false), 1500)
  } else {
    copied.value = false
    copyFailed.value = true
    copyTimer = setTimeout(() => (copyFailed.value = false), 2500)
  }
}
</script>

<template>
  <a
    ref="rootRef"
    :id="itemId"
    :href="item.url"
    target="_blank"
    rel="noopener noreferrer"
    class="nav-card group scroll-mt-32"
    :class="[
      active ? 'ring-2 ring-accent-400/70 dark:ring-accent-500/70 !border-accent-300 dark:!border-accent-500/50' : '',
      density === 'compact' ? 'nav-card-compact' : '',
      dragging ? 'opacity-50 ring-2 ring-accent-400/60' : '',
    ]"
    :style="{ animationDelay: enterDelay }"
    :data-sort-url="sortable ? item.url : undefined"
    @click="onCardClick"
    @keydown="onCardKeydown"
    @contextmenu="onContextMenu"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="clearLongPress"
    @pointercancel="clearLongPress"
    @pointerleave="clearLongPress"
  >
    <span
      v-if="showHandle"
      role="button"
      :title="t('card.drag')"
      :aria-label="t('card.drag')"
      class="shrink-0 self-center -ml-1 p-0.5 rounded cursor-grab active:cursor-grabbing touch-none text-surface-300 dark:text-surface-600 hover:text-accent-500 transition-colors"
      @pointerdown="onSortHandlePointerDown"
      @click.prevent.stop
    >
      <Icon icon="mdi:drag-vertical" class="text-base block" />
    </span>
    <div :class="['rounded-md flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105', tint.bg, density === 'compact' ? 'w-8 h-8' : 'w-9 h-9']">
      <DynamicIcon :icon="item.icon" :class="(density === 'compact' ? 'text-base ' : 'text-lg ') + tint.text" />
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="text-[13px] font-medium text-surface-700 dark:text-surface-200 truncate group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors duration-200">
        <HighlightText :text="item.title" :keyword="keyword" />
        <Icon v-if="item.hot" icon="mdi:fire" class="inline-block text-[11px] text-orange-400 ml-1 -mt-0.5" :aria-label="t('card.hot')" />
      </h3>
      <p class="text-[11px] text-surface-400 dark:text-surface-500 truncate mt-0.5 leading-tight">
        <HighlightText :text="itemDesc(item)" :keyword="keyword" />
      </p>
    </div>
    <span v-if="layout === 'list' && host" class="hidden md:block shrink-0 self-center text-[11px] text-surface-300 dark:text-surface-600 max-w-[180px] truncate">{{ host }}</span>
    <span class="flex items-center gap-0.5 shrink-0 self-start">
      <button
        v-if="isCustom"
        type="button"
        :title="t('card.edit')"
        :aria-label="t('card.editAria')"
        @click="onEdit"
        class="p-1 rounded transition-all text-surface-300 dark:text-surface-600 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 hover:text-accent-500"
      >
        <Icon icon="mdi:lead-pencil" class="text-sm" />
      </button>
      <button
        v-if="isCustom"
        type="button"
        :title="t('card.delete')"
        :aria-label="t('card.deleteAria')"
        @click="onRemove"
        class="p-1 rounded transition-all text-surface-300 dark:text-surface-600 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 hover:text-red-500"
      >
        <Icon icon="mdi:trash-can-outline" class="text-sm" />
      </button>
      <button
        type="button"
        :title="favorited ? t('card.unfav') : t('card.fav')"
        :aria-label="favorited ? t('card.unfav') : t('card.fav')"
        :aria-pressed="favorited"
        @click="onToggleFavorite"
        :class="[
          'p-1 rounded transition-all',
          favorited
            ? 'text-amber-400 opacity-100'
            : 'text-surface-300 dark:text-surface-600 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 hover:text-amber-400',
        ]"
      >
        <Icon :icon="favorited ? 'mdi:star' : 'mdi:star-outline'" class="text-sm" />
      </button>
      <button
        type="button"
        :title="copyFailed ? t('card.copyFailed') : copied ? t('card.copied') : t('card.copy')"
        :aria-label="t('card.copy')"
        @click="onCopyLink"
        :class="[
          'p-1 rounded transition-all',
          copied
            ? 'text-emerald-500 opacity-100'
            : copyFailed
              ? 'text-red-500 opacity-100'
              : 'text-surface-300 dark:text-surface-600 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 hover:text-accent-500',
        ]"
      >
        <Icon :icon="copied ? 'mdi:check' : copyFailed ? 'mdi:alert-circle-outline' : 'mdi:content-copy'" class="text-sm" />
      </button>
    </span>
  </a>
</template>

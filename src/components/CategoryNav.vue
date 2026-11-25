<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import DynamicIcon from './DynamicIcon.vue'
import { categoryAnchorId } from '../utils/slug'
import type { NavCategory } from '../types'
import { useI18n } from '../i18n'

const { t, catName, locale } = useI18n()

const props = defineProps<{
  categories: NavCategory[]
}>()

const activeId = ref('')
let observer: IntersectionObserver | null = null

// 横向滚动条隐藏（与 SearchBar 引擎行同一口径）；隐藏后补齐 PC 横滚手段：
// 滚轮转横滚、按住拖动、两侧箭头按钮；左右缘 mask 渐隐与可滚状态联动
const scrollRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const hasOverflow = ref(false)
const canHover = ref(false)
const isDragging = ref(false)

function updateScrollState() {
  const el = scrollRef.value
  if (!el) {
    canScrollLeft.value = canScrollRight.value = hasOverflow.value = false
    return
  }
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollWidth - el.clientWidth - el.scrollLeft > 4
  hasOverflow.value = el.scrollWidth - el.clientWidth > 4
}

const maskImage = computed(() => {
  const l = canScrollLeft.value
  const r = canScrollRight.value
  if (l && r) return 'linear-gradient(to right, transparent, black 2.5rem, black calc(100% - 2.5rem), transparent)'
  if (l) return 'linear-gradient(to right, transparent, black 2.5rem)'
  if (r) return 'linear-gradient(to right, black calc(100% - 2.5rem), transparent)'
  return undefined
})

// 滚轮转横滚：悬停时纵向滚轮驱动横向滚动；已到边界则不拦截，页面继续纵滚
function onWheel(e: WheelEvent) {
  const el = scrollRef.value
  if (!el || e.shiftKey) return
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
  const max = el.scrollWidth - el.clientWidth
  if (max <= 0) return
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientWidth : 1
  const next = Math.max(0, Math.min(max, el.scrollLeft + e.deltaY * unit))
  if (next === el.scrollLeft) return
  e.preventDefault()
  el.scrollLeft = next
}

// 按住拖动横滚：拖动超 5px 后抑制本次 click，避免拖完误跳分类
let dragStartX = 0
let dragStartLeft = 0
let dragActive = false
let dragMoved = false
let suppressClick = false

function onPointerDown(e: PointerEvent) {
  if (e.pointerType !== 'mouse' || e.button !== 0) return
  const el = scrollRef.value
  if (!el || el.scrollWidth - el.clientWidth <= 0) return
  dragActive = true
  dragMoved = false
  dragStartX = e.clientX
  dragStartLeft = el.scrollLeft
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp, { once: true })
}
function onPointerMove(e: PointerEvent) {
  if (!dragActive) return
  const el = scrollRef.value
  if (!el) return
  const dx = e.clientX - dragStartX
  if (!dragMoved && Math.abs(dx) > 5) {
    dragMoved = true
    isDragging.value = true
  }
  if (dragMoved) el.scrollLeft = dragStartLeft - dx
}
function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  dragActive = false
  isDragging.value = false
  if (dragMoved) {
    suppressClick = true
    setTimeout(() => { suppressClick = false }, 0)
  }
  dragMoved = false
}
function onClickCapture(e: MouseEvent) {
  if (suppressClick) {
    e.preventDefault()
    e.stopPropagation()
    suppressClick = false
  }
}

function scrollByPage(dir: 1 | -1) {
  const el = scrollRef.value
  if (!el) return
  el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
}

function observeSections() {
  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) activeId.value = e.target.id
      }
    },
    { rootMargin: '-96px 0px -55% 0px', threshold: 0 }
  )
  for (const cat of props.categories) {
    const el = document.getElementById(categoryAnchorId(cat.name))
    if (el) observer.observe(el)
  }
}

onMounted(() => {
  observeSections()
  updateScrollState()
  canHover.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  window.addEventListener('resize', updateScrollState)
  scrollRef.value?.addEventListener('wheel', onWheel, { passive: false })
})
watch(() => props.categories.map((c) => c.name).join('|'), () => {
  requestAnimationFrame(observeSections)
  nextTick(updateScrollState)
})
watch(locale, () => nextTick(updateScrollState))
onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', updateScrollState)
  window.removeEventListener('pointermove', onPointerMove)
  scrollRef.value?.removeEventListener('wheel', onWheel)
})

function jump(name: string) {
  const id = categoryAnchorId(name)
  activeId.value = id
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <nav
    v-if="categories.length > 1"
    class="sticky top-14 z-40 -mx-5 sm:-mx-8 px-5 sm:px-8 py-2 mb-6 backdrop-blur-lg bg-surface-50/85 dark:bg-surface-950/85 border-b border-surface-100 dark:border-surface-800/60"
    :aria-label="t('nav.aria')"
  >
    <div class="relative">
      <div
        ref="scrollRef"
        @scroll="updateScrollState"
        @pointerdown="onPointerDown"
        @click.capture="onClickCapture"
        class="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        :class="isDragging ? 'cursor-grabbing select-none' : hasOverflow && canHover ? 'cursor-grab' : ''"
        :style="maskImage ? { maskImage, WebkitMaskImage: maskImage } : undefined"
      >
        <button
          v-for="cat in categories"
          :key="cat.name"
          @click="jump(cat.name)"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors duration-150"
          :class="activeId === categoryAnchorId(cat.name)
            ? 'bg-accent-600 text-white dark:bg-accent-500'
            : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800'"
        >
          <DynamicIcon :icon="cat.icon" class="text-sm" />
          {{ catName(cat) }}
          <span class="text-[10px] opacity-70 tabular-nums">{{ cat.items.length }}</span>
        </button>
      </div>
      <button
        v-if="canHover && canScrollLeft"
        type="button"
        @click="scrollByPage(-1)"
        :aria-label="t('nav.scrollLeft')"
        :title="t('nav.scrollLeft')"
        class="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full flex items-center justify-center border border-surface-200/70 dark:border-surface-700/70 bg-surface-50/85 dark:bg-surface-900/85 backdrop-blur text-surface-500 dark:text-surface-300 shadow-sm hover:text-surface-700 dark:hover:text-surface-100 transition-colors"
      >
        <DynamicIcon icon="mdi:chevron-left" class="text-base" />
      </button>
      <button
        v-if="canHover && canScrollRight"
        type="button"
        @click="scrollByPage(1)"
        :aria-label="t('nav.scrollRight')"
        :title="t('nav.scrollRight')"
        class="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full flex items-center justify-center border border-surface-200/70 dark:border-surface-700/70 bg-surface-50/85 dark:bg-surface-900/85 backdrop-blur text-surface-500 dark:text-surface-300 shadow-sm hover:text-surface-700 dark:hover:text-surface-100 transition-colors"
      >
        <DynamicIcon icon="mdi:chevron-right" class="text-base" />
      </button>
    </div>
  </nav>
</template>

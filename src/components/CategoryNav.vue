<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import DynamicIcon from './DynamicIcon.vue'
import { categoryAnchorId } from '../utils/slug'
import type { NavCategory } from '../types'
import { useI18n } from '../i18n'
import { useHScroll } from '../composables/useHScroll'

const { t, catName, locale } = useI18n()

const props = defineProps<{
  categories: NavCategory[]
}>()

const activeId = ref('')
let observer: IntersectionObserver | null = null

// 横向滚动条隐藏后的可发现性口径走共用 composable useHScroll（与 SearchBar 引擎行同一实现，R66）；
// 本组件额外的横滚手段：按住拖动、两侧箭头按钮（见下）
const { scrollRef, canScrollLeft, canScrollRight, hasOverflow, maskImage, updateScrollState, refreshScrollState } = useHScroll()
const canHover = ref(false)
const isDragging = ref(false)

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
  canHover.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
})
watch(() => props.categories.map((c) => c.name).join('|'), () => {
  requestAnimationFrame(observeSections)
  refreshScrollState()
})
watch(locale, refreshScrollState)
onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('pointermove', onPointerMove)
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

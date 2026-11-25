<script setup lang="ts">
import { computed, ref, onBeforeUnmount, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import DynamicIcon from './DynamicIcon.vue'
import CategoryIconPicker from './CategoryIconPicker.vue'
import { categoryAnchorId } from '../utils/slug'
import { copyText } from '../utils/clipboard'
import type { NavCategory } from '../types'
import NavCard from './NavCard.vue'
import { useI18n } from '../i18n'

const { t, catName } = useI18n()

const props = defineProps<{
  category: NavCategory
  keyword?: string
  /** 传入时在标题栏右侧显示清除按钮（如最近访问的「清空」） */
  clearLabel?: string
  /** 键盘选中的卡片 key（`${分类名}:${url}`），命中者高亮 */
  activeKey?: string
  /** 视图：grid 网格 / list 列表 */
  viewMode?: 'grid' | 'list'
  /** 密度：comfortable 舒适 / compact 紧凑 */
  density?: 'comfortable' | 'compact'
  /** 是否折叠（搜索态由父级强制传 false） */
  collapsed?: boolean
  /** 是否可拖拽排序（收藏分组 / 纯自定义分类） */
  sortable?: boolean
  /** 自定义条目可跨分类拖拽移动（拖到其他分类上松手移动） */
  crossDraggable?: boolean
  /** 是否可更换分类图标（纯自定义分类） */
  customIconEditable?: boolean
  /** 本分类是否可拖拽重排（分类本身的顺序） */
  categorySortable?: boolean
  /** 本分类正在被拖拽重排 */
  categoryDragging?: boolean
  /** 是否显示置顶/隐藏按钮（普通分类、非搜索态） */
  pinnable?: boolean
  /** 本分类是否已置顶 */
  pinned?: boolean
}>()

const emit = defineEmits<{
  clear: []
  edit: [payload: { categoryName: string; item: NavItem }]
  remove: [payload: { categoryName: string; item: NavItem }]
  'context-menu': [payload: { item: NavItem; categoryName?: string; x: number; y: number }]
  'toggle-collapse': []
  reorder: [urls: string[]]
  'update-icon': [icon: string]
  'category-sort-start': []
  'category-sort-move': [delta: number]
  'toggle-pin': []
  'hide-category': []
  'move-item-to': [payload: { item: NavItem; targetAnchorId: string }]
}>()

// ==================== 分类重排（手柄：指针拖拽由父级统一处理，Alt+↑/↓ 键盘移动） ====================
function onCategoryHandlePointerDown(e: PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('category-sort-start')
}

function onCategoryHandleKeydown(e: KeyboardEvent) {
  if (!e.altKey) return
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    e.stopPropagation()
    emit('category-sort-move', e.key === 'ArrowUp' ? -1 : 1)
  }
}

// ==================== 分类图标更换（仅纯自定义分类） ====================
const iconPickerOpen = ref(false)
const iconPickerRef = ref<HTMLElement | null>(null)

function onDocPointerDown(e: PointerEvent) {
  if (iconPickerOpen.value && iconPickerRef.value && !iconPickerRef.value.contains(e.target as Node)) {
    iconPickerOpen.value = false
  }
}
function onDocKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') iconPickerOpen.value = false
}
onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
  document.addEventListener('keydown', onDocKeyDown)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
  document.removeEventListener('keydown', onDocKeyDown)
})

function onPickIcon(icon: string) {
  emit('update-icon', icon)
  iconPickerOpen.value = false
}

// ==================== 拖拽排序（指针事件，鼠标/触屏通用） ====================
const listRef = ref<HTMLElement | null>(null)
const draggingUrl = ref<string | null>(null)
const draggingItem = ref<NavItem | null>(null)

// ==================== 跨分类拖拽移动（仅自定义条目） ====================
import { useCustomData } from '../composables/useCustomData'
const { isCustomItem } = useCustomData()
let dropSectionEl: HTMLElement | null = null

function clearDropHighlight() {
  dropSectionEl?.classList.remove('morigo-drop-target')
  dropSectionEl = null
}

/** 拖拽点命中的其他分类 section（排除本分类），无则 null */
function dropSectionAt(x: number, y: number): HTMLElement | null {
  const section = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest(
    'section[id]'
  ) as HTMLElement | null
  if (!section || section.id === categoryId.value) return null
  return section
}

function updateDropHighlight(e: PointerEvent) {
  const item = draggingItem.value
  if (!item || !props.crossDraggable || !isCustomItem(props.category.name, item.url)) return
  const section = dropSectionAt(e.clientX, e.clientY)
  if (section === dropSectionEl) return
  clearDropHighlight()
  if (section) {
    section.classList.add('morigo-drop-target')
    dropSectionEl = section
  }
}

const hasCustomItems = computed(() =>
  props.category.items.some((i) => isCustomItem(props.category.name, i.url))
)

function currentUrls(): string[] {
  return props.category.items.map((i) => i.url)
}

/** 把 url 移到 target 之前/之后，返回新顺序（无变化返回 null） */
function movedOrder(url: string, targetUrl: string, after: boolean): string[] | null {
  const urls = currentUrls()
  const from = urls.indexOf(url)
  const to = urls.indexOf(targetUrl)
  if (from < 0 || to < 0 || from === to) return null
  urls.splice(from, 1)
  const insertAt = urls.indexOf(targetUrl) + (after ? 1 : 0)
  if (insertAt === from) return null
  urls.splice(insertAt, 0, url)
  return urls
}

function onPointerMove(e: PointerEvent) {
  updateDropHighlight(e)
  const url = draggingUrl.value
  const container = listRef.value
  if (!url || !container || !props.sortable) return
  const el = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest(
    '[data-sort-url]'
  ) as HTMLElement | null
  if (!el || !container.contains(el)) return
  const targetUrl = el.dataset.sortUrl
  if (!targetUrl || targetUrl === url) return
  const rect = el.getBoundingClientRect()
  // 网格多列时按水平中线判断，列表单列时按垂直中线判断
  const after =
    props.viewMode === 'list'
      ? e.clientY > rect.top + rect.height / 2
      : rect.width > 140
        ? e.clientX > rect.left + rect.width / 2
        : e.clientY > rect.top + rect.height / 2
  const next = movedOrder(url, targetUrl, after)
  if (next) emit('reorder', next)
}

function endDrag(e?: PointerEvent) {
  // 松手时若正悬停在其他分类上，发出跨分类移动（落点以松手坐标为准重算一次）
  const item = draggingItem.value
  if (e?.type === 'pointerup' && item && props.crossDraggable && isCustomItem(props.category.name, item.url)) {
    const section = dropSectionAt(e.clientX, e.clientY)
    if (section) emit('move-item-to', { item, targetAnchorId: section.id })
  }
  clearDropHighlight()
  draggingUrl.value = null
  draggingItem.value = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
}

function onSortStart(payload: { item: NavItem }) {
  draggingUrl.value = payload.item.url
  draggingItem.value = payload.item
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
}

function onSortMove(payload: { item: NavItem; delta: number }) {
  const urls = currentUrls()
  const idx = urls.indexOf(payload.item.url)
  const target = idx + payload.delta
  if (idx < 0 || target < 0 || target >= urls.length) return
  const next = [...urls]
  const [u] = next.splice(idx, 1)
  next.splice(target, 0, u)
  emit('reorder', next)
}

onBeforeUnmount(endDrag)

const containerClass = computed(() => {
  if (props.viewMode === 'list') {
    return props.density === 'compact' ? 'flex flex-col gap-1' : 'flex flex-col gap-1.5'
  }
  return props.density === 'compact'
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5'
})

import type { NavItem } from '../types'

const categoryId = computed(() => categoryAnchorId(props.category.name))

function copyAnchor(id: string) {
  const url = `${location.origin}${location.pathname}#${id}`
  // 统一走带 execCommand 兜底的复制工具（失败静默：锚点复制是次要动作）
  void copyText(url)
}
</script>

<template>
  <section :id="categoryId" :class="[collapsed ? 'mb-4 scroll-mt-28' : 'mb-9 scroll-mt-28', categoryDragging ? 'opacity-60' : '']">
    <div class="category-bar group/cat">
      <button
        v-if="categorySortable"
        type="button"
        class="p-0.5 -ml-1.5 rounded cursor-grab active:cursor-grabbing text-surface-300 dark:text-surface-600 hover:text-accent-500 transition-colors touch-none"
        :aria-label="t('section.moveCategory', { name: catName(category) })"
        :title="t('section.moveCategoryHint')"
        @pointerdown="onCategoryHandlePointerDown"
        @keydown="onCategoryHandleKeydown"
      >
        <Icon icon="mdi:drag-vertical" class="text-base block" />
      </button>
      <button
        type="button"
        class="p-0.5 -ml-1 rounded text-surface-300 dark:text-surface-600 hover:text-accent-500 transition-colors"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? t('section.expand', { name: catName(category) }) : t('section.collapse', { name: catName(category) })"
        :title="collapsed ? t('section.expandShort') : t('section.collapseShort')"
        @click="emit('toggle-collapse')"
      >
        <Icon :icon="collapsed ? 'mdi:chevron-right' : 'mdi:chevron-down'" class="text-base" />
      </button>
      <span v-if="customIconEditable" ref="iconPickerRef" class="relative inline-flex">
        <button
          type="button"
          class="inline-flex rounded p-0.5 -m-0.5 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          :aria-label="t('section.changeIcon')"
          :title="t('section.changeIcon')"
          :aria-expanded="iconPickerOpen"
          @click="iconPickerOpen = !iconPickerOpen"
        >
          <DynamicIcon :icon="category.icon" class="text-accent-500 dark:text-accent-400 text-base" />
        </button>
        <span
          v-if="iconPickerOpen"
          class="absolute left-0 top-full mt-1.5 z-50 block w-60 max-w-[78vw] p-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 shadow-xl"
        >
          <CategoryIconPicker :model-value="category.icon" @update:model-value="onPickIcon" />
        </span>
      </span>
      <DynamicIcon v-else :icon="category.icon" class="text-accent-500 dark:text-accent-400 text-base" />
      <a :href="'#' + categoryId" class="text-sm font-semibold text-surface-600 dark:text-surface-300 tracking-wide hover:text-accent-600 dark:hover:text-accent-400 transition-colors">
        {{ catName(category) }}
      </a>
      <span class="text-[10px] text-surface-300 dark:text-surface-600 tabular-nums">{{ category.items.length }}</span>
      <Icon v-if="pinned" icon="mdi:pin" class="text-xs text-accent-500" :title="t('section.pinnedTag')" />
      <span class="ml-auto flex items-center gap-2">
        <button
          v-if="pinnable"
          type="button"
          @click="emit('toggle-pin')"
          :class="['transition-all', pinned ? 'text-accent-500' : 'opacity-0 group-hover/cat:opacity-100 focus-visible:opacity-100 text-surface-300 dark:text-surface-600 hover:text-accent-500']"
          :title="pinned ? t('section.unpin') : t('section.pin')"
          :aria-label="pinned ? t('section.unpin') : t('section.pin')"
          :aria-pressed="pinned"
        >
          <Icon :icon="pinned ? 'mdi:pin-off-outline' : 'mdi:pin-outline'" class="text-sm" />
        </button>
        <button
          v-if="pinnable"
          type="button"
          @click="emit('hide-category')"
          class="opacity-0 group-hover/cat:opacity-100 focus-visible:opacity-100 text-surface-300 dark:text-surface-600 hover:text-accent-500 transition-all"
          :title="t('section.hide')"
          :aria-label="t('section.hide')"
        >
          <Icon icon="mdi:eye-off-outline" class="text-sm" />
        </button>
        <button
          v-if="clearLabel"
          @click="emit('clear')"
          class="text-[11px] text-surface-300 dark:text-surface-600 hover:text-accent-500 transition-colors"
        >
          {{ clearLabel }}
        </button>
        <button
          @click="copyAnchor(categoryId)"
          class="opacity-0 group-hover/cat:opacity-100 focus-visible:opacity-100 text-surface-300 dark:text-surface-600 hover:text-accent-500 transition-all"
          :title="t('section.copyAnchor')"
          :aria-label="t('section.copyAnchor')"
        >
          <Icon icon="mdi:link-variant" class="text-sm" />
        </button>
      </span>
    </div>
    <div v-if="!collapsed" ref="listRef" :class="containerClass">
      <NavCard
        v-for="(item, idx) in category.items"
        :key="item.url"
        :item="item"
        :keyword="keyword"
        :index="idx"
        :category-name="category.name"
        :layout="viewMode ?? 'grid'"
        :density="density ?? 'comfortable'"
        :active="activeKey === `${category.name}:${item.url}`"
        :sortable="sortable"
        :cross-draggable="crossDraggable"
        :dragging="draggingUrl === item.url"
        @edit="emit('edit', $event)"
        @remove="emit('remove', $event)"
        @context-menu="emit('context-menu', $event)"
        @sort-start="onSortStart"
        @sort-move="onSortMove"
      />
    </div>
    <p v-if="sortable && !collapsed" class="mt-1.5 text-[10px] text-surface-300 dark:text-surface-600">{{ t('section.sortHint') }}</p>
    <p v-else-if="crossDraggable && hasCustomItems && !collapsed" class="mt-1.5 text-[10px] text-surface-300 dark:text-surface-600">{{ t('section.crossHint') }}</p>
  </section>
</template>

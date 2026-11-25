<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import type { NavItem } from '../types'
import { useI18n } from '../i18n'

const { t } = useI18n()

export interface ContextMenuState {
  item: NavItem
  categoryName?: string
  isCustom: boolean
  favorited: boolean
  x: number
  y: number
}

const props = defineProps<{
  state: ContextMenuState | null
  /** 可移动到的目标分类名（仅自定义条目用，排除当前分类） */
  moveTargets: { name: string; displayName: string }[]
}>()

const emit = defineEmits<{
  close: []
  open: [item: NavItem]
  copy: [item: NavItem]
  toggleFavorite: [item: NavItem]
  edit: [payload: { categoryName: string; item: NavItem }]
  remove: [payload: { categoryName: string; item: NavItem }]
  move: [payload: { categoryName: string; item: NavItem; target: string }]
}>()

const menuRef = ref<HTMLElement | null>(null)
const pos = ref({ left: 0, top: 0 })
const moveOpen = ref(false)

const item = computed(() => props.state?.item ?? null)

/** 打开后量菜单尺寸，把位置夹进视口（留 8px 边距） */
async function place() {
  if (!props.state) return
  pos.value = { left: props.state.x, top: props.state.y }
  await nextTick()
  const el = menuRef.value
  if (!el || !props.state) return
  const rect = el.getBoundingClientRect()
  pos.value = {
    left: Math.max(8, Math.min(props.state.x, window.innerWidth - rect.width - 8)),
    top: Math.max(8, Math.min(props.state.y, window.innerHeight - rect.height - 8)),
  }
}

watch(
  () => props.state,
  (s) => {
    moveOpen.value = false
    if (s) {
      void place().then(() => {
        // 打开后聚焦首个菜单项，键盘流可直接 ↑↓/Enter
        menuRef.value?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
      })
    }
  }
)

// 「移动到分类」展开/收起会改变菜单高度，须重新夹位，否则菜单底部会溢出视口
watch(moveOpen, () => {
  if (props.state) void place()
})

function onDocPointerDown(e: PointerEvent) {
  if (props.state && menuRef.value && !menuRef.value.contains(e.target as Node)) emit('close')
}
function onDocKeyDown(e: KeyboardEvent) {
  if (!props.state) return
  if (e.key === 'Escape') {
    e.stopPropagation()
    emit('close')
    return
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const items = [...(menuRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
    if (!items.length) return
    const idx = items.indexOf(document.activeElement as HTMLElement)
    const next = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length
    items[next]?.focus()
  }
}
function onScrollOrResize(e: Event) {
  if (!props.state) return
  // 菜单内部滚动（移动目标列表、菜单本体限高滚动）不算页面滚动，不能把菜单关掉，
  // 否则折叠线以下的目标分类永远点不到
  if (e.type === 'scroll' && menuRef.value) {
    const target = e.target as Node | null
    if (target && (target === menuRef.value || menuRef.value.contains(target))) return
  }
  emit('close')
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true)
  document.addEventListener('keydown', onDocKeyDown, true)
  window.addEventListener('resize', onScrollOrResize)
  window.addEventListener('scroll', onScrollOrResize, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  document.removeEventListener('keydown', onDocKeyDown, true)
  window.removeEventListener('resize', onScrollOrResize)
  window.removeEventListener('scroll', onScrollOrResize, true)
})

const btnClass =
  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-surface-600 dark:text-surface-300 hover:bg-accent-50 dark:hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-400 focus-visible:bg-accent-50 dark:focus-visible:bg-accent-500/10 outline-none transition-colors'
</script>

<template>
  <div
    v-if="state && item"
    ref="menuRef"
    role="menu"
    :aria-label="t('card.menuAria', { name: item.title })"
    class="float-panel fixed z-[70] w-56 max-w-[calc(100vw-16px)] max-h-[calc(100dvh-16px)] overflow-y-auto py-1.5 rounded-xl bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 shadow-xl"
    :style="{ left: `${pos.left}px`, top: `${pos.top}px` }"
  >
    <p class="px-3 pt-1 pb-1.5 text-[11px] font-medium text-surface-400 dark:text-surface-500 truncate">{{ item.title }}</p>
    <button type="button" role="menuitem" :class="btnClass" @click="emit('open', item)">
      <Icon icon="mdi:open-in-new" class="text-sm shrink-0" />
      {{ t('card.open') }}
    </button>
    <button type="button" role="menuitem" :class="btnClass" @click="emit('copy', item)">
      <Icon icon="mdi:content-copy" class="text-sm shrink-0" />
      {{ t('card.copy') }}
    </button>
    <button type="button" role="menuitem" :class="btnClass" @click="emit('toggleFavorite', item)">
      <Icon :icon="state.favorited ? 'mdi:star-off-outline' : 'mdi:star-outline'" class="text-sm shrink-0" />
      {{ state.favorited ? t('card.unfav') : t('card.fav') }}
    </button>
    <template v-if="state.isCustom && state.categoryName">
      <div class="my-1.5 border-t border-surface-100 dark:border-surface-800" />
      <button type="button" role="menuitem" :class="btnClass" @click="emit('edit', { categoryName: state.categoryName, item })">
        <Icon icon="mdi:lead-pencil" class="text-sm shrink-0" />
        {{ t('card.edit') }}
      </button>
      <template v-if="moveTargets.length">
        <button
          type="button"
          role="menuitem"
          :class="btnClass"
          :aria-expanded="moveOpen"
          @click="moveOpen = !moveOpen"
        >
          <Icon icon="mdi:folder-move-outline" class="text-sm shrink-0" />
          {{ t('card.moveTo') }}
          <Icon :icon="moveOpen ? 'mdi:chevron-down' : 'mdi:chevron-right'" class="text-sm ml-auto shrink-0" />
        </button>
        <div v-if="moveOpen" class="max-h-44 overflow-y-auto py-0.5">
          <button
            v-for="target in moveTargets"
            :key="target.name"
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2 pl-9 pr-3 py-1.5 text-left text-xs text-surface-500 dark:text-surface-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-400 focus-visible:bg-accent-50 dark:focus-visible:bg-accent-500/10 outline-none transition-colors"
            @click="emit('move', { categoryName: state.categoryName, item, target: target.name })"
          >
            <span class="truncate">{{ target.displayName }}</span>
          </button>
        </div>
      </template>
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 focus-visible:bg-red-50 dark:focus-visible:bg-red-500/10 outline-none transition-colors"
        @click="emit('remove', { categoryName: state.categoryName, item })"
      >
        <Icon icon="mdi:trash-can-outline" class="text-sm shrink-0" />
        {{ t('card.delete') }}
      </button>
    </template>
  </div>
</template>

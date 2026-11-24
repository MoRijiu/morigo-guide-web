<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import DynamicIcon from './DynamicIcon.vue'
import { categoryAnchorId } from '../utils/slug'
import type { NavCategory } from '../types'
import NavCard from './NavCard.vue'
import { useI18n } from '../i18n'

const { t } = useI18n()

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
}>()

const emit = defineEmits<{
  clear: []
  edit: [payload: { categoryName: string; item: NavItem }]
  remove: [payload: { categoryName: string; item: NavItem }]
  'toggle-collapse': []
}>()

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
  navigator.clipboard.writeText(url)
}
</script>

<template>
  <section :id="categoryId" :class="collapsed ? 'mb-4 scroll-mt-28' : 'mb-9 scroll-mt-28'">
    <div class="category-bar group/cat">
      <button
        type="button"
        class="p-0.5 -ml-1 rounded text-surface-300 dark:text-surface-600 hover:text-accent-500 transition-colors"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? t('section.expand', { name: category.name }) : t('section.collapse', { name: category.name })"
        :title="collapsed ? t('section.expandShort') : t('section.collapseShort')"
        @click="emit('toggle-collapse')"
      >
        <Icon :icon="collapsed ? 'mdi:chevron-right' : 'mdi:chevron-down'" class="text-base" />
      </button>
      <DynamicIcon :icon="category.icon" class="text-accent-500 dark:text-accent-400 text-base" />
      <a :href="'#' + categoryId" class="text-sm font-semibold text-surface-600 dark:text-surface-300 tracking-wide hover:text-accent-600 dark:hover:text-accent-400 transition-colors">
        {{ category.name }}
      </a>
      <span class="text-[10px] text-surface-300 dark:text-surface-600 tabular-nums">{{ category.items.length }}</span>
      <span class="ml-auto flex items-center gap-2">
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
    <div v-if="!collapsed" :class="containerClass">
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
        @edit="emit('edit', $event)"
        @remove="emit('remove', $event)"
      />
    </div>
  </section>
</template>

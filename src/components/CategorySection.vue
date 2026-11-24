<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import DynamicIcon from './DynamicIcon.vue'
import { categoryAnchorId } from '../utils/slug'
import type { NavCategory } from '../types'
import NavCard from './NavCard.vue'

const props = defineProps<{
  category: NavCategory
  keyword?: string
  /** 传入时在标题栏右侧显示清除按钮（如最近访问的「清空」） */
  clearLabel?: string
  /** 键盘选中的卡片 key（`${分类名}:${url}`），命中者高亮 */
  activeKey?: string
}>()

const emit = defineEmits<{ clear: [] }>()

const categoryId = computed(() => categoryAnchorId(props.category.name))

function copyAnchor(id: string) {
  const url = `${location.origin}${location.pathname}#${id}`
  navigator.clipboard.writeText(url)
}
</script>

<template>
  <section :id="categoryId" class="mb-9 scroll-mt-28">
    <div class="category-bar group/cat">
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
          title="复制锚点链接"
          aria-label="复制锚点链接"
        >
          <Icon icon="mdi:link-variant" class="text-sm" />
        </button>
      </span>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
      <NavCard
        v-for="(item, idx) in category.items"
        :key="item.url"
        :item="item"
        :keyword="keyword"
        :index="idx"
        :active="activeKey === `${category.name}:${item.url}`"
      />
    </div>
  </section>
</template>

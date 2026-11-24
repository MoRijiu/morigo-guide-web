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
}>()

const categoryId = computed(() => categoryAnchorId(props.category.name))

function copyAnchor(id: string) {
  const url = `${location.origin}${location.pathname}#${id}`
  navigator.clipboard.writeText(url)
}
</script>

<template>
  <section :id="categoryId" class="mb-9 scroll-mt-20">
    <div class="category-bar group/cat">
      <DynamicIcon :icon="category.icon" class="text-accent-500 dark:text-accent-400 text-base" />
      <a :href="'#' + categoryId" class="text-sm font-semibold text-surface-600 dark:text-surface-300 tracking-wide hover:text-accent-600 dark:hover:text-accent-400 transition-colors">
        {{ category.name }}
      </a>
      <span class="text-[10px] text-surface-300 dark:text-surface-600 tabular-nums">{{ category.items.length }}</span>
      <button
        @click="copyAnchor(categoryId)"
        class="opacity-0 group-hover/cat:opacity-100 ml-auto text-surface-300 dark:text-surface-600 hover:text-accent-500 transition-all"
        title="复制锚点链接"
      >
        <Icon icon="mdi:link-variant" class="text-sm" />
      </button>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
      <NavCard v-for="item in category.items" :key="item.url" :item="item" :keyword="keyword" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import DynamicIcon from './DynamicIcon.vue'
import { categoryAnchorId } from '../utils/slug'
import type { NavCategory } from '../types'
import { useI18n } from '../i18n'

const { t, catName } = useI18n()

const props = defineProps<{
  categories: NavCategory[]
}>()

const activeId = ref('')
let observer: IntersectionObserver | null = null

// 横向滚动条隐藏（与 SearchBar 引擎行同一口径）；右侧还有内容时用 mask 渐隐提示可继续滑
const scrollRef = ref<HTMLElement | null>(null)
const canScrollRight = ref(false)
function updateFade() {
  const el = scrollRef.value
  canScrollRight.value = !!el && el.scrollWidth - el.clientWidth - el.scrollLeft > 4
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
  updateFade()
  window.addEventListener('resize', updateFade)
})
watch(() => props.categories.map((c) => c.name).join('|'), () => {
  requestAnimationFrame(observeSections)
  nextTick(updateFade)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', updateFade)
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
    <div
      ref="scrollRef"
      @scroll="updateFade"
      class="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      :class="canScrollRight && '[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)]'"
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
  </nav>
</template>

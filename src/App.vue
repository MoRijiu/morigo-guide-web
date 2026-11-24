<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import DynamicIcon from './components/DynamicIcon.vue'
import NavHeader from './components/NavHeader.vue'
import SearchBar from './components/SearchBar.vue'
import CategorySection from './components/CategorySection.vue'
import CategoryNav from './components/CategoryNav.vue'
import NavCard from './components/NavCard.vue'
import BackToTop from './components/BackToTop.vue'
import siteConfig from './config/site'
import { APP_VERSION_LABEL } from './version'
import { useUserData } from './composables/useUserData'
import type { NavItem, NavCategory } from './types'

const keyword = ref('')
const trimmedKeyword = computed(() => keyword.value.trim())

function matches(item: NavItem, k: string): boolean {
  const needle = k.toLowerCase()
  return (
    item.title.toLowerCase().includes(needle) ||
    item.description.toLowerCase().includes(needle) ||
    item.url.toLowerCase().includes(needle) ||
    (item.aliases ?? []).some((a) => a.toLowerCase().includes(needle))
  )
}

const filteredCategories = computed(() => {
  const data = siteConfig.navigation
  if (!trimmedKeyword.value) return data

  return data
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => matches(item, trimmedKeyword.value)),
    }))
    .filter((cat) => cat.items.length > 0)
})

const resultCount = computed(() =>
  filteredCategories.value.reduce((sum, cat) => sum + cat.items.length, 0)
)

const { favorites, recent, clearRecent } = useUserData()

const itemByUrl = computed(() => {
  const map = new Map<string, NavItem>()
  for (const cat of siteConfig.navigation) {
    for (const item of cat.items) map.set(item.url, item)
  }
  return map
})

function pickItems(urls: string[]): NavItem[] {
  return urls
    .map((u) => itemByUrl.value.get(u))
    .filter((x): x is NavItem => Boolean(x))
}

/** 无搜索词时置顶的个人分组：我的收藏、最近访问（为空则不出现） */
const personalCategories = computed<NavCategory[]>(() => {
  const cats: NavCategory[] = []
  const favItems = pickItems(favorites.value)
  if (favItems.length) cats.push({ name: '我的收藏', icon: 'mdi:star', items: favItems })
  const recentItems = pickItems(recent.value)
  if (recentItems.length) cats.push({ name: '最近访问', icon: 'mdi:history', items: recentItems })
  return cats
})

const displayCategories = computed<NavCategory[]>(() =>
  trimmedKeyword.value
    ? filteredCategories.value
    : [...personalCategories.value, ...filteredCategories.value]
)

const externalEngines = computed(() =>
  siteConfig.search.engines.filter((e) => e.key !== 'site' && e.url)
)

const totalCount = computed(
  () => siteConfig.navigation.reduce((sum, cat) => sum + cat.items.length, 0)
)

const hotItems = computed<NavItem[]>(() =>
  siteConfig.navigation.flatMap((cat) => cat.items).filter((item) => item.hot)
)

function onSearch(val: string) {
  keyword.value = val
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950">
    <NavHeader />

    <div class="pt-9 pb-6 px-5 text-center">
      <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-surface-800 dark:text-surface-100 mb-1.5 flex items-center justify-center gap-2">
        <DynamicIcon :icon="siteConfig.logoIcon" class="text-accent-500 dark:text-accent-400" />
        {{ siteConfig.title }}<span class="text-accent-600 dark:text-accent-400">{{ siteConfig.titleHighlight }}</span>
      </h2>
      <p class="text-surface-400 dark:text-surface-500 text-xs mb-5">{{ siteConfig.tagline }} · 共 {{ totalCount }} 个站点</p>
      <SearchBar v-if="siteConfig.search.enabled" @search="onSearch" />
    </div>

    <main class="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 pb-14">
      <CategoryNav :categories="displayCategories" />

      <p v-if="trimmedKeyword && filteredCategories.length" class="text-xs text-surface-400 dark:text-surface-500 mb-5">
        找到 <span class="text-accent-600 dark:text-accent-400 font-medium">{{ resultCount }}</span> 个与「{{ trimmedKeyword }}」相关的导航
      </p>

      <template v-if="displayCategories.length">
        <CategorySection
          v-for="category in displayCategories"
          :key="category.name"
          :category="category"
          :keyword="trimmedKeyword"
          :clear-label="!trimmedKeyword && category.name === '最近访问' ? '清空' : undefined"
          @clear="clearRecent"
        />
      </template>

      <div v-else class="py-14">
        <div class="text-center mb-8">
          <Icon icon="mdi:compass-off-outline" class="text-4xl text-surface-300 dark:text-surface-600 mb-3" />
          <p class="text-sm text-surface-500 dark:text-surface-400">
            站内没有找到「<span class="font-medium text-surface-700 dark:text-surface-200">{{ trimmedKeyword }}</span>」
          </p>
          <p class="text-xs text-surface-400 dark:text-surface-500 mt-1.5">换个关键词，或者直接去外部搜：</p>
          <div class="flex items-center justify-center gap-2 mt-4">
            <a
              v-for="engine in externalEngines"
              :key="engine.key"
              :href="engine.url + encodeURIComponent(trimmedKeyword)"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
            >
              <DynamicIcon :icon="engine.icon" class="text-sm" />
              用{{ engine.label }}搜
            </a>
          </div>
        </div>

        <div v-if="hotItems.length">
          <p class="text-xs font-medium text-surface-400 dark:text-surface-500 mb-3 flex items-center gap-1.5">
            <Icon icon="mdi:fire" class="text-sm text-accent-500" />
            热门推荐
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <NavCard v-for="(item, idx) in hotItems" :key="item.url" :item="item" :index="idx" />
          </div>
        </div>
      </div>
    </main>

    <footer class="border-t border-surface-100 dark:border-surface-800/60 py-5">
      <div class="max-w-6xl mx-auto px-5 sm:px-8 flex items-center justify-between text-[11px] text-surface-300 dark:text-surface-600">
        <span class="flex items-center gap-1">
          <DynamicIcon :icon="siteConfig.logoIcon" class="text-xs text-accent-500/50" />
          &copy; {{ new Date().getFullYear() }} {{ siteConfig.title }}{{ siteConfig.titleHighlight }}
        </span>
        <span class="flex items-center gap-3">
          <span>{{ APP_VERSION_LABEL }}</span>
          <a :href="siteConfig.domainUrl" class="hover:text-surface-500 dark:hover:text-surface-400 transition-colors">{{ siteConfig.domain }}</a>
        </span>
      </div>
    </footer>

    <BackToTop />
  </div>
</template>

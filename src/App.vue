<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
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
import { useCustomData } from './composables/useCustomData'
import { useViewPrefs } from './composables/useViewPrefs'
import { useSearchExtras, buildSearchUrl } from './composables/useSearchExtras'
import SiteFormModal from './components/SiteFormModal.vue'
import DataTransfer from './components/DataTransfer.vue'
import ThemePanel from './components/ThemePanel.vue'
import { useThemePrefs } from './composables/useThemePrefs'
import CommandPalette, { type PaletteEntry } from './components/CommandPalette.vue'
import { usePwa } from './composables/usePwa'
import { categoryAnchorId } from './utils/slug'
import { buildBackup, downloadBackup } from './utils/dataTransfer'
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

const { customCategories, addItem, updateItem, removeItem } = useCustomData()
const customCategoriesRef = customCategories

/**
 * 展示用全量分类：自定义分类并入——同名分类追加到默认分类末尾，
 * 新分类排在默认分类之前（紧随个人分组），让用户自己的东西先被看到。
 */
const mergedCategories = computed<NavCategory[]>(() => {
  const defaults = siteConfig.navigation.map((c) => ({ ...c, items: [...c.items] }))
  const own: NavCategory[] = []
  for (const cat of customCategories.value) {
    const target = defaults.find((c) => c.name === cat.name)
    if (target) target.items = [...target.items, ...cat.items]
    else own.push({ ...cat, items: [...cat.items] })
  }
  return [...own, ...defaults]
})

const filteredCategories = computed(() => {
  const data = mergedCategories.value
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

const { favorites, recent, clearRecent, recordVisit } = useUserData()

// ==================== 视图与布局 ====================
const { view, density, setView, setDensity, isCollapsed, toggleCollapsed, setAllCollapsed } =
  useViewPrefs()

const allCollapsed = computed(
  () =>
    displayCategories.value.length > 0 &&
    displayCategories.value.every((c) => isCollapsed(c.name))
)

function toggleAllCollapsed() {
  setAllCollapsed(
    displayCategories.value.map((c) => c.name),
    !allCollapsed.value
  )
}

const itemByUrl = computed(() => {
  const map = new Map<string, NavItem>()
  for (const cat of mergedCategories.value) {
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

const { canInstall, isOnline, promptInstall } = usePwa()

const { customEngines, suggestionsOpen } = useSearchExtras()
const { cycleAccent } = useThemePrefs()

const externalEngines = computed(() => [
  ...siteConfig.search.engines.filter((e) => e.key !== 'site' && e.url),
  ...customEngines.value,
])

/** 建议下拉用：全量站点（按 url 去重）与热门词 */
const allItems = computed<NavItem[]>(() => {
  const seen = new Set<string>()
  const list: NavItem[] = []
  for (const cat of mergedCategories.value) {
    for (const item of cat.items) {
      if (seen.has(item.url)) continue
      seen.add(item.url)
      list.push(item)
    }
  }
  return list
})

const hotTerms = computed<string[]>(() => hotItems.value.map((i) => i.title))

const totalCount = computed(
  () => mergedCategories.value.reduce((sum, cat) => sum + cat.items.length, 0)
)

const hotItems = computed<NavItem[]>(() =>
  mergedCategories.value.flatMap((cat) => cat.items).filter((item) => item.hot)
)

// ==================== 自定义站点 ====================
const formOpen = ref(false)
const formInitial = ref<{ categoryName: string; item: NavItem } | null>(null)

const allCategoryNames = computed(() => mergedCategories.value.map((c) => c.name))

function openAddForm() {
  formInitial.value = null
  formOpen.value = true
}

function openEditForm(payload: { categoryName: string; item: NavItem }) {
  formInitial.value = payload
  formOpen.value = true
}

function onFormSave(payload: { categoryName: string; item: NavItem }) {
  if (formInitial.value) {
    updateItem(
      formInitial.value.categoryName,
      formInitial.value.item.url,
      payload.categoryName,
      payload.item
    )
  } else {
    addItem(payload.categoryName, payload.item)
  }
  formOpen.value = false
}

function onRemoveItem(payload: { categoryName: string; item: NavItem }) {
  if (window.confirm(`删除站点「${payload.item.title}」？`)) {
    removeItem(payload.categoryName, payload.item.url)
  }
}

function onSearch(val: string) {
  keyword.value = val
}

/** 建议下拉里的站点直达：记最近访问并打开 */
function onOpenItem(item: NavItem) {
  recordVisit(item.url)
  window.open(item.url, '_blank', 'noopener')
}

// ==================== 键盘流 ====================
const searchBarRef = ref<InstanceType<typeof SearchBar> | null>(null)
const activeIndex = ref(-1)

/** 当前可见卡片按展示顺序拉平（同 url 只取首次出现，与高亮 key 对齐） */
const flatNav = computed(() => {
  const seen = new Set<string>()
  const list: { key: string; item: NavItem }[] = []
  for (const cat of displayCategories.value) {
    // 折叠的分类卡片不在页面上，键盘选择跳过（搜索态不折叠，无需判断）
    if (!trimmedKeyword.value && isCollapsed(cat.name)) continue
    for (const item of cat.items) {
      if (seen.has(item.url)) continue
      seen.add(item.url)
      list.push({ key: `${cat.name}:${item.url}`, item })
    }
  }
  return list
})

const activeKey = computed(() =>
  activeIndex.value >= 0 ? flatNav.value[activeIndex.value]?.key : undefined
)

// 搜索词变化即取消键盘选中，避免高亮落到已过滤掉的卡片上
watch(trimmedKeyword, () => {
  activeIndex.value = -1
})

function isEditableTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null
  if (!t) return false
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable
}

function onGlobalKeydown(e: KeyboardEvent) {
  // Ctrl/⌘+K 呼出/关闭命令面板（优先于其他快捷键处理）
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    paletteOpen.value = !paletteOpen.value
    return
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return

  // 「/」在非输入状态下聚焦搜索框
  if (e.key === '/' && !isEditableTarget(e)) {
    e.preventDefault()
    searchBarRef.value?.focusInput()
    return
  }

  const fromSearch = (e.target as HTMLElement | null)?.id === 'morigo-search-input'
  // 搜索建议下拉打开时，方向键/回车归 SearchBar 处理
  if (fromSearch && suggestionsOpen.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) return
  if (!fromSearch && activeIndex.value < 0) return
  if (!flatNav.value.length) return

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const delta = e.key === 'ArrowDown' ? 1 : -1
    const next = activeIndex.value + delta
    activeIndex.value = Math.max(0, Math.min(next, flatNav.value.length - 1))
  } else if (e.key === 'Enter' && activeIndex.value >= 0) {
    // 捕获阶段拦截，避免搜索框自身的 Enter 处理（外部引擎跳转）同时触发
    e.preventDefault()
    e.stopPropagation()
    const target = flatNav.value[activeIndex.value]
    if (target) {
      recordVisit(target.item.url)
      window.open(target.item.url, '_blank', 'noopener')
    }
  } else if (e.key === 'Escape' && activeIndex.value >= 0 && !fromSearch) {
    activeIndex.value = -1
  }
}

// ==================== 命令面板 ====================
const paletteOpen = ref(false)

const paletteEntries = computed<PaletteEntry[]>(() => {
  const actions: PaletteEntry[] = [
    { kind: 'action', id: 'action:theme', title: '切换深色 / 浅色模式', icon: 'mdi:theme-light-dark', actionId: 'toggle-theme' },
    { kind: 'action', id: 'action:add', title: '添加自定义站点', icon: 'mdi:plus', actionId: 'add-site' },
    { kind: 'action', id: 'action:export', title: '导出备份 JSON', hint: '自定义站点 + 收藏 + 最近访问', icon: 'mdi:download', actionId: 'export-backup' },
    { kind: 'action', id: 'action:top', title: '回到顶部', icon: 'mdi:arrow-up', actionId: 'back-to-top' },
    { kind: 'action', id: 'action:view', title: '切换网格 / 列表视图', icon: 'mdi:view-grid-outline', actionId: 'toggle-view' },
    { kind: 'action', id: 'action:accent', title: '切换强调色', hint: '紫罗兰 / 湖蓝 / 晴空 / 翠绿 / 琥珀 / 玫红', icon: 'mdi:palette-outline', actionId: 'cycle-accent' },
    ...(canInstall.value
      ? [{ kind: 'action', id: 'action:install', title: '安装应用（PWA）', hint: '装到桌面/主屏幕，离线可用', icon: 'mdi:download', actionId: 'install-app' } as PaletteEntry]
      : []),
  ]
  const sites: PaletteEntry[] = []
  const seen = new Set<string>()
  for (const cat of displayCategories.value) {
    for (const item of cat.items) {
      if (seen.has(item.url)) continue
      seen.add(item.url)
      sites.push({
        kind: 'site',
        id: `site:${item.url}`,
        title: item.title,
        hint: item.description,
        icon: item.icon,
        item,
        categoryName: cat.name,
      })
    }
  }
  const hot = sites.filter((s) => s.item?.hot)
  const rest = sites.filter((s) => !s.item?.hot)
  const categories: PaletteEntry[] = displayCategories.value.map((cat) => ({
    kind: 'category',
    id: `cat:${cat.name}`,
    title: `跳到「${cat.name}」`,
    hint: `${cat.items.length} 个站点`,
    icon: cat.icon,
    categoryName: cat.name,
  }))
  return [...actions, ...hot, ...categories, ...rest]
})

async function scrollToCategory(name: string) {
  // 目标分类若被折叠，先展开再滚动（等 v-if 渲染完成）
  if (isCollapsed(name)) {
    toggleCollapsed(name)
    await nextTick()
  }
  document
    .getElementById(categoryAnchorId(name))
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function onPalettePick(entry: PaletteEntry) {
  paletteOpen.value = false
  if (entry.kind === 'site' && entry.item) {
    recordVisit(entry.item.url)
    window.open(entry.item.url, '_blank', 'noopener')
    return
  }
  if (entry.kind === 'category' && entry.categoryName) {
    if (trimmedKeyword.value) {
      keyword.value = ''
      await nextTick()
    }
    scrollToCategory(entry.categoryName)
    return
  }
  if (entry.kind === 'action') {
    if (entry.actionId === 'toggle-theme') {
      window.dispatchEvent(new Event('morigo:toggle-theme'))
    } else if (entry.actionId === 'add-site') {
      openAddForm()
    } else if (entry.actionId === 'export-backup') {
      downloadBackup(buildBackup(customCategoriesRef.value, favorites.value, recent.value))
    } else if (entry.actionId === 'back-to-top') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (entry.actionId === 'toggle-view') {
      setView(view.value === 'grid' ? 'list' : 'grid')
    } else if (entry.actionId === 'cycle-accent') {
      cycleAccent()
    } else if (entry.actionId === 'install-app') {
      void promptInstall()
    }
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown, true))
</script>

<template>
  <!-- 底色由 body 提供（style.css），此处不设不透明背景，否则会盖住主题背景渐变层 -->
  <div class="min-h-screen flex flex-col">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-3 focus:py-1.5 focus:rounded-md focus:bg-accent-600 focus:text-white focus:text-xs"
    >跳到导航内容</a>
    <NavHeader />

    <div class="pt-9 pb-6 px-5 text-center">
      <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-surface-800 dark:text-surface-100 mb-1.5 flex items-center justify-center gap-2">
        <DynamicIcon :icon="siteConfig.logoIcon" class="text-accent-500 dark:text-accent-400" />
        {{ siteConfig.title }}<span class="text-accent-600 dark:text-accent-400">{{ siteConfig.titleHighlight }}</span>
      </h2>
      <p class="text-surface-400 dark:text-surface-500 text-xs mb-5">{{ siteConfig.tagline }} · 共 {{ totalCount }} 个站点</p>
      <SearchBar v-if="siteConfig.search.enabled" ref="searchBarRef" :items="allItems" :hot-terms="hotTerms" @search="onSearch" @open-item="onOpenItem" />
    </div>

    <main id="main-content" class="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 pb-14">
      <div v-if="!trimmedKeyword" class="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 mb-3 -mt-1">
        <span class="hidden sm:inline text-[11px] text-surface-300 dark:text-surface-600">自定义站点保存在本机浏览器</span>
        <button
          type="button"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
          @click="paletteOpen = true"
        >
          <Icon icon="mdi:apple-keyboard-command" class="text-sm" />
          命令面板
          <kbd class="kbd-hint hidden md:inline">⌘K</kbd>
        </button>
        <button
          type="button"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
          @click="openAddForm"
        >
          <Icon icon="mdi:plus" class="text-sm" />
          添加站点
        </button>
        <button
          v-if="canInstall"
          type="button"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
          @click="promptInstall"
        >
          <Icon icon="mdi:download" class="text-sm" />
          安装应用
        </button>
        <DataTransfer />
        <ThemePanel />
        <span class="hidden sm:block w-px h-4 bg-surface-200 dark:bg-surface-700" aria-hidden="true" />
        <div class="flex items-center rounded-md border border-surface-200 dark:border-surface-700 overflow-hidden" role="group" aria-label="视图切换">
          <button
            type="button"
            title="网格视图"
            aria-label="网格视图"
            :aria-pressed="view === 'grid'"
            :class="['p-1.5 transition-colors', view === 'grid' ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400' : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300']"
            @click="setView('grid')"
          >
            <Icon icon="mdi:view-grid-outline" class="text-sm block" />
          </button>
          <button
            type="button"
            title="列表视图"
            aria-label="列表视图"
            :aria-pressed="view === 'list'"
            :class="['p-1.5 transition-colors', view === 'list' ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400' : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300']"
            @click="setView('list')"
          >
            <Icon icon="mdi:view-list-outline" class="text-sm block" />
          </button>
        </div>
        <div class="flex items-center rounded-md border border-surface-200 dark:border-surface-700 overflow-hidden" role="group" aria-label="密度切换">
          <button
            type="button"
            title="舒适密度"
            aria-label="舒适密度"
            :aria-pressed="density === 'comfortable'"
            :class="['p-1.5 transition-colors', density === 'comfortable' ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400' : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300']"
            @click="setDensity('comfortable')"
          >
            <Icon icon="mdi:arrow-expand-vertical" class="text-sm block" />
          </button>
          <button
            type="button"
            title="紧凑密度"
            aria-label="紧凑密度"
            :aria-pressed="density === 'compact'"
            :class="['p-1.5 transition-colors', density === 'compact' ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400' : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300']"
            @click="setDensity('compact')"
          >
            <Icon icon="mdi:arrow-collapse-vertical" class="text-sm block" />
          </button>
        </div>
        <button
          type="button"
          class="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-surface-400 dark:text-surface-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
          @click="toggleAllCollapsed"
        >
          {{ allCollapsed ? '展开全部' : '折叠全部' }}
        </button>
      </div>
      <CategoryNav :categories="displayCategories" />

      <p v-if="trimmedKeyword && filteredCategories.length" class="text-xs text-surface-400 dark:text-surface-500 mb-5 flex items-center justify-between gap-3">
        <span>找到 <span class="text-accent-600 dark:text-accent-400 font-medium">{{ resultCount }}</span> 个与「{{ trimmedKeyword }}」相关的导航</span>
        <span class="hidden md:inline text-surface-300 dark:text-surface-600">↑↓ 选择 · Enter 打开</span>
      </p>

      <template v-if="displayCategories.length">
        <CategorySection
          v-for="category in displayCategories"
          :key="category.name"
          :category="category"
          :keyword="trimmedKeyword"
          :clear-label="!trimmedKeyword && category.name === '最近访问' ? '清空' : undefined"
          :active-key="activeKey"
          :view-mode="view"
          :density="density"
          :collapsed="!trimmedKeyword && isCollapsed(category.name)"
          @toggle-collapse="toggleCollapsed(category.name)"
          @clear="clearRecent"
          @edit="openEditForm"
          @remove="onRemoveItem"
        />
      </template>

      <div v-else class="py-14">
        <div class="text-center mb-8">
          <Icon icon="mdi:compass-off-outline" class="text-4xl text-surface-300 dark:text-surface-600 mb-3" />
          <p class="text-sm text-surface-500 dark:text-surface-400">
            站内没有找到「<span class="font-medium text-surface-700 dark:text-surface-200">{{ trimmedKeyword }}</span>」
          </p>
          <p class="text-xs text-surface-400 dark:text-surface-500 mt-1.5">试试更短的词或别名（比如「b站」「谷歌」），或者直接去外部搜：</p>
          <div class="flex items-center justify-center gap-2 mt-4">
            <a
              v-for="engine in externalEngines"
              :key="engine.key"
              :href="buildSearchUrl(engine, trimmedKeyword)"
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
      <div class="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-[11px] text-surface-300 dark:text-surface-600">
        <span class="flex items-center gap-1">
          <DynamicIcon :icon="siteConfig.logoIcon" class="text-xs text-accent-500/50" />
          &copy; {{ new Date().getFullYear() }} {{ siteConfig.title }}{{ siteConfig.titleHighlight }} · {{ siteConfig.tagline }}
        </span>
        <span class="hidden lg:flex items-center gap-2 sm:mx-auto" aria-label="键盘快捷键">
          <span><kbd class="kbd-hint">⌘K</kbd> 命令面板</span>
          <span><kbd class="kbd-hint">/</kbd> 搜索</span>
          <span><kbd class="kbd-hint">↑</kbd><kbd class="kbd-hint">↓</kbd> 选择</span>
          <span><kbd class="kbd-hint">Enter</kbd> 打开</span>
          <span><kbd class="kbd-hint">Esc</kbd> 清空</span>
        </span>
        <span class="flex items-center gap-3 sm:ml-auto lg:ml-0">
          <span>{{ APP_VERSION_LABEL }}</span>
          <a :href="siteConfig.domainUrl" class="hover:text-surface-500 dark:hover:text-surface-400 transition-colors">{{ siteConfig.domain }}</a>
          <a
            v-if="siteConfig.githubUrl"
            :href="siteConfig.githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-surface-500 dark:hover:text-surface-400 transition-colors"
            aria-label="GitHub 仓库"
          >
            <Icon icon="mdi:github" class="text-sm" />
          </a>
        </span>
      </div>
    </footer>

    <div
      v-if="!isOnline"
      role="status"
      class="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-800/90 dark:bg-surface-100/90 text-white dark:text-surface-900 shadow-lg backdrop-blur"
    >
      <span class="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
      当前离线 · 已缓存内容可继续浏览
    </div>

    <BackToTop />
    <CommandPalette :open="paletteOpen" :entries="paletteEntries" @close="paletteOpen = false" @pick="onPalettePick" />
    <SiteFormModal
      :open="formOpen"
      :initial="formInitial"
      :category-names="allCategoryNames"
      @save="onFormSave"
      @close="formOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import DynamicIcon from './DynamicIcon.vue'
import siteConfig from '../config/site'
import { useSearchExtras, buildSearchUrl } from '../composables/useSearchExtras'
import { useUserData } from '../composables/useUserData'
import { scoreSiteForQuery, completionTerms } from '../utils/suggest'
import HighlightText from './HighlightText.vue'
import type { NavItem, SearchEngine } from '../types'
import { useI18n } from '../i18n'
import { engineDisplayLabel } from '../utils/engineLabel'
import { useHScroll } from '../composables/useHScroll'

const { locale, t, itemDesc } = useI18n()
const { favoriteSet, visitCounts } = useUserData()

/** 内置引擎名按语言展示（站内/百度/必应是 UI 文案，不是数据） */
function engineLabel(engine: SearchEngine): string {
  return engineDisplayLabel(engine, locale.value, t)
}

const props = defineProps<{
  /** 全量站点（去重后），用于建议下拉里的站点直达 */
  items: NavItem[]
  /** 热门词：热门站点标题 + 热门分类名 */
  hotTerms: string[]
}>()

const emit = defineEmits<{
  (e: 'search', keyword: string): void
  (e: 'open-item', item: NavItem): void
}>()

const {
  customEngines,
  history,
  activeEngineKey,
  suggestionsOpen,
  addEngine,
  removeEngine,
  setActiveEngine,
  recordHistory,
  removeHistory,
  clearHistory,
} = useSearchExtras()

const engines = computed<SearchEngine[]>(() => [...siteConfig.search.engines, ...customEngines.value])

// 引擎行横滑可发现性走共用 composable useHScroll（与 CategoryNav 分类条同一实现，R62 补齐、R66 抽取）
const {
  scrollRef: engineRowRef,
  maskImage: engineMaskImage,
  updateScrollState: updateEngineScrollState,
  refreshScrollState: refreshEngineScrollState,
} = useHScroll()

watch([engines, locale], refreshEngineScrollState)

const activeEngine = computed<string>({
  get: () =>
    engines.value.some((e) => e.key === activeEngineKey.value) ? activeEngineKey.value : 'site',
  set: (key: string) => setActiveEngine(key),
})

const inputValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const focused = ref(false)

const currentEngine = computed(() => engines.value.find((e) => e.key === activeEngine.value)!)

const placeholder = computed(() => {
  if (activeEngine.value === 'site') return t('search.placeholderSite')
  return t('search.placeholderEngine', { name: engineLabel(currentEngine.value) })
})

function switchEngine(key: string) {
  activeEngine.value = key
  if (key === 'site') {
    emit('search', inputValue.value)
  } else {
    emit('search', '')
  }
}

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  inputValue.value = val
  activeSuggest.value = -1
  if (activeEngine.value === 'site') {
    emit('search', val)
  }
}

function clearInput() {
  inputValue.value = ''
  if (activeEngine.value === 'site') {
    emit('search', '')
  }
}

function submitExternal(term: string) {
  const t = term.trim()
  if (!t || activeEngine.value === 'site') return
  recordHistory(t)
  window.open(buildSearchUrl(currentEngine.value, t), '_blank', 'noopener')
}

function onEnter() {
  if (activeEngine.value !== 'site' && inputValue.value.trim()) {
    submitExternal(inputValue.value)
  } else if (activeEngine.value === 'site' && inputValue.value.trim()) {
    recordHistory(inputValue.value)
  }
}

// ==================== 建议下拉（R41 增强：打分排序 + 补全词 + 跨组去重） ====================
interface Suggestion {
  kind: 'history' | 'term' | 'site'
  text: string
  item?: NavItem
  /** 该行是某分组的第一行时携带分组标题（已翻译） */
  heading?: string
}

const suggestions = computed<Suggestion[]>(() => {
  const q = inputValue.value.trim().toLowerCase()
  const list: Suggestion[] = []
  const seen = new Set<string>()
  const push = (s: Suggestion, heading?: string) => {
    const key = s.text.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    list.push(heading ? { ...s, heading } : s)
  }
  const ctx = { favoriteUrls: favoriteSet.value, visitCounts: visitCounts.value }
  if (q) {
    // 历史：前缀命中优先于子串命中，组内保持最近在前，最多 3 条
    const hist = history.value.filter((h) => h.toLowerCase().includes(q))
    const histSorted = [
      ...hist.filter((h) => h.toLowerCase().startsWith(q)),
      ...hist.filter((h) => !h.toLowerCase().startsWith(q)),
    ]
    histSorted.slice(0, 3).forEach((h, i) =>
      push({ kind: 'history', text: h }, i === 0 ? t('search.history') : undefined)
    )
    // 站点直达：多字段打分（标题/别名/域名/三语描述 + 收藏/访问热度）排序，最多 6 条
    const ranked = props.items
      .map((item) => ({ item, score: scoreSiteForQuery(q, item, ctx) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
    ranked.forEach((x, i) =>
      push({ kind: 'site', text: x.item.title, item: x.item }, i === 0 ? t('search.sites') : undefined)
    )
    // 补全词：以查询开头的标题/别名/热门词，与历史和站点标题跨组去重，最多 3 条
    completionTerms(q, props.items, props.hotTerms, 3, seen).forEach((text, i) =>
      push({ kind: 'term', text }, i === 0 ? t('search.hot') : undefined)
    )
  } else {
    history.value.slice(0, 4).forEach((h, i) =>
      push({ kind: 'history', text: h }, i === 0 ? t('search.history') : undefined)
    )
    // 空查询常访站点：按访问次数取前 3
    const frequent = props.items
      .filter((item) => (visitCounts.value[item.url] ?? 0) > 0)
      .sort((a, b) => (visitCounts.value[b.url] ?? 0) - (visitCounts.value[a.url] ?? 0))
      .slice(0, 3)
    frequent.forEach((item, i) =>
      push({ kind: 'site', text: item.title, item }, i === 0 ? t('search.frequent') : undefined)
    )
    props.hotTerms.slice(0, 4).forEach((text, i) =>
      push({ kind: 'term', text }, i === 0 ? t('search.hot') : undefined)
    )
  }
  return list
})

const dropdownVisible = computed(() => focused.value && suggestions.value.length > 0)
watch(dropdownVisible, (v) => {
  suggestionsOpen.value = v
  if (!v) activeSuggest.value = -1
})

const activeSuggest = ref(-1)
const dropdownRef = ref<HTMLDivElement | null>(null)

// 键盘选中项变化时把该行滚进下拉可视区（长列表时选中项可能在折叠线以下）
watch(activeSuggest, (idx) => {
  if (idx < 0) return
  nextTick(() => {
    dropdownRef.value
      ?.querySelector('[data-suggest-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  })
})

function pickSuggestion(s: Suggestion) {
  if (s.kind === 'site' && s.item) {
    recordHistory(inputValue.value.trim() || s.item.title)
    emit('open-item', s.item)
    focused.value = false
    inputRef.value?.blur()
    return
  }
  inputValue.value = s.text
  activeSuggest.value = -1
  if (activeEngine.value === 'site') {
    recordHistory(s.text)
    emit('search', s.text)
  } else {
    submitExternal(s.text)
  }
  inputRef.value?.focus()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (!dropdownVisible.value) return
    e.preventDefault()
    e.stopPropagation()
    const n = suggestions.value.length
    if (!n) return
    const delta = e.key === 'ArrowDown' ? 1 : -1
    activeSuggest.value = (activeSuggest.value + delta + n) % n
    return
  }
  if (e.key === 'Enter') {
    if (dropdownVisible.value && activeSuggest.value >= 0) {
      e.preventDefault()
      e.stopPropagation()
      const s = suggestions.value[activeSuggest.value]
      if (s) pickSuggestion(s)
    }
    return
  }
  if (e.key === 'Escape') {
    // 建议开着先关建议；再有内容清空，没内容失焦。阻止冒泡避免 App 全局 Esc 重复处理
    e.stopPropagation()
    if (dropdownVisible.value) {
      focused.value = false
      inputRef.value?.blur()
    } else if (inputValue.value) {
      clearInput()
    } else {
      inputRef.value?.blur()
    }
  }
}

function focusInput() {
  inputRef.value?.focus()
  inputRef.value?.select()
}

defineExpose({ focusInput })

// ==================== 自定义引擎管理 ====================
const managerOpen = ref(false)
const newLabel = ref('')
const newUrl = ref('')
const formError = ref('')

function onAddEngine() {
  formError.value = ''
  if (!newLabel.value.trim()) {
    formError.value = t('engine.errName')
    return
  }
  if (!newUrl.value.trim()) {
    formError.value = t('engine.errUrl')
    return
  }
  const engine = addEngine(newLabel.value, newUrl.value)
  if (!engine) {
    formError.value = t('engine.errInvalid')
    return
  }
  newLabel.value = ''
  newUrl.value = ''
  switchEngine(engine.key)
}
</script>

<template>
  <div class="max-w-xl mx-auto">
    <div ref="engineRowRef" class="flex items-center gap-1 mb-2.5 px-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" :aria-label="t('search.enginesAria')" :style="engineMaskImage ? { maskImage: engineMaskImage, WebkitMaskImage: engineMaskImage } : undefined" @scroll="updateEngineScrollState">
      <button
        v-for="engine in engines"
        :key="engine.key"
        role="tab"
        :aria-selected="activeEngine === engine.key"
        @click="switchEngine(engine.key)"
        class="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
        :class="activeEngine === engine.key
          ? 'bg-accent-600 text-white dark:bg-accent-500'
          : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'"
      >
        <DynamicIcon :icon="engine.icon" class="text-sm" />
        {{ engineLabel(engine) }}
      </button>
      <button
        type="button"
        class="flex shrink-0 items-center gap-1 px-2 py-1.5 rounded-md text-xs text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        :aria-expanded="managerOpen"
        :title="t('engine.manage')"
        @click="managerOpen = !managerOpen"
      >
        <Icon icon="mdi:cog-outline" class="text-sm" />
        <span class="hidden sm:inline">{{ t('engine.button') }}</span>
      </button>
    </div>

    <div v-if="managerOpen" class="float-panel mb-2.5 mx-1 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-3 text-left" @keydown.esc="managerOpen = false">
      <p class="text-xs font-medium text-surface-600 dark:text-surface-300 mb-2">{{ t('engine.customTitle') }}</p>
      <ul v-if="customEngines.length" class="mb-2.5 space-y-1">
        <li
          v-for="engine in customEngines"
          :key="engine.key"
          class="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400"
        >
          <Icon icon="mdi:web" class="text-sm shrink-0" />
          <span class="font-medium text-surface-700 dark:text-surface-200">{{ engine.label }}</span>
          <span class="truncate text-surface-300 dark:text-surface-600">{{ engine.url }}</span>
          <button
            type="button"
            class="ml-auto shrink-0 p-1 rounded text-surface-300 dark:text-surface-500 hover:text-red-500 transition-colors"
            :aria-label="t('engine.delete', { name: engine.label })"
            @click="removeEngine(engine.key)"
          >
            <Icon icon="mdi:trash-can-outline" class="text-sm block" />
          </button>
        </li>
      </ul>
      <p v-else class="text-[11px] text-surface-300 dark:text-surface-600 mb-2.5">{{ t('engine.none') }}</p>
      <div class="flex flex-col sm:flex-row gap-1.5">
        <input
          v-model="newLabel"
          type="text"
          :placeholder="t('engine.namePh')"
          class="sm:w-32 px-2.5 py-1.5 rounded-md border border-surface-200 dark:border-surface-700 bg-transparent text-xs text-surface-700 dark:text-surface-200 outline-none focus:border-accent-400"
          @keydown.enter.prevent="onAddEngine"
        />
        <input
          v-model="newUrl"
          type="text"
          :placeholder="t('engine.urlPh')"
          class="flex-1 px-2.5 py-1.5 rounded-md border border-surface-200 dark:border-surface-700 bg-transparent text-xs text-surface-700 dark:text-surface-200 outline-none focus:border-accent-400"
          @keydown.enter.prevent="onAddEngine"
        />
        <button
          type="button"
          class="flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-accent-600 text-white hover:bg-accent-500 transition-colors"
          @click="onAddEngine"
        >
          <Icon icon="mdi:plus" class="text-sm" />
          {{ t('common.add') }}
        </button>
      </div>
      <p v-if="formError" class="text-[11px] text-red-500 mt-1.5">{{ formError }}</p>
      <p class="text-[11px] text-surface-300 dark:text-surface-600 mt-1.5">{{ t('engine.hint') }}</p>
    </div>

    <div class="relative">
      <Icon icon="mdi:magnify" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-300 dark:text-surface-500 text-lg pointer-events-none z-10" />
      <input
        ref="inputRef"
        id="morigo-search-input"
        type="text"
        class="search-box !pl-10 !pr-10"
        :placeholder="placeholder"
        :value="inputValue"
        :aria-label="t('search.inputAria')"
        autocomplete="off"
        spellcheck="false"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="dropdownVisible"
        @input="onInput"
        @keydown.enter="onEnter"
        @keydown="onKeydown"
        @focus="focused = true"
        @blur="focused = false"
      />
      <button
        v-if="inputValue"
        type="button"
        @click="clearInput"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-surface-300 dark:text-surface-500 hover:text-surface-500 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors z-10"
        :aria-label="t('search.clear')"
        :title="t('search.clearTitle')"
      >
        <Icon icon="mdi:close" class="text-sm" />
      </button>
      <kbd
        v-else-if="activeEngine === 'site'"
        class="hidden sm:flex absolute right-3.5 top-1/2 -translate-y-1/2 items-center px-1.5 py-0.5 rounded border border-surface-200 dark:border-surface-700 text-[10px] leading-none text-surface-300 dark:text-surface-500 pointer-events-none select-none"
        :title="t('search.focusHint')"
      >/</kbd>
      <div
        v-else
        class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-surface-300 dark:text-surface-600 pointer-events-none select-none"
      >
        Enter &crarr;
      </div>

      <div
        v-if="dropdownVisible"
        ref="dropdownRef"
        class="float-panel absolute left-0 right-0 top-full mt-1.5 z-50 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg shadow-surface-900/5 overflow-y-auto max-h-[55dvh] text-left"
        role="listbox"
        :aria-label="t('search.suggestionsAria')"
      >
        <template v-for="(s, i) in suggestions" :key="`${s.kind}:${s.text}`">
          <div
            v-if="s.heading"
            class="flex items-center justify-between px-3 pt-2 pb-0.5 text-[10px] text-surface-300 dark:text-surface-600"
          >
            <span>{{ s.heading }}</span>
            <button
              v-if="s.kind === 'history'"
              type="button"
              class="hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
              @mousedown.prevent.stop="clearHistory"
            >{{ t('common.clear') }}</button>
          </div>
          <div
            class="group flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs"
            :class="i === activeSuggest ? 'bg-accent-50 dark:bg-accent-500/10' : ''"
            :data-suggest-active="i === activeSuggest"
            role="option"
            :aria-selected="i === activeSuggest"
            @mousedown.prevent="pickSuggestion(s)"
            @mouseenter="activeSuggest = i"
          >
            <Icon
              v-if="s.kind === 'history'"
              icon="mdi:clock-outline"
              class="text-sm text-surface-300 dark:text-surface-500 shrink-0"
            />
            <Icon
              v-else-if="s.kind === 'term'"
              icon="mdi:trending-up"
              class="text-sm text-accent-500 shrink-0"
            />
            <DynamicIcon v-else-if="s.item" :icon="s.item.icon" class="text-sm shrink-0" />
            <span class="truncate text-surface-700 dark:text-surface-200"><HighlightText :text="s.text" :keyword="inputValue" /></span>
            <span v-if="s.kind === 'site' && s.item" class="truncate text-[11px] text-surface-300 dark:text-surface-600">{{ itemDesc(s.item) }}</span>
            <button
              v-if="s.kind === 'history'"
              type="button"
              class="ml-auto shrink-0 p-0.5 rounded text-surface-300 dark:text-surface-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              :aria-label="t('search.deleteHistory', { text: s.text })"
              @mousedown.prevent.stop="removeHistory(s.text)"
            >
              <Icon icon="mdi:close" class="text-xs block" />
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

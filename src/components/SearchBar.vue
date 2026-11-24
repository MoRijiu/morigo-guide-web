<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import DynamicIcon from './DynamicIcon.vue'
import siteConfig from '../config/site'
import { useSearchExtras, buildSearchUrl } from '../composables/useSearchExtras'
import type { NavItem, SearchEngine } from '../types'

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
  if (activeEngine.value === 'site') return '搜索站内导航...（按 / 快速聚焦）'
  return `在${currentEngine.value.label}中搜索...`
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

// ==================== 建议下拉 ====================
interface Suggestion {
  kind: 'history' | 'term' | 'site'
  text: string
  item?: NavItem
}

const suggestions = computed<Suggestion[]>(() => {
  const q = inputValue.value.trim().toLowerCase()
  const list: Suggestion[] = []
  const seen = new Set<string>()
  const pushTerm = (kind: 'history' | 'term', text: string) => {
    const key = text.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    list.push({ kind, text })
  }
  if (q) {
    for (const h of history.value) {
      if (list.filter((s) => s.kind === 'history').length >= 3) break
      if (h.toLowerCase().includes(q)) pushTerm('history', h)
    }
    let siteCount = 0
    for (const item of props.items) {
      if (siteCount >= 5) break
      const hit =
        item.title.toLowerCase().includes(q) ||
        (item.aliases ?? []).some((a) => a.toLowerCase().includes(q))
      if (hit) {
        list.push({ kind: 'site', text: item.title, item })
        siteCount++
      }
    }
    for (const t of props.hotTerms) {
      if (list.filter((s) => s.kind === 'term').length >= 3) break
      if (t.toLowerCase().includes(q)) pushTerm('term', t)
    }
  } else {
    for (const h of history.value.slice(0, 5)) pushTerm('history', h)
    for (const t of props.hotTerms.slice(0, 5)) pushTerm('term', t)
  }
  return list
})

const dropdownVisible = computed(() => focused.value && suggestions.value.length > 0)
watch(dropdownVisible, (v) => {
  suggestionsOpen.value = v
  if (!v) activeSuggest.value = -1
})

const activeSuggest = ref(-1)

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
    formError.value = '先给搜索引擎起个名字'
    return
  }
  if (!newUrl.value.trim()) {
    formError.value = '填搜索地址，如 https://example.com/search?q={q}'
    return
  }
  const engine = addEngine(newLabel.value, newUrl.value)
  if (!engine) {
    formError.value = '地址不合法：需要 http(s) 开头的完整搜索地址'
    return
  }
  newLabel.value = ''
  newUrl.value = ''
  switchEngine(engine.key)
}
</script>

<template>
  <div class="max-w-xl mx-auto">
    <div class="flex items-center gap-1 mb-2.5 px-1" role="tablist" aria-label="搜索引擎切换">
      <button
        v-for="engine in engines"
        :key="engine.key"
        role="tab"
        :aria-selected="activeEngine === engine.key"
        @click="switchEngine(engine.key)"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
        :class="activeEngine === engine.key
          ? 'bg-accent-600 text-white dark:bg-accent-500'
          : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'"
      >
        <DynamicIcon :icon="engine.icon" class="text-sm" />
        {{ engine.label }}
      </button>
      <button
        type="button"
        class="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        :aria-expanded="managerOpen"
        title="管理搜索引擎"
        @click="managerOpen = !managerOpen"
      >
        <Icon icon="mdi:cog-outline" class="text-sm" />
        <span class="hidden sm:inline">引擎</span>
      </button>
    </div>

    <div v-if="managerOpen" class="mb-2.5 mx-1 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-3 text-left">
      <p class="text-xs font-medium text-surface-600 dark:text-surface-300 mb-2">自定义搜索引擎</p>
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
            :aria-label="`删除搜索引擎 ${engine.label}`"
            @click="removeEngine(engine.key)"
          >
            <Icon icon="mdi:trash-can-outline" class="text-sm block" />
          </button>
        </li>
      </ul>
      <p v-else class="text-[11px] text-surface-300 dark:text-surface-600 mb-2.5">还没有自定义引擎，在下面添加一个。</p>
      <div class="flex flex-col sm:flex-row gap-1.5">
        <input
          v-model="newLabel"
          type="text"
          placeholder="名称，如 DuckDuckGo"
          class="sm:w-32 px-2.5 py-1.5 rounded-md border border-surface-200 dark:border-surface-700 bg-transparent text-xs text-surface-700 dark:text-surface-200 outline-none focus:border-accent-400"
          @keydown.enter.prevent="onAddEngine"
        />
        <input
          v-model="newUrl"
          type="text"
          placeholder="搜索地址，如 https://duckduckgo.com/?q={q}"
          class="flex-1 px-2.5 py-1.5 rounded-md border border-surface-200 dark:border-surface-700 bg-transparent text-xs text-surface-700 dark:text-surface-200 outline-none focus:border-accent-400"
          @keydown.enter.prevent="onAddEngine"
        />
        <button
          type="button"
          class="flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-accent-600 text-white hover:bg-accent-500 transition-colors"
          @click="onAddEngine"
        >
          <Icon icon="mdi:plus" class="text-sm" />
          添加
        </button>
      </div>
      <p v-if="formError" class="text-[11px] text-red-500 mt-1.5">{{ formError }}</p>
      <p class="text-[11px] text-surface-300 dark:text-surface-600 mt-1.5">地址里用 {q} 代表关键词；不写 {q} 时关键词会拼到地址末尾。自定义引擎只保存在本机浏览器。</p>
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
        aria-label="搜索站内导航"
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
        aria-label="清空搜索"
        title="清空（Esc）"
      >
        <Icon icon="mdi:close" class="text-sm" />
      </button>
      <kbd
        v-else-if="activeEngine === 'site'"
        class="hidden sm:flex absolute right-3.5 top-1/2 -translate-y-1/2 items-center px-1.5 py-0.5 rounded border border-surface-200 dark:border-surface-700 text-[10px] leading-none text-surface-300 dark:text-surface-500 pointer-events-none select-none"
        title="按 / 快速聚焦搜索框"
      >/</kbd>
      <div
        v-else
        class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-surface-300 dark:text-surface-600 pointer-events-none select-none"
      >
        Enter &crarr;
      </div>

      <div
        v-if="dropdownVisible"
        class="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg shadow-surface-900/5 overflow-hidden text-left"
        role="listbox"
        aria-label="搜索建议"
      >
        <template v-for="(s, i) in suggestions" :key="`${s.kind}:${s.text}`">
          <div
            v-if="s.kind === 'history' && (i === 0 || suggestions[i - 1].kind !== 'history')"
            class="flex items-center justify-between px-3 pt-2 pb-0.5 text-[10px] text-surface-300 dark:text-surface-600"
          >
            <span>搜索历史</span>
            <button
              type="button"
              class="hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
              @mousedown.prevent.stop="clearHistory"
            >清空</button>
          </div>
          <p
            v-else-if="s.kind === 'term' && (i === 0 || suggestions[i - 1].kind === 'history' || suggestions[i - 1].kind === 'site') && !suggestions.slice(0, i).some(x => x.kind === 'term')"
            class="px-3 pt-2 pb-0.5 text-[10px] text-surface-300 dark:text-surface-600"
          >热门搜索</p>
          <div
            class="group flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs"
            :class="i === activeSuggest ? 'bg-accent-50 dark:bg-accent-500/10' : ''"
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
            <span class="truncate text-surface-700 dark:text-surface-200">{{ s.text }}</span>
            <span v-if="s.kind === 'site' && s.item" class="truncate text-[11px] text-surface-300 dark:text-surface-600">{{ s.item.description }}</span>
            <button
              v-if="s.kind === 'history'"
              type="button"
              class="ml-auto shrink-0 p-0.5 rounded text-surface-300 dark:text-surface-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              :aria-label="`删除历史 ${s.text}`"
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

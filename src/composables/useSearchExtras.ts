import { ref } from 'vue'
import type { SearchEngine } from '../types'

/**
 * 搜索增强的本地状态：自定义搜索引擎、搜索历史、建议下拉开合标志。
 * 均存 localStorage（模块级单例）；存储不可用时静默降级为仅内存态。
 * suggestionsOpen 供 App 全局键盘流感知：建议打开时方向键/回车归 SearchBar 处理。
 */
const ENGINES_KEY = 'morigo:custom-engines'
const HISTORY_KEY = 'morigo:search-history'
const ACTIVE_KEY = 'morigo:active-engine'
const HISTORY_MAX = 10

function loadEngines(): SearchEngine[] {
  try {
    const raw = localStorage.getItem(ENGINES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (e): e is SearchEngine =>
          e &&
          typeof e.key === 'string' &&
          typeof e.label === 'string' &&
          typeof e.url === 'string' &&
          e.url.length > 0
      )
      .map((e) => ({ key: e.key, label: e.label, url: e.url, icon: 'mdi:web' }))
  } catch {
    return []
  }
}

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, HISTORY_MAX)
      : []
  } catch {
    return []
  }
}

function loadActive(): string {
  try {
    return localStorage.getItem(ACTIVE_KEY) || 'site'
  } catch {
    return 'site'
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 隐私模式等存储不可用时仅内存态生效
  }
}

const customEngines = ref<SearchEngine[]>(loadEngines())
const history = ref<string[]>(loadHistory())
const activeEngineKey = ref<string>(loadActive())
const suggestionsOpen = ref(false)

export function useSearchExtras() {
  function addEngine(label: string, urlTemplate: string): SearchEngine | null {
    const name = label.trim()
    const url = urlTemplate.trim()
    if (!name || !url) return null
    try {
      const u = new URL(url.replace('{q}', 'test'))
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    } catch {
      return null
    }
    const engine: SearchEngine = {
      key: `custom-${Date.now().toString(36)}`,
      label: name,
      url,
      icon: 'mdi:web',
    }
    customEngines.value = [...customEngines.value, engine]
    save(ENGINES_KEY, JSON.stringify(customEngines.value))
    return engine
  }

  function removeEngine(key: string) {
    customEngines.value = customEngines.value.filter((e) => e.key !== key)
    save(ENGINES_KEY, JSON.stringify(customEngines.value))
    if (activeEngineKey.value === key) setActiveEngine('site')
  }

  function setActiveEngine(key: string) {
    activeEngineKey.value = key
    save(ACTIVE_KEY, key)
  }

  function recordHistory(term: string) {
    const t = term.trim()
    if (!t) return
    history.value = [t, ...history.value.filter((h) => h !== t)].slice(0, HISTORY_MAX)
    save(HISTORY_KEY, JSON.stringify(history.value))
  }

  function removeHistory(term: string) {
    history.value = history.value.filter((h) => h !== term)
    save(HISTORY_KEY, JSON.stringify(history.value))
  }

  function clearHistory() {
    history.value = []
    save(HISTORY_KEY, JSON.stringify(history.value))
  }

  return {
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
  }
}

/** 引擎 URL 模板 → 实际搜索地址：含 {q} 则替换，否则把关键词拼到末尾 */
export function buildSearchUrl(engine: SearchEngine, query: string): string {
  const encoded = encodeURIComponent(query)
  return engine.url.includes('{q}')
    ? engine.url.replace(/\{q\}/g, encoded)
    : engine.url + encoded
}

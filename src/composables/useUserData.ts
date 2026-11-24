import { ref, computed } from 'vue'

/**
 * 用户本地数据：收藏与最近访问，均存 localStorage，按导航项 url 标识。
 * 模块级单例状态，各组件共享同一份。
 */
const FAV_KEY = 'morigo:favorites'
const RECENT_KEY = 'morigo:recent'
const RECENT_MAX = 12

function load(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function save(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 存储不可用（隐私模式等）时静默降级，仅内存态生效
  }
}

const favorites = ref<string[]>(load(FAV_KEY))
const recent = ref<string[]>(load(RECENT_KEY))

export function useUserData() {
  const favoriteSet = computed(() => new Set(favorites.value))

  function isFavorite(url: string): boolean {
    return favoriteSet.value.has(url)
  }

  function toggleFavorite(url: string) {
    favorites.value = favoriteSet.value.has(url)
      ? favorites.value.filter((u) => u !== url)
      : [url, ...favorites.value]
    save(FAV_KEY, favorites.value)
  }

  function recordVisit(url: string) {
    recent.value = [url, ...recent.value.filter((u) => u !== url)].slice(0, RECENT_MAX)
    save(RECENT_KEY, recent.value)
  }

  function clearRecent() {
    recent.value = []
    save(RECENT_KEY, recent.value)
  }

  /** 导入收藏/最近访问：merge 去重合并；replace 整表替换 */
  function importUserData(favs: string[], rec: string[], mode: 'merge' | 'replace') {
    if (mode === 'replace') {
      favorites.value = [...favs]
      recent.value = [...rec].slice(0, RECENT_MAX)
    } else {
      favorites.value = [...favs.filter((u) => !favorites.value.includes(u)), ...favorites.value]
      recent.value = [...rec.filter((u) => !recent.value.includes(u)), ...recent.value].slice(0, RECENT_MAX)
    }
    save(FAV_KEY, favorites.value)
    save(RECENT_KEY, recent.value)
  }

  return { favorites, recent, isFavorite, toggleFavorite, recordVisit, clearRecent, importUserData }
}

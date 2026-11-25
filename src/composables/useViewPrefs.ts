import { ref } from 'vue'

/**
 * 视图偏好：网格/列表、舒适/紧凑密度、已折叠分类，存 localStorage。
 * 模块级单例，与 useUserData 同模式；存储不可用时静默降级为仅内存态。
 */
export type ViewMode = 'grid' | 'list'
export type Density = 'comfortable' | 'compact'

const KEY = 'morigo:view-prefs'

interface ViewPrefs {
  view: ViewMode
  density: Density
  collapsed: string[]
  /** 分类展示顺序（分类名列表）；未列出的分类按原始顺序排在其后 */
  categoryOrder: string[]
}

function load(): ViewPrefs {
  const fallback: ViewPrefs = { view: 'grid', density: 'comfortable', collapsed: [], categoryOrder: [] }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fallback
    const p = JSON.parse(raw) as Partial<ViewPrefs> | null
    if (!p || typeof p !== 'object') return fallback
    return {
      view: p.view === 'list' ? 'list' : 'grid',
      density: p.density === 'compact' ? 'compact' : 'comfortable',
      collapsed: Array.isArray(p.collapsed)
        ? p.collapsed.filter((x): x is string => typeof x === 'string')
        : [],
      categoryOrder: Array.isArray(p.categoryOrder)
        ? p.categoryOrder.filter((x): x is string => typeof x === 'string')
        : [],
    }
  } catch {
    return fallback
  }
}

const initial = load()
const view = ref<ViewMode>(initial.view)
const density = ref<Density>(initial.density)
const collapsed = ref<string[]>(initial.collapsed)
const categoryOrder = ref<string[]>(initial.categoryOrder)

function save() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        view: view.value,
        density: density.value,
        collapsed: collapsed.value,
        categoryOrder: categoryOrder.value,
      })
    )
  } catch {
    // 隐私模式等存储不可用时仅内存态生效
  }
}

export function useViewPrefs() {
  function setView(v: ViewMode) {
    view.value = v
    save()
  }

  function setDensity(d: Density) {
    density.value = d
    save()
  }

  function isCollapsed(name: string): boolean {
    return collapsed.value.includes(name)
  }

  function toggleCollapsed(name: string) {
    collapsed.value = collapsed.value.includes(name)
      ? collapsed.value.filter((n) => n !== name)
      : [...collapsed.value, name]
    save()
  }

  /** 一键折叠/展开：fold=true 时把给定分类名全部记为折叠，否则清空 */
  function setAllCollapsed(names: string[], fold: boolean) {
    collapsed.value = fold ? [...names] : []
    save()
  }

  function setCategoryOrder(names: string[]) {
    categoryOrder.value = [...names]
    save()
  }

  return {
    view,
    density,
    collapsed,
    categoryOrder,
    setView,
    setDensity,
    isCollapsed,
    toggleCollapsed,
    setAllCollapsed,
    setCategoryOrder,
  }
}

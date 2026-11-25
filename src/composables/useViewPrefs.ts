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
  /** 置顶分类（分类名列表）：排在普通分类之前，个人分组之后 */
  pinnedCategories: string[]
  /** 隐藏分类（分类名列表）：不出现在主列表与导航条，可在页面底部恢复 */
  hiddenCategories: string[]
}

function load(): ViewPrefs {
  const fallback: ViewPrefs = {
    view: 'grid',
    density: 'comfortable',
    collapsed: [],
    categoryOrder: [],
    pinnedCategories: [],
    hiddenCategories: [],
  }
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
      pinnedCategories: Array.isArray(p.pinnedCategories)
        ? p.pinnedCategories.filter((x): x is string => typeof x === 'string')
        : [],
      hiddenCategories: Array.isArray(p.hiddenCategories)
        ? p.hiddenCategories.filter((x): x is string => typeof x === 'string')
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
const pinnedCategories = ref<string[]>(initial.pinnedCategories)
const hiddenCategories = ref<string[]>(initial.hiddenCategories)

function save() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        view: view.value,
        density: density.value,
        collapsed: collapsed.value,
        categoryOrder: categoryOrder.value,
        pinnedCategories: pinnedCategories.value,
        hiddenCategories: hiddenCategories.value,
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

  function isPinned(name: string): boolean {
    return pinnedCategories.value.includes(name)
  }

  function togglePinned(name: string) {
    pinnedCategories.value = pinnedCategories.value.includes(name)
      ? pinnedCategories.value.filter((n) => n !== name)
      : [...pinnedCategories.value, name]
    save()
  }

  function isHidden(name: string): boolean {
    return hiddenCategories.value.includes(name)
  }

  /** 隐藏/恢复分类；隐藏时同时取消置顶，避免恢复后位置突变 */
  function toggleHidden(name: string) {
    if (hiddenCategories.value.includes(name)) {
      hiddenCategories.value = hiddenCategories.value.filter((n) => n !== name)
    } else {
      hiddenCategories.value = [...hiddenCategories.value, name]
      pinnedCategories.value = pinnedCategories.value.filter((n) => n !== name)
    }
    save()
  }

  return {
    view,
    density,
    collapsed,
    categoryOrder,
    pinnedCategories,
    hiddenCategories,
    setView,
    setDensity,
    isCollapsed,
    toggleCollapsed,
    setAllCollapsed,
    setCategoryOrder,
    isPinned,
    togglePinned,
    isHidden,
    toggleHidden,
  }
}

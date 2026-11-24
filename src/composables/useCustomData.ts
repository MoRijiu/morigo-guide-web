import { ref } from 'vue'
import type { NavCategory, NavItem } from '../types'

/**
 * 用户自定义站点：访客在页面里增删改自己的导航项与分类，存 localStorage。
 * 与构建期的 navigation.local.ts 覆盖区分：这是运行时、面向任何自部署实例访客的自助功能，
 * 数据只留在本机浏览器，不进仓库、不上报。
 * 模块级单例状态，各组件共享同一份。
 */
const CUSTOM_KEY = 'morigo:custom'

function load(): NavCategory[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (c): c is NavCategory =>
          Boolean(c) && typeof c.name === 'string' && Array.isArray(c.items)
      )
      .map((c) => ({
        name: c.name,
        icon: typeof c.icon === 'string' && c.icon ? c.icon : 'mdi:folder-outline',
        items: c.items.filter(
          (i): i is NavItem =>
            Boolean(i) && typeof i.title === 'string' && typeof i.url === 'string'
        ),
      }))
      .filter((c) => c.items.length > 0)
  } catch {
    return []
  }
}

function save() {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customCategories.value))
  } catch {
    // 存储不可用时静默降级，仅内存态生效
  }
}

const customCategories = ref<NavCategory[]>(load())

/** 补全协议头并校验，返回规范化 URL 或 null */
export function normalizeUrl(raw: string): string | null {
  let v = raw.trim()
  if (!v) return null
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) v = `https://${v}`
  try {
    const u = new URL(v)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.toString()
  } catch {
    return null
  }
}

export function useCustomData() {
  function isCustomItem(categoryName: string, url: string): boolean {
    return customCategories.value.some(
      (c) => c.name === categoryName && c.items.some((i) => i.url === url)
    )
  }

  function addItem(categoryName: string, item: NavItem) {
    const name = categoryName.trim()
    const existing = customCategories.value.find((c) => c.name === name)
    if (existing) {
      existing.items = [...existing.items, item]
      customCategories.value = [...customCategories.value]
    } else {
      customCategories.value = [
        ...customCategories.value,
        { name, icon: 'mdi:folder-outline', items: [item] },
      ]
    }
    save()
  }

  function updateItem(
    oldCategoryName: string,
    oldUrl: string,
    newCategoryName: string,
    item: NavItem
  ) {
    removeItem(oldCategoryName, oldUrl, false)
    addItem(newCategoryName, item)
  }

  function removeItem(categoryName: string, url: string, persist = true) {
    customCategories.value = customCategories.value
      .map((c) =>
        c.name === categoryName
          ? { ...c, items: c.items.filter((i) => i.url !== url) }
          : c
      )
      .filter((c) => c.items.length > 0)
    if (persist) save()
  }

  return { customCategories, isCustomItem, addItem, updateItem, removeItem }
}

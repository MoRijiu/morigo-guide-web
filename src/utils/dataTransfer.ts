import type { NavCategory } from '../types'
import { normalizeUrl } from '../composables/useCustomData'
import { t } from '../i18n'

/** MoriGo 备份文件格式（JSON 导出/导入共用） */
export interface MorigoBackup {
  app: 'morigo'
  version: 1
  exportedAt: string
  customCategories: NavCategory[]
  favorites: string[]
  recent: string[]
}

export function buildBackup(
  customCategories: NavCategory[],
  favorites: string[],
  recent: string[]
): MorigoBackup {
  return {
    app: 'morigo',
    version: 1,
    exportedAt: new Date().toISOString(),
    customCategories,
    favorites,
    recent,
  }
}

export function downloadBackup(backup: MorigoBackup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `morigo-backup-${backup.exportedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function sanitizeCategories(input: unknown): NavCategory[] {
  if (!Array.isArray(input)) return []
  const out: NavCategory[] = []
  for (const c of input) {
    if (!c || typeof c !== 'object') continue
    const cat = c as Record<string, unknown>
    if (typeof cat.name !== 'string' || !cat.name.trim() || !Array.isArray(cat.items)) continue
    const items = []
    for (const raw of cat.items) {
      if (!raw || typeof raw !== 'object') continue
      const i = raw as Record<string, unknown>
      if (typeof i.title !== 'string' || typeof i.url !== 'string') continue
      const url = normalizeUrl(i.url)
      if (!url) continue
      items.push({
        title: i.title.trim().slice(0, 80) || url,
        description: typeof i.description === 'string' ? i.description.slice(0, 200) : '',
        ...(typeof i.descriptionEn === 'string' && i.descriptionEn
          ? { descriptionEn: i.descriptionEn.slice(0, 200) }
          : {}),
        ...(typeof i.descriptionJa === 'string' && i.descriptionJa
          ? { descriptionJa: i.descriptionJa.slice(0, 200) }
          : {}),
        url,
        icon: typeof i.icon === 'string' && i.icon ? i.icon : 'mdi:web',
        ...(Array.isArray(i.aliases)
          ? { aliases: i.aliases.filter((a): a is string => typeof a === 'string') }
          : {}),
      })
    }
    if (items.length) {
      out.push({
        name: cat.name.trim().slice(0, 40),
        ...(typeof cat.nameEn === 'string' && cat.nameEn
          ? { nameEn: cat.nameEn.trim().slice(0, 40) }
          : {}),
        ...(typeof cat.nameJa === 'string' && cat.nameJa
          ? { nameJa: cat.nameJa.trim().slice(0, 40) }
          : {}),
        icon: typeof cat.icon === 'string' && cat.icon ? cat.icon : 'mdi:folder-outline',
        items,
      })
    }
  }
  return out
}

export function sanitizeUrls(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const u of input) {
    if (typeof u !== 'string') continue
    const url = normalizeUrl(u)
    if (url && !seen.has(url)) {
      seen.add(url)
      out.push(url)
    }
  }
  return out
}

/** 解析 MoriGo JSON 备份；格式不对时抛 Error（消息可直接展示给用户） */
export function parseBackup(text: string): MorigoBackup {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(t('dt.errInvalidJson'))
  }
  if (!parsed || typeof parsed !== 'object') throw new Error(t('dt.errBadFormat'))
  const b = parsed as Record<string, unknown>
  if (b.app !== 'morigo') throw new Error(t('dt.errNotMorigo'))
  return {
    app: 'morigo',
    version: 1,
    exportedAt: typeof b.exportedAt === 'string' ? b.exportedAt : '',
    customCategories: sanitizeCategories(b.customCategories),
    favorites: sanitizeUrls(b.favorites),
    recent: sanitizeUrls(b.recent),
  }
}

/**
 * 解析浏览器导出的书签 HTML（Netscape Bookmark 格式，Chrome/Edge/Firefox 通用）：
 * 按文件夹（H3）分组，取不到文件夹名的归入「导入的书签」。
 */
export function parseBookmarks(html: string): NavCategory[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const anchors = Array.from(doc.querySelectorAll('a[href]'))
  if (!anchors.length) throw new Error(t('dt.errNoLinks'))

  const byFolder = new Map<string, NavCategory['items']>()
  for (const a of anchors) {
    const url = normalizeUrl(a.getAttribute('href') ?? '')
    if (!url) continue
    // 书签结构：<DT><H3>文件夹</H3><DL>…<DT><A>…</A>，向上找最近的 DL 的前置 H3
    let folder = t('dt.importedBookmarks')
    let node: Element | null = a
    while (node) {
      const dl: Element | null = node.closest('dl')
      if (!dl) break
      const prev = dl.previousElementSibling
      const h3 = prev?.tagName === 'DT' ? prev.querySelector('h3') : prev?.tagName === 'H3' ? prev : null
      if (h3?.textContent?.trim()) {
        folder = h3.textContent.trim().slice(0, 40)
        break
      }
      node = dl.parentElement
    }
    const title = (a.textContent ?? '').trim().slice(0, 80) || url
    const list = byFolder.get(folder) ?? []
    if (!list.some((i) => i.url === url)) {
      list.push({ title, description: '', url, icon: 'mdi:web' })
    }
    byFolder.set(folder, list)
  }
  return Array.from(byFolder.entries()).map(([name, items]) => ({
    name,
    icon: 'mdi:folder-outline',
    items,
  }))
}

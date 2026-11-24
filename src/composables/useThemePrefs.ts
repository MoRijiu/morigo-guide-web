import { ref } from 'vue'

/**
 * 主题偏好：强调色、背景预设、毛玻璃质感，存 localStorage。
 * 实际样式靠 CSS 变量与 html 上的 data-accent / data-bg / data-glass 属性
 * （见 style.css 与 tailwind.config.js 的 accent 色板），本模块只管状态与应用。
 * 模块级单例；存储不可用时静默降级为仅内存态。
 */
export interface AccentDef {
  id: string
  label: string
  /** 色板圆点与选中环用的代表色（600 阶） */
  swatch: string
}

export const ACCENTS: AccentDef[] = [
  { id: 'violet', label: '紫罗兰', swatch: '#7c3aed' },
  { id: 'blue', label: '湖蓝', swatch: '#2563eb' },
  { id: 'sky', label: '晴空', swatch: '#0284c7' },
  { id: 'emerald', label: '翠绿', swatch: '#059669' },
  { id: 'amber', label: '琥珀', swatch: '#d97706' },
  { id: 'rose', label: '玫红', swatch: '#e11d48' },
]

export interface BgDef {
  id: string
  label: string
}

export const BACKGROUNDS: BgDef[] = [
  { id: 'none', label: '纯色' },
  { id: 'ocean', label: '海洋' },
  { id: 'sunset', label: '晚霞' },
  { id: 'forest', label: '森林' },
  { id: 'aurora', label: '极光' },
]

const KEY = 'morigo:theme-prefs'

interface ThemePrefs {
  accent: string
  bg: string
  glass: boolean
}

function load(): ThemePrefs {
  const fallback: ThemePrefs = { accent: 'violet', bg: 'none', glass: false }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fallback
    const p = JSON.parse(raw) as Partial<ThemePrefs> | null
    if (!p || typeof p !== 'object') return fallback
    return {
      accent: ACCENTS.some((a) => a.id === p.accent) ? (p.accent as string) : 'violet',
      bg: BACKGROUNDS.some((b) => b.id === p.bg) ? (p.bg as string) : 'none',
      glass: p.glass === true,
    }
  } catch {
    return fallback
  }
}

const initial = load()
const accent = ref(initial.accent)
const bg = ref(initial.bg)
const glass = ref(initial.glass)

function apply() {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  el.dataset.accent = accent.value
  el.dataset.bg = bg.value
  el.dataset.glass = glass.value ? 'true' : 'false'
}

function save() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ accent: accent.value, bg: bg.value, glass: glass.value })
    )
  } catch {
    // 隐私模式等存储不可用时仅内存态生效
  }
}

/** 在应用挂载前调用一次，避免首屏强调色闪烁 */
export function applyThemePrefs() {
  apply()
}

apply()

export function useThemePrefs() {
  function setAccent(id: string) {
    if (!ACCENTS.some((a) => a.id === id)) return
    accent.value = id
    apply()
    save()
  }

  function cycleAccent() {
    const idx = ACCENTS.findIndex((a) => a.id === accent.value)
    setAccent(ACCENTS[(idx + 1) % ACCENTS.length].id)
  }

  function setBg(id: string) {
    if (!BACKGROUNDS.some((b) => b.id === id)) return
    bg.value = id
    apply()
    save()
  }

  function setGlass(v: boolean) {
    glass.value = v
    apply()
    save()
  }

  return { accent, bg, glass, setAccent, cycleAccent, setBg, setGlass }
}

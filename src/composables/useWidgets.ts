import { ref } from 'vue'

/**
 * 小组件区偏好：哪些组件显示 + 倒计时目标，存 localStorage `morigo:widgets`。
 * 模块级单例；存储不可用时静默降级为仅内存态。
 * 全部纯本地实现（时钟/本地一言/倒计时），不依赖任何外部 API。
 */
export type WidgetId = 'clock' | 'quote' | 'countdown'

const KEY = 'morigo:widgets'

export interface CountdownTarget {
  label: string
  /** YYYY-MM-DD */
  date: string
}

interface WidgetPrefs {
  enabled: Record<WidgetId, boolean>
  countdown: CountdownTarget
}

function defaultCountdown(): CountdownTarget {
  // 默认倒计时：下一个元旦
  const now = new Date()
  const isJan1 = now.getMonth() === 0 && now.getDate() === 1
  const year = isJan1 ? now.getFullYear() : now.getFullYear() + 1
  return { label: '', date: `${year}-01-01` }
}

function load(): WidgetPrefs {
  const fallback: WidgetPrefs = {
    enabled: { clock: true, quote: true, countdown: false },
    countdown: defaultCountdown(),
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fallback
    const p = JSON.parse(raw) as Partial<WidgetPrefs> | null
    if (!p || typeof p !== 'object') return fallback
    const e = (p.enabled ?? {}) as Partial<Record<WidgetId, boolean>>
    const cd = (p.countdown ?? {}) as Partial<CountdownTarget>
    return {
      enabled: {
        clock: e.clock !== false,
        quote: e.quote !== false,
        countdown: e.countdown === true,
      },
      countdown: {
        label: typeof cd.label === 'string' ? cd.label.slice(0, 30) : '',
        date:
          typeof cd.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(cd.date)
            ? cd.date
            : fallback.countdown.date,
      },
    }
  } catch {
    return fallback
  }
}

const initial = load()
const enabled = ref<Record<WidgetId, boolean>>(initial.enabled)
const countdown = ref<CountdownTarget>(initial.countdown)

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ enabled: enabled.value, countdown: countdown.value }))
  } catch {
    // 存储不可用时仅内存态生效
  }
}

export function useWidgets() {
  function setEnabled(id: WidgetId, on: boolean) {
    enabled.value = { ...enabled.value, [id]: on }
    save()
  }

  function setCountdown(target: CountdownTarget) {
    countdown.value = { label: target.label.slice(0, 30), date: target.date }
    save()
  }

  const anyEnabled = () =>
    enabled.value.clock || enabled.value.quote || enabled.value.countdown

  return { enabled, countdown, setEnabled, setCountdown, anyEnabled }
}

/** 目标日期距今天的天数（按本地日历日算）：>0 未来、0 今天、<0 已过去 */
export function daysUntil(dateStr: string, now = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!m) return null
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

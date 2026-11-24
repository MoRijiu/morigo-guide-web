import { ref } from 'vue'

/**
 * 小组件区偏好：哪些组件显示 + 倒计时目标 + 天气城市，存 localStorage `morigo:widgets`。
 * 模块级单例；存储不可用时静默降级为仅内存态。
 * 时钟/一言/倒计时纯本地实现；天气为可选组件（默认关闭），开启后才向
 * Open-Meteo（免费、无 key）拉取，结果本地缓存 30 分钟。
 */
export type WidgetId = 'clock' | 'quote' | 'countdown' | 'weather'

const KEY = 'morigo:widgets'

export interface CountdownTarget {
  label: string
  /** YYYY-MM-DD */
  date: string
}

/** 天气城市：id 为预设城市 id 或 'geo'（浏览器定位，坐标为定位结果） */
export interface WeatherCityPref {
  id: string
  lat: number
  lon: number
}

interface WidgetPrefs {
  enabled: Record<WidgetId, boolean>
  countdown: CountdownTarget
  weatherCity: WeatherCityPref
}

const DEFAULT_CITY: WeatherCityPref = { id: 'beijing', lat: 39.9042, lon: 116.4074 }

function defaultCountdown(): CountdownTarget {
  // 默认倒计时：下一个元旦
  const now = new Date()
  const isJan1 = now.getMonth() === 0 && now.getDate() === 1
  const year = isJan1 ? now.getFullYear() : now.getFullYear() + 1
  return { label: '', date: `${year}-01-01` }
}

function load(): WidgetPrefs {
  const fallback: WidgetPrefs = {
    enabled: { clock: true, quote: true, countdown: false, weather: false },
    countdown: defaultCountdown(),
    weatherCity: DEFAULT_CITY,
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fallback
    const p = JSON.parse(raw) as Partial<WidgetPrefs> | null
    if (!p || typeof p !== 'object') return fallback
    const e = (p.enabled ?? {}) as Partial<Record<WidgetId, boolean>>
    const cd = (p.countdown ?? {}) as Partial<CountdownTarget>
    const wc = (p.weatherCity ?? {}) as Partial<WeatherCityPref>
    return {
      enabled: {
        clock: e.clock !== false,
        quote: e.quote !== false,
        countdown: e.countdown === true,
        weather: e.weather === true,
      },
      countdown: {
        label: typeof cd.label === 'string' ? cd.label.slice(0, 30) : '',
        date:
          typeof cd.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(cd.date)
            ? cd.date
            : fallback.countdown.date,
      },
      weatherCity:
        typeof wc.id === 'string' &&
        typeof wc.lat === 'number' &&
        typeof wc.lon === 'number' &&
        Math.abs(wc.lat) <= 90 &&
        Math.abs(wc.lon) <= 180
          ? { id: wc.id.slice(0, 40), lat: wc.lat, lon: wc.lon }
          : DEFAULT_CITY,
    }
  } catch {
    return fallback
  }
}

const initial = load()
const enabled = ref<Record<WidgetId, boolean>>(initial.enabled)
const countdown = ref<CountdownTarget>(initial.countdown)
const weatherCity = ref<WeatherCityPref>(initial.weatherCity)

function save() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        enabled: enabled.value,
        countdown: countdown.value,
        weatherCity: weatherCity.value,
      })
    )
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

  function setWeatherCity(city: WeatherCityPref) {
    weatherCity.value = city
    save()
  }

  const anyEnabled = () =>
    enabled.value.clock ||
    enabled.value.quote ||
    enabled.value.countdown ||
    enabled.value.weather

  return { enabled, countdown, weatherCity, setEnabled, setCountdown, setWeatherCity, anyEnabled }
}

/** 目标日期距今天的天数（按本地日历日算）：>0 未来、0 今天、<0 已过去 */
export function daysUntil(dateStr: string, now = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!m) return null
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

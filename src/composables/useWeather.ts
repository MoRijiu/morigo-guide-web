import { ref } from 'vue'
import { fetchWeather, type WeatherNow } from '../utils/weather'

/**
 * 天气数据状态：模块级单例。结果缓存 localStorage `morigo:weather-cache`
 * （按坐标取整到 2 位小数分键），30 分钟内直接用缓存；过期后台刷新。
 * 只有天气组件开启时才由 WidgetBar 触发加载，未开启零请求。
 */
const CACHE_KEY = 'morigo:weather-cache'
const TTL = 30 * 60 * 1000

interface CacheEntry {
  at: number
  data: WeatherNow
}

type CacheMap = Record<string, CacheEntry>

function cacheKey(lat: number, lon: number) {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`
}

function readCache(lat: number, lon: number): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const map = JSON.parse(raw) as CacheMap
    const e = map[cacheKey(lat, lon)]
    return e && typeof e.at === 'number' && e.data ? e : null
  } catch {
    return null
  }
}

function writeCache(lat: number, lon: number, data: WeatherNow) {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const map = (raw ? (JSON.parse(raw) as CacheMap) : {}) ?? {}
    map[cacheKey(lat, lon)] = { at: Date.now(), data }
    localStorage.setItem(CACHE_KEY, JSON.stringify(map))
  } catch {
    // 存储不可用时仅内存态生效
  }
}

const data = ref<WeatherNow | null>(null)
const loading = ref(false)
const error = ref(false)
let inflight: Promise<void> | null = null
let loadedFor = ''

export function useWeather() {
  async function load(lat: number, lon: number, force = false) {
    const key = cacheKey(lat, lon)
    const cached = readCache(lat, lon)
    if (cached && loadedFor !== key) {
      data.value = cached.data
      loadedFor = key
    }
    if (!force && cached && Date.now() - cached.at < TTL && loadedFor === key) return
    if (inflight) return inflight
    loading.value = true
    error.value = false
    inflight = (async () => {
      try {
        const fresh = await fetchWeather(lat, lon)
        data.value = fresh
        loadedFor = key
        writeCache(lat, lon, fresh)
      } catch {
        // 有缓存时静默用旧数据，不打扰用户；无缓存才报错
        if (!data.value) error.value = true
      } finally {
        loading.value = false
        inflight = null
      }
    })()
    return inflight
  }

  return { data, loading, error, load }
}

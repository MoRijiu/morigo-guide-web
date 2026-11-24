/**
 * 天气小组件数据层：Open-Meteo（免费、无需 key）预报 API + WMO 天气代码映射 +
 * 预设城市表。仅在用户开启天气组件时才会发请求；结果由 useWeather 缓存到本地。
 */

export interface WeatherCity {
  id: string
  zh: string
  en: string
  lat: number
  lon: number
}

/** 预设城市（id 'geo' 为浏览器定位，不在此表内） */
export const WEATHER_CITIES: WeatherCity[] = [
  { id: 'beijing', zh: '北京', en: 'Beijing', lat: 39.9042, lon: 116.4074 },
  { id: 'shanghai', zh: '上海', en: 'Shanghai', lat: 31.2304, lon: 121.4737 },
  { id: 'guangzhou', zh: '广州', en: 'Guangzhou', lat: 23.1291, lon: 113.2644 },
  { id: 'shenzhen', zh: '深圳', en: 'Shenzhen', lat: 22.5431, lon: 114.0579 },
  { id: 'chengdu', zh: '成都', en: 'Chengdu', lat: 30.5728, lon: 104.0668 },
  { id: 'hangzhou', zh: '杭州', en: 'Hangzhou', lat: 30.2741, lon: 120.1551 },
  { id: 'shenyang', zh: '沈阳', en: 'Shenyang', lat: 41.8057, lon: 123.4315 },
  { id: 'tokyo', zh: '东京', en: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { id: 'osaka', zh: '大阪', en: 'Osaka', lat: 34.6937, lon: 135.5023 },
  { id: 'seoul', zh: '首尔', en: 'Seoul', lat: 37.5665, lon: 126.978 },
  { id: 'singapore', zh: '新加坡', en: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { id: 'london', zh: '伦敦', en: 'London', lat: 51.5074, lon: -0.1278 },
  { id: 'paris', zh: '巴黎', en: 'Paris', lat: 48.8566, lon: 2.3522 },
  { id: 'newyork', zh: '纽约', en: 'New York', lat: 40.7128, lon: -74.006 },
  { id: 'sydney', zh: '悉尼', en: 'Sydney', lat: -33.8688, lon: 151.2093 },
]

export interface WeatherNow {
  temp: number
  feels: number
  humidity: number
  wind: number
  code: number
  isDay: boolean
  high: number
  low: number
  /** 拉取时刻（ms） */
  at: number
}

interface Condition {
  iconDay: string
  iconNight: string
  zh: string
  en: string
}

function cond(iconDay: string, iconNight: string, zh: string, en: string): Condition {
  return { iconDay, iconNight, zh, en }
}

const CONDITIONS: Record<number, Condition> = {
  0: cond('mdi:weather-sunny', 'mdi:weather-night', '晴', 'Clear'),
  1: cond('mdi:weather-partly-cloudy', 'mdi:weather-night-partly-cloudy', '大部晴朗', 'Mostly clear'),
  2: cond('mdi:weather-partly-cloudy', 'mdi:weather-night-partly-cloudy', '多云', 'Partly cloudy'),
  3: cond('mdi:weather-cloudy', 'mdi:weather-cloudy', '阴', 'Overcast'),
  45: cond('mdi:weather-fog', 'mdi:weather-fog', '雾', 'Fog'),
  48: cond('mdi:weather-fog', 'mdi:weather-fog', '雾凇', 'Rime fog'),
  51: cond('mdi:weather-partly-rainy', 'mdi:weather-partly-rainy', '毛毛雨', 'Light drizzle'),
  53: cond('mdi:weather-rainy', 'mdi:weather-rainy', '毛毛雨', 'Drizzle'),
  55: cond('mdi:weather-rainy', 'mdi:weather-rainy', '毛毛雨', 'Dense drizzle'),
  56: cond('mdi:weather-partly-snowy-rainy', 'mdi:weather-partly-snowy-rainy', '冻毛毛雨', 'Freezing drizzle'),
  57: cond('mdi:weather-snowy-rainy', 'mdi:weather-snowy-rainy', '冻毛毛雨', 'Freezing drizzle'),
  61: cond('mdi:weather-partly-rainy', 'mdi:weather-partly-rainy', '小雨', 'Light rain'),
  63: cond('mdi:weather-rainy', 'mdi:weather-rainy', '中雨', 'Rain'),
  65: cond('mdi:weather-pouring', 'mdi:weather-pouring', '大雨', 'Heavy rain'),
  66: cond('mdi:weather-snowy-rainy', 'mdi:weather-snowy-rainy', '冻雨', 'Freezing rain'),
  67: cond('mdi:weather-snowy-rainy', 'mdi:weather-snowy-rainy', '冻雨', 'Freezing rain'),
  71: cond('mdi:weather-partly-snowy', 'mdi:weather-partly-snowy', '小雪', 'Light snow'),
  73: cond('mdi:weather-snowy', 'mdi:weather-snowy', '中雪', 'Snow'),
  75: cond('mdi:weather-snowy-heavy', 'mdi:weather-snowy-heavy', '大雪', 'Heavy snow'),
  77: cond('mdi:weather-snowy', 'mdi:weather-snowy', '雪粒', 'Snow grains'),
  80: cond('mdi:weather-partly-rainy', 'mdi:weather-partly-rainy', '阵雨', 'Light showers'),
  81: cond('mdi:weather-rainy', 'mdi:weather-rainy', '阵雨', 'Showers'),
  82: cond('mdi:weather-pouring', 'mdi:weather-pouring', '暴雨', 'Violent showers'),
  85: cond('mdi:weather-partly-snowy', 'mdi:weather-partly-snowy', '阵雪', 'Snow showers'),
  86: cond('mdi:weather-snowy', 'mdi:weather-snowy', '阵雪', 'Snow showers'),
  95: cond('mdi:weather-lightning', 'mdi:weather-lightning', '雷阵雨', 'Thunderstorm'),
  96: cond('mdi:weather-lightning-rainy', 'mdi:weather-lightning-rainy', '雷阵雨伴冰雹', 'Thunderstorm with hail'),
  99: cond('mdi:weather-hail', 'mdi:weather-hail', '雷阵雨伴冰雹', 'Thunderstorm with hail'),
}

const FALLBACK = cond('mdi:weather-cloudy', 'mdi:weather-cloudy', '多云', 'Cloudy')

export function weatherCondition(code: number): Condition {
  return CONDITIONS[code] ?? FALLBACK
}

/** 拉取 Open-Meteo 当前天气 + 今日高低温；失败抛错由调用方处理 */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherNow> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day,wind_speed_10m' +
    '&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`weather http ${res.status}`)
  const j = (await res.json()) as {
    current?: Record<string, number>
    daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] }
  }
  const c = j.current
  if (!c || typeof c.temperature_2m !== 'number') throw new Error('weather bad payload')
  return {
    temp: Math.round(c.temperature_2m),
    feels: Math.round(c.apparent_temperature ?? c.temperature_2m),
    humidity: Math.round(c.relative_humidity_2m ?? 0),
    wind: Math.round(c.wind_speed_10m ?? 0),
    code: c.weather_code ?? 3,
    isDay: c.is_day !== 0,
    high: Math.round(j.daily?.temperature_2m_max?.[0] ?? c.temperature_2m),
    low: Math.round(j.daily?.temperature_2m_min?.[0] ?? c.temperature_2m),
    at: Date.now(),
  }
}

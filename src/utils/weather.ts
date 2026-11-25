/**
 * 天气小组件数据层：Open-Meteo（免费、无需 key）预报 API + WMO 天气代码映射 +
 * 预设城市表。仅在用户开启天气组件时才会发请求；结果由 useWeather 缓存到本地。
 */

export interface WeatherCity {
  id: string
  zh: string
  en: string
  ja: string
  lat: number
  lon: number
}

/** 预设城市（id 'geo' 为浏览器定位，不在此表内） */
export const WEATHER_CITIES: WeatherCity[] = [
  { id: 'beijing', zh: '北京', en: 'Beijing', ja: 'ペキン', lat: 39.9042, lon: 116.4074 },
  { id: 'shanghai', zh: '上海', en: 'Shanghai', ja: 'シャンハイ', lat: 31.2304, lon: 121.4737 },
  { id: 'guangzhou', zh: '广州', en: 'Guangzhou', ja: 'コウシュウ', lat: 23.1291, lon: 113.2644 },
  { id: 'shenzhen', zh: '深圳', en: 'Shenzhen', ja: 'シンセン', lat: 22.5431, lon: 114.0579 },
  { id: 'chengdu', zh: '成都', en: 'Chengdu', ja: 'セイトウ', lat: 30.5728, lon: 104.0668 },
  { id: 'hangzhou', zh: '杭州', en: 'Hangzhou', ja: 'コウシュウ', lat: 30.2741, lon: 120.1551 },
  { id: 'shenyang', zh: '沈阳', en: 'Shenyang', ja: 'シンヨウ', lat: 41.8057, lon: 123.4315 },
  { id: 'tokyo', zh: '东京', en: 'Tokyo', ja: '東京', lat: 35.6762, lon: 139.6503 },
  { id: 'osaka', zh: '大阪', en: 'Osaka', ja: '大阪', lat: 34.6937, lon: 135.5023 },
  { id: 'seoul', zh: '首尔', en: 'Seoul', ja: 'ソウル', lat: 37.5665, lon: 126.978 },
  { id: 'singapore', zh: '新加坡', en: 'Singapore', ja: 'シンガポール', lat: 1.3521, lon: 103.8198 },
  { id: 'london', zh: '伦敦', en: 'London', ja: 'ロンドン', lat: 51.5074, lon: -0.1278 },
  { id: 'paris', zh: '巴黎', en: 'Paris', ja: 'パリ', lat: 48.8566, lon: 2.3522 },
  { id: 'newyork', zh: '纽约', en: 'New York', ja: 'ニューヨーク', lat: 40.7128, lon: -74.006 },
  { id: 'sydney', zh: '悉尼', en: 'Sydney', ja: 'シドニー', lat: -33.8688, lon: 151.2093 },
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
  ja: string
}

function cond(iconDay: string, iconNight: string, zh: string, en: string, ja: string): Condition {
  return { iconDay, iconNight, zh, en, ja }
}

const CONDITIONS: Record<number, Condition> = {
  0: cond('mdi:weather-sunny', 'mdi:weather-night', '晴', 'Clear', '晴れ'),
  1: cond('mdi:weather-partly-cloudy', 'mdi:weather-night-partly-cloudy', '大部晴朗', 'Mostly clear', 'だいたい晴れ'),
  2: cond('mdi:weather-partly-cloudy', 'mdi:weather-night-partly-cloudy', '多云', 'Partly cloudy', '晴れ時々曇り'),
  3: cond('mdi:weather-cloudy', 'mdi:weather-cloudy', '阴', 'Overcast', '曇り'),
  45: cond('mdi:weather-fog', 'mdi:weather-fog', '雾', 'Fog', '霧'),
  48: cond('mdi:weather-fog', 'mdi:weather-fog', '雾凇', 'Rime fog', '霧氷'),
  51: cond('mdi:weather-partly-rainy', 'mdi:weather-partly-rainy', '毛毛雨', 'Light drizzle', '弱い霧雨'),
  53: cond('mdi:weather-rainy', 'mdi:weather-rainy', '毛毛雨', 'Drizzle', '霧雨'),
  55: cond('mdi:weather-rainy', 'mdi:weather-rainy', '毛毛雨', 'Dense drizzle', '強い霧雨'),
  56: cond('mdi:weather-partly-snowy-rainy', 'mdi:weather-partly-snowy-rainy', '冻毛毛雨', 'Freezing drizzle', '弱い凍結霧雨'),
  57: cond('mdi:weather-snowy-rainy', 'mdi:weather-snowy-rainy', '冻毛毛雨', 'Freezing drizzle', '凍結霧雨'),
  61: cond('mdi:weather-partly-rainy', 'mdi:weather-partly-rainy', '小雨', 'Light rain', '弱い雨'),
  63: cond('mdi:weather-rainy', 'mdi:weather-rainy', '中雨', 'Rain', '雨'),
  65: cond('mdi:weather-pouring', 'mdi:weather-pouring', '大雨', 'Heavy rain', '強い雨'),
  66: cond('mdi:weather-snowy-rainy', 'mdi:weather-snowy-rainy', '冻雨', 'Freezing rain', '凍結雨'),
  67: cond('mdi:weather-snowy-rainy', 'mdi:weather-snowy-rainy', '冻雨', 'Freezing rain', '凍結雨'),
  71: cond('mdi:weather-partly-snowy', 'mdi:weather-partly-snowy', '小雪', 'Light snow', '弱い雪'),
  73: cond('mdi:weather-snowy', 'mdi:weather-snowy', '中雪', 'Snow', '雪'),
  75: cond('mdi:weather-snowy-heavy', 'mdi:weather-snowy-heavy', '大雪', 'Heavy snow', '強い雪'),
  77: cond('mdi:weather-snowy', 'mdi:weather-snowy', '雪粒', 'Snow grains', '雪粒'),
  80: cond('mdi:weather-partly-rainy', 'mdi:weather-partly-rainy', '阵雨', 'Light showers', '弱いにわか雨'),
  81: cond('mdi:weather-rainy', 'mdi:weather-rainy', '阵雨', 'Showers', 'にわか雨'),
  82: cond('mdi:weather-pouring', 'mdi:weather-pouring', '暴雨', 'Violent showers', '激しいにわか雨'),
  85: cond('mdi:weather-partly-snowy', 'mdi:weather-partly-snowy', '阵雪', 'Snow showers', 'にわか雪'),
  86: cond('mdi:weather-snowy', 'mdi:weather-snowy', '阵雪', 'Snow showers', 'にわか雪'),
  95: cond('mdi:weather-lightning', 'mdi:weather-lightning', '雷阵雨', 'Thunderstorm', '雷雨'),
  96: cond('mdi:weather-lightning-rainy', 'mdi:weather-lightning-rainy', '雷阵雨伴冰雹', 'Thunderstorm with hail', '雹を伴う雷雨'),
  99: cond('mdi:weather-hail', 'mdi:weather-hail', '雷阵雨伴冰雹', 'Thunderstorm with hail', '雹を伴う雷雨'),
}

const FALLBACK = cond('mdi:weather-cloudy', 'mdi:weather-cloudy', '多云', 'Cloudy', '曇り')

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

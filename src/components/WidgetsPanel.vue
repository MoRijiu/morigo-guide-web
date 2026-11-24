<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useWidgets, type WidgetId } from '../composables/useWidgets'
import { WEATHER_CITIES } from '../utils/weather'
import { useI18n } from '../i18n'

const { t, locale } = useI18n()
const { enabled, setEnabled, weatherCity, setWeatherCity } = useWidgets()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const WIDGETS: { id: WidgetId; icon: string; labelKey: string }[] = [
  { id: 'clock', icon: 'mdi:clock-outline', labelKey: 'widget.clock' },
  { id: 'quote', icon: 'mdi:format-quote-close', labelKey: 'widget.quote' },
  { id: 'countdown', icon: 'mdi:calendar-clock', labelKey: 'widget.countdown' },
  { id: 'weather', icon: 'mdi:weather-partly-cloudy', labelKey: 'widget.weather' },
]

const cityOptions = computed(() =>
  WEATHER_CITIES.map((c) => ({ id: c.id, name: locale.value === 'zh' ? c.zh : c.en }))
)

function onCityChange(e: Event) {
  const id = (e.target as HTMLSelectElement).value
  const c = WEATHER_CITIES.find((x) => x.id === id)
  if (c) setWeatherCity({ id: c.id, lat: c.lat, lon: c.lon })
}

const locating = ref(false)
const locateError = ref(false)
function locate() {
  if (!('geolocation' in navigator)) {
    locateError.value = true
    return
  }
  locating.value = true
  locateError.value = false
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locating.value = false
      setWeatherCity({ id: 'geo', lat: pos.coords.latitude, lon: pos.coords.longitude })
    },
    () => {
      locating.value = false
      locateError.value = true
    },
    { timeout: 10000 }
  )
}

function onDocClick(e: MouseEvent) {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target as Node)) {
    open.value = false
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

function onOpenEvent() {
  open.value = true
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
  window.addEventListener('morigo:open-widgets', onOpenEvent)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('morigo:open-widgets', onOpenEvent)
})
</script>

<template>
  <div ref="rootEl" class="relative">
    <button
      type="button"
      class="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Icon icon="mdi:view-dashboard-outline" class="text-sm" />
      {{ t('widget.button') }}
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-1.5 z-50 w-64 max-h-[85dvh] overflow-y-auto max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:bottom-3 max-sm:top-auto max-sm:w-auto max-sm:max-h-[78dvh] rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg p-3 text-left"
      role="group"
      :aria-label="t('widget.aria')"
    >
      <button
        v-for="w in WIDGETS"
        :key="w.id"
        type="button"
        role="switch"
        :aria-checked="enabled[w.id]"
        class="w-full flex items-center justify-between px-1 py-1.5 rounded-md text-xs text-surface-600 dark:text-surface-300"
        @click="setEnabled(w.id, !enabled[w.id])"
      >
        <span class="flex items-center gap-1.5">
          <Icon :icon="w.icon" class="text-sm text-accent-500" />
          {{ t(w.labelKey) }}
        </span>
        <span
          class="relative w-8 h-[18px] rounded-full transition-colors shrink-0"
          :class="enabled[w.id] ? 'bg-accent-500' : 'bg-surface-200 dark:bg-surface-700'"
          aria-hidden="true"
        >
          <span
            class="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all"
            :style="{ left: enabled[w.id] ? '16px' : '2px' }"
          />
        </span>
      </button>
      <div v-if="enabled.weather" class="px-1 mt-1 pt-2 border-t border-surface-100 dark:border-surface-800">
        <label class="block text-[11px] text-surface-400 dark:text-surface-500 mb-1" for="morigo-weather-city">
          {{ t('widget.weather.city') }}
        </label>
        <div class="flex items-center gap-1.5">
          <select
            id="morigo-weather-city"
            class="flex-1 min-w-0 px-2 py-1.5 rounded-md text-xs border border-surface-200 dark:border-surface-700 bg-transparent text-surface-700 dark:text-surface-200 outline-none focus:border-accent-400"
            :value="weatherCity.id"
            @change="onCityChange"
          >
            <option v-if="weatherCity.id === 'geo'" value="geo">{{ t('widget.weather.myLocation') }}</option>
            <option v-for="c in cityOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <button
            type="button"
            class="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-md text-xs border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
            :disabled="locating"
            @click="locate"
          >
            <Icon icon="mdi:crosshairs-gps" class="text-sm" />
            {{ locating ? t('widget.weather.locating') : t('widget.weather.locate') }}
          </button>
        </div>
        <p v-if="locateError" class="mt-1 text-[11px] text-red-500">{{ t('widget.weather.locateError') }}</p>
      </div>
      <p class="px-1 mt-1.5 text-[11px] text-surface-300 dark:text-surface-600">{{ t('widget.note') }}</p>
    </div>
  </div>
</template>

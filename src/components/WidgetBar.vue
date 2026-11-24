<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useWidgets, daysUntil } from '../composables/useWidgets'
import { QUOTES, dailyQuoteIndex } from '../utils/quotes'
import { useI18n } from '../i18n'

const { t, locale } = useI18n()
const { enabled, countdown, setCountdown } = useWidgets()

// ==================== 时钟 ====================
const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const intlLocale = computed(() => (locale.value === 'zh' ? 'zh-CN' : 'en-US'))
const timeText = computed(() =>
  new Intl.DateTimeFormat(intlLocale.value, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now.value)
)
const dateText = computed(() =>
  new Intl.DateTimeFormat(intlLocale.value, {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(now.value)
)

// ==================== 一言 ====================
const quoteList = computed(() => QUOTES[locale.value])
const quoteIndex = ref(dailyQuoteIndex(new Date(), QUOTES.zh.length))
const quote = computed(() => quoteList.value[quoteIndex.value % quoteList.value.length])

function nextQuote() {
  if (quoteList.value.length < 2) return
  let next = quoteIndex.value
  while (next === quoteIndex.value) {
    next = Math.floor(Math.random() * quoteList.value.length)
  }
  quoteIndex.value = next
}

// ==================== 倒计时 ====================
const days = computed(() => daysUntil(countdown.value.date, now.value))
const editing = ref(false)
const editLabel = ref('')
const editDate = ref('')

function startEdit() {
  editLabel.value = countdown.value.label
  editDate.value = countdown.value.date
  editing.value = true
}

function saveEdit() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(editDate.value)) return
  setCountdown({ label: editLabel.value.trim(), date: editDate.value })
  editing.value = false
}

const countdownLabel = computed(() => countdown.value.label || t('widget.newYear'))
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4" role="region" :aria-label="t('widget.region')">
    <!-- 时钟 -->
    <div
      v-if="enabled.clock"
      class="widget-card flex items-center gap-3 rounded-lg border border-surface-200/80 dark:border-surface-700/60 bg-white dark:bg-surface-900 px-3.5 py-3"
    >
      <Icon icon="mdi:clock-outline" class="text-xl text-accent-500 shrink-0" />
      <div class="min-w-0">
        <p class="font-display text-lg leading-tight font-semibold tabular-nums text-surface-800 dark:text-surface-100">{{ timeText }}</p>
        <p class="text-[11px] text-surface-400 dark:text-surface-500 truncate">{{ dateText }}</p>
      </div>
    </div>

    <!-- 一言 -->
    <div
      v-if="enabled.quote"
      class="widget-card flex items-center gap-3 rounded-lg border border-surface-200/80 dark:border-surface-700/60 bg-white dark:bg-surface-900 px-3.5 py-3"
      :class="enabled.clock && enabled.countdown ? '' : 'sm:col-span-2'"
    >
      <Icon icon="mdi:format-quote-close" class="text-xl text-accent-500 shrink-0" />
      <div class="min-w-0 flex-1">
        <p class="text-xs leading-relaxed text-surface-700 dark:text-surface-200 line-clamp-2">{{ quote.text }}</p>
        <p class="text-[11px] text-surface-400 dark:text-surface-500 mt-0.5 truncate">—— {{ quote.author }}</p>
      </div>
      <button
        type="button"
        class="shrink-0 p-1.5 rounded-md text-surface-400 dark:text-surface-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
        :title="t('widget.another')"
        :aria-label="t('widget.another')"
        @click="nextQuote"
      >
        <Icon icon="mdi:refresh" class="text-sm block" />
      </button>
    </div>

    <!-- 倒计时 -->
    <div
      v-if="enabled.countdown"
      class="widget-card flex items-center gap-3 rounded-lg border border-surface-200/80 dark:border-surface-700/60 bg-white dark:bg-surface-900 px-3.5 py-3"
    >
      <Icon icon="mdi:calendar-clock" class="text-xl text-accent-500 shrink-0" />
      <div v-if="!editing" class="min-w-0 flex-1">
        <p class="text-lg leading-tight font-semibold text-surface-800 dark:text-surface-100">
          <template v-if="days === null">—</template>
          <template v-else-if="days > 0">{{ t('widget.daysLeft', { n: days }) }}</template>
          <template v-else-if="days === 0">{{ t('widget.today') }}</template>
          <template v-else>{{ t('widget.daysPast', { n: -days }) }}</template>
        </p>
        <p class="text-[11px] text-surface-400 dark:text-surface-500 truncate">
          {{ countdownLabel }} · {{ countdown.date }}
        </p>
      </div>
      <div v-else class="min-w-0 flex-1 flex flex-col gap-1.5">
        <input
          v-model="editLabel"
          type="text"
          maxlength="30"
          class="w-full px-2 py-1 rounded-md text-xs border border-surface-200 dark:border-surface-700 bg-transparent text-surface-700 dark:text-surface-200 outline-none focus:border-accent-400"
          :placeholder="t('widget.labelPh')"
          :aria-label="t('widget.labelPh')"
        />
        <input
          v-model="editDate"
          type="date"
          class="w-full px-2 py-1 rounded-md text-xs border border-surface-200 dark:border-surface-700 bg-transparent text-surface-700 dark:text-surface-200 outline-none focus:border-accent-400"
          :aria-label="t('widget.dateLabel')"
        />
      </div>
      <button
        v-if="!editing"
        type="button"
        class="shrink-0 p-1.5 rounded-md text-surface-400 dark:text-surface-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
        :title="t('widget.edit')"
        :aria-label="t('widget.edit')"
        @click="startEdit"
      >
        <Icon icon="mdi:pencil-outline" class="text-sm block" />
      </button>
      <button
        v-else
        type="button"
        class="shrink-0 p-1.5 rounded-md text-accent-600 dark:text-accent-400 transition-colors"
        :title="t('common.save')"
        :aria-label="t('common.save')"
        @click="saveEdit"
      >
        <Icon icon="mdi:check" class="text-sm block" />
      </button>
    </div>
  </div>
</template>

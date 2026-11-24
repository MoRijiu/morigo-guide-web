<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useWidgets, type WidgetId } from '../composables/useWidgets'
import { useI18n } from '../i18n'

const { t } = useI18n()
const { enabled, setEnabled } = useWidgets()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const WIDGETS: { id: WidgetId; icon: string; labelKey: string }[] = [
  { id: 'clock', icon: 'mdi:clock-outline', labelKey: 'widget.clock' },
  { id: 'quote', icon: 'mdi:format-quote-close', labelKey: 'widget.quote' },
  { id: 'countdown', icon: 'mdi:calendar-clock', labelKey: 'widget.countdown' },
]

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
      class="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg p-3 text-left"
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
      <p class="px-1 mt-1.5 text-[11px] text-surface-300 dark:text-surface-600">{{ t('widget.note') }}</p>
    </div>
  </div>
</template>

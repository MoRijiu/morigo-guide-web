<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import {
  detectWithNative,
  decodeWithJsQr,
  decodeQrFromImageFile,
} from '../utils/syncScan'
import { useI18n } from '../i18n'

const { t } = useI18n()

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; scanned: [code: string] }>()

const videoEl = ref<HTMLVideoElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const errorKey = ref('')
const cameraActive = ref(false)

let stream: MediaStream | null = null
let rafId = 0
let lastScanAt = 0
let stopped = true
const canvas = document.createElement('canvas')

function stopCamera() {
  stopped = true
  cancelAnimationFrame(rafId)
  if (stream) {
    for (const track of stream.getTracks()) track.stop()
    stream = null
  }
  cameraActive.value = false
}

async function scanFrame() {
  if (stopped) return
  const video = videoEl.value
  const now = performance.now()
  if (video && video.readyState >= 2 && now - lastScanAt >= 150) {
    lastScanAt = now
    try {
      let text = await detectWithNative(video)
      if (!text && video.videoWidth > 0) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          text = await decodeWithJsQr(
            ctx.getImageData(0, 0, canvas.width, canvas.height),
          )
        }
      }
      if (text) {
        stopCamera()
        emit('scanned', text)
        return
      }
    } catch {
      // 单帧解码失败不中断扫描，下一帧继续
    }
  }
  rafId = requestAnimationFrame(() => void scanFrame())
}

async function startCamera() {
  errorKey.value = ''
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    errorKey.value = 'dt.scanNoCamera'
    return
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    })
  } catch {
    errorKey.value = 'dt.scanCameraError'
    return
  }
  // 打开期间用户已关闭弹窗则立即释放相机
  if (!props.open) {
    stopCamera()
    return
  }
  const video = videoEl.value
  if (!video) {
    stopCamera()
    return
  }
  video.srcObject = stream
  try {
    await video.play()
  } catch {
    // play 被打断时帧循环仍会按 readyState 尝试解码
  }
  cameraActive.value = true
  stopped = false
  rafId = requestAnimationFrame(() => void scanFrame())
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      void startCamera()
    } else {
      stopCamera()
      errorKey.value = ''
    }
  },
)

onBeforeUnmount(stopCamera)

function onClose() {
  stopCamera()
  emit('close')
}

async function onImageFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const text = await decodeQrFromImageFile(file)
  if (text) {
    stopCamera()
    emit('scanned', text)
  } else {
    errorKey.value = 'dt.scanNoCode'
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
    role="dialog"
    aria-modal="true"
    :aria-label="t('dt.scanTitle')"
  >
    <div class="absolute inset-0 bg-surface-950/40 backdrop-blur-[2px]" @click="onClose" />
    <div
      class="float-panel relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-xl p-4 max-h-[85dvh] overflow-y-auto"
    >
      <div class="flex items-center gap-2">
        <Icon icon="mdi:qrcode-scan" class="text-lg text-accent-600 dark:text-accent-400" />
        <h2 class="text-sm font-semibold text-surface-800 dark:text-surface-100">{{ t('dt.scanTitle') }}</h2>
        <button
          type="button"
          class="ml-auto w-8 h-8 flex items-center justify-center rounded-md text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          :aria-label="t('form.close')"
          @click="onClose"
        >
          <Icon icon="mdi:close" class="text-base" />
        </button>
      </div>
      <p class="mt-1.5 text-xs text-surface-500 dark:text-surface-400">{{ t('dt.scanHint') }}</p>

      <div class="mt-3 overflow-hidden rounded-lg bg-surface-950 aspect-[4/3] flex items-center justify-center">
        <video
          ref="videoEl"
          class="w-full h-full object-cover"
          :class="cameraActive ? '' : 'hidden'"
          playsinline
          muted
        />
        <p v-if="!cameraActive" class="px-4 text-center text-[11px] text-surface-400">
          {{ errorKey ? t(errorKey) : t('dt.scanStarting') }}
        </p>
      </div>
      <p v-if="errorKey === 'dt.scanNoCode'" class="mt-2 text-[11px] text-red-500" role="alert">{{ t(errorKey) }}</p>

      <button
        type="button"
        class="w-full flex items-center justify-center gap-1.5 px-2 py-2 mt-3 rounded-md text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
        @click="fileInput?.click()"
      >
        <Icon icon="mdi:image-outline" class="text-sm" />
        {{ t('dt.scanFromImage') }}
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onImageFile"
      />
    </div>
  </div>
</template>

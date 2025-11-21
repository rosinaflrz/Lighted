<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

type Props = {
  beforeSrc: string
  afterSrc: string
  altBefore?: string
  altAfter?: string
  initial?: number
}
const props = withDefaults(defineProps<Props>(), {
  altBefore: 'Before',
  altAfter: 'After',
  initial: 50,
})

const root = ref<HTMLElement | null>(null)
const split = ref(props.initial)
let dragging = false

function setSplitFromClientX(x: number) {
  const el = root.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const pct = ((x - rect.left) / rect.width) * 100
  split.value = Math.min(100, Math.max(0, pct))
}

function onPointerDown(e: MouseEvent | TouchEvent) {
  dragging = true
  root.value?.classList.add('dragging')

  if ("touches" in e && e.touches?.[0]) {
    setSplitFromClientX(e.touches[0].clientX)
  } else if ("clientX" in e) {
    setSplitFromClientX(e.clientX)
  }
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  if (!dragging) return

  if ("touches" in e && e.touches?.[0]) {
    setSplitFromClientX(e.touches[0].clientX)
  } else if ("clientX" in e) {
    setSplitFromClientX(e.clientX)
  }
}

function onPointerUp() {
  dragging = false
  root.value?.classList.remove('dragging')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') split.value = Math.max(0, split.value - 2)
  if (e.key === 'ArrowRight') split.value = Math.min(100, split.value + 2)
}

onMounted(() => {
  window.addEventListener('mousemove', onPointerMove)
  window.addEventListener('touchmove', onPointerMove, { passive: false })
  window.addEventListener('mouseup', onPointerUp)
  window.addEventListener('touchend', onPointerUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('touchmove', onPointerMove)
  window.removeEventListener('mouseup', onPointerUp)
  window.removeEventListener('touchend', onPointerUp)
})
</script>

<template>
  <div
    ref="root"
    class="compare"
    :style="{'--split': split + '%'}"
    @mousedown="onPointerDown"
    @touchstart.prevent="onPointerDown"
  >
    <!-- BEFORE -->
    <img class="img before" :src="beforeSrc" :alt="altBefore" draggable="false" />

    <!-- AFTER -->
    <img class="img after" :src="afterSrc" :alt="altAfter" draggable="false" />

    <div class="mask" aria-hidden="true"></div>

    <button
      class="divider"
      type="button"
      :style="{ left: `calc(var(--split))` }"
      aria-label="Drag to compare"
      @keydown="onKey"
    >
      <span class="handle"></span>
    </button>
  </div>
</template>

<style scoped>
.compare {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  user-select: none;
  touch-action: none;
  background: #00000008;
  box-shadow: 0 12px 24px rgba(0,0,0,.08);
}

.img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.before { z-index: 0; }
.after  {
  z-index: 1;
  clip-path: polygon(0 0, var(--split) 0, var(--split) 100%, 0 100%);
}

.mask {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.divider {
  position: absolute;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  width: 4px;
  background: rgba(0,0,0,.7);
  box-shadow: 0 0 0 2px rgba(255,255,255,.55);
  cursor: ew-resize;
  border: none;
}

.handle {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,.2);
}
</style>

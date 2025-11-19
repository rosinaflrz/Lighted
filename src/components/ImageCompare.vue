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

function onPointerDown(e: PointerEvent | MouseEvent | TouchEvent) {
  dragging = true
  ;(root.value as HTMLElement).classList.add('dragging')
  if (e instanceof TouchEvent) {
    setSplitFromClientX(e.touches[0].clientX)
  } else {
    setSplitFromClientX((e as PointerEvent).clientX)
  }
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  if (!dragging) return
  if (e instanceof TouchEvent) setSplitFromClientX(e.touches[0].clientX)
  else setSplitFromClientX(e.clientX)
}

function onPointerUp() {
  dragging = false
  ;(root.value as HTMLElement)?.classList.remove('dragging')
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
    <img class="img before" :src="beforeSrc" :alt="altBefore" draggable="false" />
    <img class="img after"  :src="afterSrc"  :alt="altAfter"  draggable="false" />

    <div class="mask" aria-hidden="true" />

    <button
      class="divider"
      type="button"
      :style="{ left: `calc(var(--split))` }"
      aria-label="Drag to compare"
      @keydown="onKey"
    >
      <span class="handle" />
    </button>
  </div>
</template>

<style scoped>
.compare{
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

.img{
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  pointer-events: none;
}
.before{ z-index: 0; }
.after{  z-index: 1; }

.mask{
  position: absolute;
  inset: 0;
  pointer-events: none;
  clip-path: polygon(0 0, var(--split) 0, var(--split) 100%, 0 100%);
  background: transparent;
}
.mask::before{
  content: "";
  position: absolute;
  inset: 0;
  background: center/cover no-repeat;
  display:none;
}

.after{
  clip-path: polygon(0 0, var(--split) 0, var(--split) 100%, 0 100%);
}

.divider{
  position: absolute;
  top: 0; bottom: 0;
  margin: 0;
  transform: translateX(-50%);
  width: 4px;
  background: rgba(0,0,0,.7);
  box-shadow: 0 0 0 2px rgba(255,255,255,.55);
  cursor: ew-resize;
  border: none;
  padding: 0;
}
.divider:focus-visible{ outline: 2px solid #111; outline-offset: 2px; }

.handle{
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: 22px; height: 22px; border-radius: 999px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,.2), inset 0 0 0 1px rgba(0,0,0,.12);
}
.compare.dragging .divider .handle{ transform: translate(-50%, -50%) scale(1.05); }
</style>

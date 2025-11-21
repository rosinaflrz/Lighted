<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import logo from '../assets/images/3.png';
import cameraHand from '../assets/images/2.png';
const bgUrl = new URL('../assets/images/7.png', import.meta.url).href;
import image10 from '../assets/images/10.png';
import image11 from '../assets/images/11.png';
import image13 from '../assets/images/13.png';
import { authService } from '../services/auth';

const router = useRouter();
const userName = ref<string>('user');

// ===== Logout =====
function onLogout() {
  authService.logout();
  router.push('/signin');
}

// ===== Slider =====
const sliderContainer = ref<HTMLDivElement | null>(null);
const containerWidth = ref(0);
const isDragging = ref(false);
const handlePosition = ref(50);

// Inicia drag
function startDrag(event: MouseEvent | TouchEvent) {
  event.preventDefault();
  isDragging.value = true;
  if (sliderContainer.value) {
    containerWidth.value = sliderContainer.value.offsetWidth;
  }
}

// Drag 
function onDrag(event: MouseEvent | TouchEvent) {
  if (!isDragging.value || !sliderContainer.value) return;

  const rect = sliderContainer.value.getBoundingClientRect();
  let clientX: number;

  // ---- TOUCH ----
  if ('touches' in event && event.touches && event.touches.length > 0) {
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    clientX = firstTouch.clientX;
  }
  // ---- MOUSE ----
  else if ('clientX' in event) {
    clientX = (event as MouseEvent).clientX;
  } else {
    return;
  }

  let newX = ((clientX - rect.left) / rect.width) * 100;
  if (newX < 0) newX = 0;
  if (newX > 100) newX = 100;
  handlePosition.value = newX;
}

function stopDrag() {
  isDragging.value = false;
}

function onResize() {
  if (sliderContainer.value) {
    containerWidth.value = sliderContainer.value.offsetWidth;
  }
}

onMounted(() => {
  const rawEmail = authService.getUserEmail();          // string | undefined
  const email: string = rawEmail ?? 'user@example.com'; // ya es string
  userName.value = email.split('@')[0] || 'user';

  // ========= Slider =========
  if (sliderContainer.value) {
    containerWidth.value = sliderContainer.value.offsetWidth;
  }

  window.addEventListener('mousemove', onDrag);
  window.addEventListener('touchmove', onDrag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchend', stopDrag);
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('touchmove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchend', stopDrag);
  window.removeEventListener('resize', onResize);
});
</script>

<template>
  <div class="page" :style="{ backgroundImage: `url(${bgUrl})` }">
    <div class="grid-overlay"></div>

    <!-- Logo -->
    <img class="logo" :src="logo" alt="lighted" />

    <!-- Botón power (logout) -->
    <button class="power-btn" @click="onLogout" aria-label="log out">
      <svg class="power-icon" viewBox="0 0 24 24">
        <path d="M12 3v6" />
        <path d="M7.757 6.343a6 6 0 1 0 8.486 0" />
      </svg>
    </button>

    <!-- Bienvenida -->
    <h2 class="welcome">
      welcome back <span class="name">{{ userName }}</span>
    </h2>

    <!-- Botones de navegación -->
    <div class="nav-buttons">
      <button class="nav-btn" @click="router.push('/dashboard/edit')">
        upload a photo
      </button>
      <button class="nav-btn" @click="router.push('/dashboard/projects')">
        projects
      </button>
      <button class="nav-btn" @click="router.push('/dashboard/settings')">
        settings
      </button>
    </div>

    <!-- Mano con cámara -->
    <img class="camera-hand" :src="cameraHand" alt="Hand holding a camera" />

    <!-- Título principal -->
    <h1 class="main-title">
      Edita tus <span class="main-title-highlight">fotos</span> en segundos
    </h1>

    <!-- Tarjeta de fondo -->
    <div class="orange-card" aria-hidden="true"></div>

    <!-- Skydiver -->
    <img class="skydiver-image" :src="image10" alt="Skydiver" />

    <!-- Slider de comparación -->
    <div
      ref="sliderContainer"
      class="comparison-slider"
      @mousedown.prevent="startDrag"
      @touchstart.prevent="startDrag"
    >
      <img class="slider-image-before" :src="image11" alt="Antes" />
      <div class="slider-image-after-wrapper" :style="{ width: handlePosition + '%' }">
        <img
          class="slider-image-after"
          :src="image13"
          alt="Después"
          :style="{ width: containerWidth + 'px' }"
        />
      </div>
      <div class="slider-handle" :style="{ left: handlePosition + '%' }">
        <div class="slider-handle-line"></div>
        <div class="slider-handle-circle"></div>
      </div>
    </div>
  </div>
</template>


<style scoped src="@/assets/css/dashboardLanding.css"></style>
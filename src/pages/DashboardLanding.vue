<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from 'vue-router'; // Importa el router

// Importaciones de Imágenes
import logo from "../assets/3.png";
import cameraHand from "../assets/2.png";
const bgUrl = new URL("../assets/7.png", import.meta.url).href;

import image10 from "../assets/10.png"; // Skydiver derecha
import image11 from "../assets/11.png"; // Slider Antes (Térmica)
import image13 from "../assets/13.png"; // Slider Después (Normal)

const router = useRouter(); // Inicializa el router
const userName = ref("rosina"); // <-- 🚀 CAMBIO REALIZADO AQUÍ

function onLogout() {
  console.log("logout");
  router.push('/signin'); // Navega a SignIn
}

const sliderContainer = ref<HTMLDivElement | null>(null);
const containerWidth = ref(0);
const isDragging = ref(false);
const handlePosition = ref(50); // Posición inicial (50%)

// Función para iniciar el arrastre
function startDrag(event: MouseEvent | TouchEvent) {
  event.preventDefault();
  isDragging.value = true;
  // Obtenemos el ancho del contenedor en este momento
  if (sliderContainer.value) {
    containerWidth.value = sliderContainer.value.offsetWidth;
  }
}

function onDrag(event: MouseEvent | TouchEvent) {
  if (!isDragging.value || !sliderContainer.value) return;

  const rect = sliderContainer.value.getBoundingClientRect();
  // Obtiene la posición X del cliente, funciona para mouse y touch
  const clientX = (event as TouchEvent).touches
    ? (event as TouchEvent).touches[0].clientX
    : (event as MouseEvent).clientX;
  
  let newX = ((clientX - rect.left) / rect.width) * 100;

  // Limitar a 0% - 100%
  if (newX < 0) newX = 0;
  if (newX > 100) newX = 100;

  handlePosition.value = newX;
}

// Función para detener el arrastre
function stopDrag() {
  isDragging.value = false;
}

onMounted(() => {
  // Asignar el ancho del contenedor una vez que esté montado
  if (sliderContainer.value) {
    containerWidth.value = sliderContainer.value.offsetWidth;
  }

  // Listeners para mover y soltar
  window.addEventListener("mousemove", onDrag);
  window.addEventListener("touchmove", onDrag);
  window.addEventListener("mouseup", stopDrag);
  window.addEventListener("touchend", stopDrag);
});

onUnmounted(() => {
  // Limpiar listeners al desmontar el componente
  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("touchmove", onDrag);
  window.removeEventListener("mouseup", stopDrag);
  window.removeEventListener("touchend", stopDrag);
});

</script>

<template>
  <div class="page" :style="{ backgroundImage: `url(${bgUrl})` }">
    <div class="grid-overlay"></div> <img class="logo" :src="logo" alt="lighted" />

    <h2 class="welcome">
      welcome back <span class="name">{{ userName }}</span>
    </h2>

    <div class="nav-buttons">
      <button class="nav-btn" @click="router.push('/dashboard/edit')">upload a photo</button>
      <button class="nav-btn" @click="router.push('/dashboard/projects')">projects</button>
      <button class="nav-btn" @click="router.push('/dashboard/settings')">settings</button>
    </div>

    <button class="power-btn" @click="onLogout" aria-label="log out">
      <svg class="power-icon" viewBox="0 0 24 24">
        <path d="M12 3v6" />
        <path d="M7.757 6.343a6 6 0 1 0 8.486 0" />
      </svg>
    </button>

    <img class="camera-hand" :src="cameraHand" alt="Hand holding a camera" />

    <h1 class="main-title">
      Edita tus <span class="main-title-highlight">fotos</span> en segundos
    </h1>

    <div class="orange-card" aria-hidden="true"></div>

    <img class="skydiver-image" :src="image10" alt="Skydiver" />

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

<style scoped>
:global(:root) { --grid: 80px; }

.page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background-color: #f7f0f6;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 2560px 1440px;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

/* ===== GRID ROJO ===== */
.grid-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background-image:
    repeating-linear-gradient(
      to bottom,
      rgba(255, 0, 0, 0.25) 0,
      rgba(255, 0, 0, 0.25) 1px,
      transparent 1px,
      transparent var(--grid)
    ),
    repeating-linear-gradient(
      to right,
      rgba(255, 0, 0, 0.25) 0,
      rgba(255, 0, 0, 0.25) 1px,
      transparent 1px,
      transparent var(--grid)
    );
  
  display: none;
  
}

/* ... (Todo tu CSS para Logo, Welcome, Power Button, Nav Buttons se mantiene igual) ... */
/* ===== LOGO ===== */
.logo {
  position: absolute;
  top: -10px;
  left: 80px;
  width: 340px;
  height: auto;
  user-select: none;
  pointer-events: none;
  z-index: 2;
}

/* ===== WELCOME ===== */
.welcome {
  position: absolute;
  top: 250px;
  left: 105px;
  margin: 0;
  font-size: 48px;
  font-weight: 800;
  color: #374151;
  user-select: none;
  z-index: 2;
}
.name { color: #5da87a; }

/* ===== POWER BUTTON ===== */
.power-btn {
  position: absolute;
  top: 85px;
  right: 79px;
  width: 70px;
  height: 70px;
  border-radius: 999px;
  border: none;
  outline: none;
  background: #d9b3b3;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background .25s ease,
    transform .18s ease,
    box-shadow .25s ease;
  box-shadow: none;
  z-index: 2;
}
.power-btn:hover {
  background: #d64545;
  transform: translateY(-1.5px);
  box-shadow:
    0 0 20px rgba(214, 69, 69, 0.55),
    0 0 80px rgba(214, 69, 69, 0.35),
    0 0 140px rgba(214, 69, 69, 0.25);
}
.power-btn:active { transform: scale(0.96); }
.power-icon {
  width: 50px;
  height: 50px;
  color: #3a3a3a;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  transition: color .25s ease;
}
.power-btn:hover .power-icon { color: #fff; }

/* ===== NAV BUTTONS ===== */
.nav-buttons {
  position: absolute;
  top: 305px;
  right: 152px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  padding: 10px 20px;
  background: #e5e7eb;
  color: #374151;
  border: none;
  outline: none;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.nav-btn:hover {
  background: #5da87a;
  color: #fff;
  transform: translateY(-1px);
}
.nav-btn:active { transform: scale(0.97); }

/* ===== IMAGEN MANO CON CÁMARA ===== */
.camera-hand {
  position: absolute;
  top: 370px;
  left: -50px;
  width: 550px;
  height: auto;
  user-select: none;
  pointer-events: none;
  z-index: 2;
}

/* ===== TÍTULO ===== */
.main-title {
  position: absolute;
  top: 380px;
  left: 500px;
  margin: 0;
  font-size: 44px;
  font-weight: 800;
  color: #374151;
  user-select: none;
  z-index: 2;
  line-height: 1.2;
}
.main-title-highlight { color: #ef8b66; }

/* ===== TARJETA NARANJA ===== */
.orange-card {
  position: absolute;
  top: 355px;
  left: 160px;
  right: 152px;
  height: 400px;
  border-radius: 28px;
  background: linear-gradient(180deg, #f2dfd2, #f5e7dc);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);
  z-index: 1;
}

/* ----- Imagen Skydiver (Derecha) ----- */
.skydiver-image {
  position: absolute;
  z-index: 2;
  top: 480px;
  right: 60px;
  width: 550px;
  height: auto;
  border-radius: 0px;
  user-select: none;
  pointer-events: none;
}

/* ----- Slider de Comparación (Izquierda) ----- */
.comparison-slider {
  position: absolute;
  z-index: 2;
  top: 480px;
  left: 480px;
  width: 400px;
  border-radius: 0px;
  /* background-color: red; <-- ELIMINADO */
  overflow: hidden;
  user-select: none;
  cursor: ew-resize;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.slider-image-before {
  display: block;
  width: 100%;
  height: auto; /* <-- La imagen base define la altura */
  pointer-events: none;
  border-radius: 0px; 
}

.slider-image-after-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%; /* <-- Hereda la altura */
  overflow: hidden;
  pointer-events: none;
  border-radius: 0px; 
}

.slider-image-after {
  display: block;
  height: 100%; /* <-- Hereda la altura */
  max-width: none;
  pointer-events: none;
  border-radius: 0px; 
}

.slider-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  pointer-events: none;
}

.slider-handle-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 5px rgba(0,0,0,0.3);
}

.slider-handle-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
}

/* ===== TABLET ===== */
@media (min-width: 981px) and (max-width: 1200px) {
  .camera-hand { top: 400px; left: -80px; width: 480px; }
  .main-title { top: 380px; left: auto; right: 200px; font-size: 40px; }
  .nav-buttons { right: 170px; }

  /* Ajustar nuevos elementos */
  .skydiver-image { top: 460px; right: 170px; width: 250px; }
  .comparison-slider { top: 460px; left: 450px; width: 250px; }
}

/* ===== MÓVIL ===== */
@media (max-width: 980px) {
  .power-btn { top: 24px; right: 24px; width: 60px; height: 60px; }
  .power-icon { width: 34px; height: 34px; }
  .logo { width: 240px; left: 24px; top: 16px; }
  .welcome { left: 24px; top: 140px; font-size: 36px; }
  .nav-buttons { top: 180px; right: 16px; gap: 8px; }
  .nav-btn { padding: 8px 14px; font-size: 14px; }
  .orange-card { top: 220px; left: 16px; right: 16px; height: auto; bottom: 24px; }
  .camera-hand { top: 250px; left: -20px; width: 280px; }
  .main-title { top: 244px; left: auto; right: 24px; font-size: 32px; max-width: 55%; text-align: right; }

  .skydiver-image {
    top: 450px;
    right: 24px;
    width: 45%; 
  }
  .comparison-slider {
    top: 450px;
    left: 24px;
    width: 45%; 
  }
}
</style>
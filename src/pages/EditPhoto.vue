<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// ===== 🚀 IMAGENES HARDCODEADAS 🚀 =====
import logo from '../assets/3.png'; // <-- AÑADIDO: Importa el logo
import image10 from '../assets/10.png';

const router = useRouter();

const imageDisplayUrl = ref(image10);
const thumbnailDisplayUrl = ref(image10);

function onExit() {
  // ===== 🚀 RUTA ACTUALIZADA 🚀 =====
  router.push('/dashboard/edit'); // Te lleva de vuelta a Upload Photo
}

function onLogout() {
  console.log("logout");
  router.push('/signin'); // Navega a SignIn
}

function onDownload() {
  console.log('Descargando imagen...');
  const link = document.createElement('a');
  link.href = imageDisplayUrl.value;
  link.download = 'edited-image.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<template>
  <div class="edit-page-standalone">
    <img :src="logo" alt="Lighted Logo" class="logo-standalone" />
    <button class="logout-btn-standalone" @click="onLogout" aria-label="log out">
      log out
    </button>

    <div class="edit-layout">
      <div class="image-area">
        <img :src="imageDisplayUrl" alt="Imagen principal" class="main-image" />
        
        <button class="exit-btn" @click="onExit">
          exit
        </button>
      </div>

      <aside class="edit-sidebar">
        <div class="thumbnail-section">
          <img :src="thumbnailDisplayUrl" alt="Thumbnail" class="thumbnail-image" />
          <span class="edit-text">edit</span>
        </div>

        <div class="controls-grid">
          <button class="control-btn">X</button>
          <button class="control-btn">&lt;</button>
          
          <button class="control-btn">X</button>
          <button class="control-btn">X</button>
          
          <button class="control-btn">X</button>
          <button class="control-btn">X</button>
          
          <button class="control-btn">X</button>
          <button class="control-btn">X</button>
          
          <button class="control-btn">X</button>
          <button class="control-btn">X</button>
        </div>

        <div class="green-buttons">
          <button class="green-btn">X</button>
          <button class="green-btn">X</button>
          <button class="green-btn">X</button>
          <button class="green-btn">X</button>
        </div>

        <button class="download-btn" @click="onDownload">
          download image
        </button>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* Nuevo contenedor principal para la página independiente */
.edit-page-standalone {
  display: flex;
  flex-direction: column; /* Organiza logo, logout y el layout de edición */
  min-height: 100vh;
  background-color: #ffffff;
  position: relative;
}

.logo-standalone {
  position: absolute;
  top: 40px;
  left: 80px;
  width: 150px;
  height: auto;
  z-index: 10; /* Para asegurar que esté encima */
}

.logout-btn-standalone {
  position: absolute;
  top: 40px;
  right: 80px;
  background-color: #fbebee;
  color: #d64545;
  border: none;
  border-radius: 999px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  z-index: 10;
}
.logout-btn-standalone:hover {
  background-color: #f8e1e1;
}


/* El resto del estilo es similar al anterior, pero ahora el .edit-layout
   ocupará el espacio restante después del logo y el botón de logout.
   Ajusta los padding y margenes si es necesario para que el layout
   no choque con el logo y el botón de logout. */

.edit-layout {
  display: flex;
  flex-grow: 1; /* Para que ocupe el espacio restante */
  padding-top: 100px; /* Ajusta este valor para dar espacio al logo/logout */
}

/* ======================= */
/* ===== ÁREA DE IMAGEN ===== */
/* ======================= */
.image-area {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 40px;
}

.main-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.exit-btn {
  position: absolute;
  bottom: 40px;
  left: 40px;
  background-color: #fbebee;
  color: #d64545;
  border: none;
  border-radius: 999px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.exit-btn:hover {
  background-color: #f8e1e1;
}

/* ======================= */
/* ===== SIDEBAR DERECHO ===== */
/* ======================= */
.edit-sidebar {
  width: 280px;
  flex-shrink: 0;
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: linear-gradient(to bottom, rgba(230, 245, 236, 0.8), rgba(230, 245, 236, 0.2));
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.5);
  overflow-y: auto;
}

.thumbnail-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #d1d5db;
}

.thumbnail-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #fff;
}

.edit-text {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.control-btn {
  background-color: #e6f5ec;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 16px;
  font-size: 20px;
  font-weight: bold;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.control-btn:hover {
  background-color: #d1fae5;
}

.green-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.green-btn {
  background-color: #66a182;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.green-btn:hover {
  background-color: #599071;
}

.download-btn {
  background-color: #66a182;
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  margin-top: auto;
  transition: background-color 0.2s ease;
}

.download-btn:hover {
  background-color: #599071;
}

/* ======================= */
/* ===== RESPONSIVE ===== */
/* ======================= */
@media (max-width: 1200px) {
  .logo-standalone {
    top: 20px;
    left: 40px;
    width: 120px;
  }
  .logout-btn-standalone {
    top: 20px;
    right: 40px;
    padding: 10px 20px;
  }
  .edit-layout {
    flex-direction: column; /* En pantallas pequeñas, el sidebar se pone debajo */
    padding-top: 80px; /* Ajusta para el logo/logout */
  }
  .image-area {
    padding: 20px;
    height: 60vh; /* Que ocupe más espacio vertical */
  }
  .edit-sidebar {
    width: 100%; /* Ocupa todo el ancho */
    padding: 20px;
    border-left: none; /* Elimina borde izquierdo */
    border-top: 1px solid rgba(255, 255, 255, 0.5); /* Añade borde superior */
  }
  .exit-btn {
    bottom: 20px;
    left: 20px;
  }
}

@media (max-width: 768px) {
  .logo-standalone {
    width: 100px;
    left: 20px;
  }
  .logout-btn-standalone {
    right: 20px;
    padding: 8px 16px;
    font-size: 14px;
  }
  .edit-layout {
    padding-top: 60px;
  }
  .image-area {
    height: 50vh;
  }
  .main-image {
    border-radius: 8px;
  }
  .exit-btn {
    bottom: 15px;
    left: 15px;
    padding: 10px 20px;
    font-size: 14px;
  }
  .thumbnail-image {
    width: 50px;
    height: 50px;
  }
  .edit-text {
    font-size: 20px;
  }
  .control-btn, .green-btn, .download-btn {
    padding: 12px;
    font-size: 16px;
  }
}
</style>
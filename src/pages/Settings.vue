<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import bgBlur from '../assets/17.png';
import { authService } from '../services/auth';

const router = useRouter();
const userEmail = computed(() => authService.getUserEmail() || 'user@email.com');
const userInitial = computed(() => userEmail.value.charAt(0).toUpperCase());

// --- Estado Cambio de Contraseña ---
const showPasswordForm = ref(false);
const currentPass = ref('');
const newPass = ref('');
const passMsg = ref('');
const passError = ref(false);
const loadingPass = ref(false);

async function onChangePassword() {
  if (!currentPass.value || !newPass.value) return;
  if (newPass.value.length < 8) {
    passMsg.value = "La nueva contraseña debe tener 8+ caracteres";
    passError.value = true;
    return;
  }

  loadingPass.value = true;
  passMsg.value = "";
  passError.value = false;

  try {
    await authService.changePassword(currentPass.value, newPass.value);
    passMsg.value = "Contraseña actualizada correctamente ✅";
    currentPass.value = "";
    newPass.value = "";
    setTimeout(() => { showPasswordForm.value = false; passMsg.value = ""; }, 2000);
  } catch (err: any) {
    passError.value = true;
    passMsg.value = err.message;
  } finally {
    loadingPass.value = false;
  }
}

// --- Eliminar Cuenta ---
async function deleteAccount() {
  if (confirm('¿ESTÁS SEGURO? ⚠️\nEsto borrará todos tus proyectos y no se puede deshacer.')) {
    try {
      await authService.deleteAccountPermanent();
      router.push('/signin');
    } catch (e) {
      alert("Error al eliminar la cuenta");
    }
  }
}
</script>

<template>
  <main class="main-content">
    <div class="settings-layout">
      <div class="settings-options">
        <h2 class="main-title">settings</h2>
        
        <div class="profile-header">
          <div class="profile-initial">{{ userInitial }}</div>
          <span class="profile-email">{{ userEmail }}</span>
        </div>

        <div class="divider"></div>

        <div class="option">
          <span class="option-title">Support</span>
          <span class="option-desc">Need help? Contact support@lighted.com</span>
        </div>

        <div class="option">
          <div class="option-header" @click="showPasswordForm = !showPasswordForm">
            <span class="option-title pointer">Security & Password</span>
            <span class="chevron" :class="{ rotated: showPasswordForm }">▼</span>
          </div>
          
          <div v-if="showPasswordForm" class="password-form">
            <input type="password" v-model="currentPass" placeholder="Current Password" />
            <input type="password" v-model="newPass" placeholder="New Password (8+ chars)" />
            
            <p v-if="passMsg" :class="{ error: passError, success: !passError }">{{ passMsg }}</p>
            
            <button class="btn-save" @click="onChangePassword" :disabled="loadingPass">
              {{ loadingPass ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </div>

        <div class="divider"></div>

        <div class="danger-zone">
          <p>Danger Zone</p>
          <button class="btn-danger" @click="deleteAccount">
            Delete Account
          </button>
        </div>

      </div>
      
      <img :src="bgBlur" class="blur-background" alt="" aria-hidden="true" />
    </div>
  </main>
</template>

<style scoped>
.main-content {
  flex-grow: 1;
  background-color: #f9fafb;
  position: relative;
  overflow: hidden;
  height: 100vh;
  overflow-y: auto;
}

.settings-layout {
  display: flex;
  height: 100%;
}

.settings-options {
  flex-grow: 1;
  padding: 50px;
  z-index: 2;
  max-width: 600px;
}

.main-title {
  font-size: 32px;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 40px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 30px;
}

.profile-initial {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 50%;
  background-color: #66a182;
  color: white;
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 700;
}

.profile-email {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 24px 0;
}

.option {
  margin-bottom: 20px;
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.option-title {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.option-desc {
  font-size: 15px;
  color: #6b7280;
  margin-top: 4px;
  display: block;
}

.chevron {
  font-size: 12px;
  color: #9ca3af;
  transition: transform 0.2s;
}
.chevron.rotated {
  transform: rotate(180deg);
}

/* Formulario Password */
.password-form {
  margin-top: 16px;
  background: white;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.password-form input {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  outline: none;
}

.password-form input:focus {
  border-color: #66a182;
}

.btn-save {
  align-self: flex-start;
  background: #111827;
  color: white;
  padding: 8px 20px;
  border-radius: 999px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}
.btn-save:disabled { opacity: 0.7; }

.error { color: #dc2626; font-size: 14px; }
.success { color: #16a34a; font-size: 14px; }

.danger-zone p {
  font-size: 14px;
  font-weight: 700;
  color: #991b1b;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-danger {
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 600;
  color: #dc2626;
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background-color: #fee2e2;
  border-color: #fca5a5;
}

.blur-background {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 450px;
  object-fit: cover;
  z-index: 1;
  pointer-events: none;
  opacity: 0.8;
}
</style>
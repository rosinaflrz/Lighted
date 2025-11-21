<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import bgBlur from '../assets/images/17.png';
import { authService } from '../services/auth';

const router = useRouter();
const userEmail = computed(() => authService.getUserEmail() || 'user@email.com');
const userInitial = computed(() => userEmail.value.charAt(0).toUpperCase());

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

// --- Eliminar cuenta ---
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

<style scoped src="@/assets/css/settings.css"></style>
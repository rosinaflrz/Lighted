<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import bgBlur from '../assets/17.png';

const router = useRouter();

const userEmail = ref(localStorage.getItem('userEmail') || 'rosina@email.com');
const userInitial = computed(() => userEmail.value.charAt(0).toLowerCase());

function deleteAccount() {
  if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
    console.log('Deleting account...');
    router.push('/signin');
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
        <div class="option">
          <span class="option-title">support</span>
          <span class="option-desc">lorem ipsum</span>
        </div>
        <div class="option">
          <span class="option-title">profile</span>
        </div>
        <button class="btn-danger" @click="deleteAccount">
          delete account
        </button>
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
}
.settings-layout {
  display: flex;
  height: 100%;
}
.settings-options {
  flex-grow: 1;
  padding: 50px;
  z-index: 2;
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
  margin-bottom: 40px;
}
.profile-initial {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 50%;
  background-color: #66a182;
  color: white;
  display: grid;
  place-items: center;
  font-size: 24px;
  font-weight: 600;
}
.profile-email {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}
.option {
  margin-bottom: 24px;
}
.option-title {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}
.option-desc {
  font-size: 16px;
  color: #6b7280;
}
.btn-danger {
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  color: #d64545;
  background-color: #fbebee;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 20px;
}
.btn-danger:hover {
  background-color: #f8e1e1;
}
.blur-background {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 400px;
  object-fit: cover;
  z-index: 1;
  pointer-events: none;
}
</style>
<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goToEditor() {
  router.push('/edit-photo');
}
</script>

<template>
  <div class="upload-wrapper">
    <div class="center-container">
      <h1 class="title">Upload your image</h1>
      
      <div class="upload-card" @click="goToEditor">
        <div class="icon-circle">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>

        <h3 class="card-title">Click here to start</h3>
        
        <p class="subtitle">
          Go to the editor to upload and edit your photo ✨
        </p>

        <button class="upload-btn">
          Go to editor
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/uploadPhoto.css"></style>
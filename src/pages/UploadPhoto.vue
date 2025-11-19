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

<style scoped>
.upload-wrapper {
  width: 100%;
  height: 100%; 
  min-height: 85vh;
  
  display: flex;
  justify-content: center;
  align-items: center;
  
  background-color: #f9fafb;
}

.center-container {
  width: 100%;
  max-width: 700px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1f2937;
  margin: 0;
  letter-spacing: -0.5px;
}

.upload-card {
  width: 100%;
  background: #ffffff;
  border: 2px dashed #d1d5db;
  border-radius: 24px;
  padding: 60px 40px;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.upload-card:hover {
  border-color: #48b071;
  background-color: #f0fdf4;
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.icon-circle {
  background-color: #e6f5ec;
  color: #48b071;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  transition: transform 0.3s ease;
}

.upload-card:hover .icon-circle {
  transform: scale(1.1);
  background-color: #d1fae5;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.subtitle {
  color: #6b7280;
  font-size: 1rem;
  text-align: center;
  max-width: 400px;
  line-height: 1.5;
  margin: 0;
}

.upload-btn {
  margin-top: 12px;
  background: #1f2937;
  color: #ffffff;
  border: none;
  border-radius: 999px;
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  pointer-events: none;
}
</style>
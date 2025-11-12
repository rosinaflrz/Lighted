<script setup lang="ts">
import { useRouter } from 'vue-router'; 

const router = useRouter();

function goToEditor() {
  router.push('/edit-photo');
}
</script>

<template>
  <main class="main-content">
      <h2 class="main-title">upload your image</h2>
      
      <div class="upload-area">
        <p>upload your image to edit</p>
        <button class="upload-btn" @click="goToEditor">upload image</button>
      </div>
    </main>
</template>

<style scoped>
.main-content {
  flex-grow: 1;
  padding: 50px;
  background-color: #f9fafb;
}

.main-title {
  font-size: 32px;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 30px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  height: 400px;
  background-color: #e6f5ec;
  border-radius: 20px;
  padding: 40px;
}

.upload-area p {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
}

.upload-btn {
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background-color: #66a182;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.upload-btn:hover {
  background-color: #599071;
}
</style>
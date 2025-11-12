<script setup lang="ts">
import { ref } from 'vue';

const activeFilter = ref('all');
const projects = ref([
  { id: 1, name: 'Project 1' },
  { id: 2, name: 'Project 2' },
  { id: 3, name: 'Project 3' },
  { id: 4, name: 'Project 4' },
]);
</script>

<template>
  <main class="main-content">
    <header class="projects-header">
      <h2 class="main-title">projects</h2>
      <div class="filter-controls">
        <button
          class="filter-btn"
          :class="{ 'is-active': activeFilter === 'all' }"
          @click="activeFilter = 'all'"
        >
          all
        </button>
        <button
          class="filter-btn"
          :class="{ 'is-active': activeFilter === 'desc' }"
          @click="activeFilter = 'desc'"
        >
          desc
        </button>
        <button
          class="filter-btn"
          :class="{ 'is-active': activeFilter === 'asc' }"
          @click="activeFilter = 'asc'"
        >
          asc
        </button>
      </div>
    </header>

    <div class="projects-grid">
      <div v-for="project in projects" :key="project.id" class="project-card">
        <div class="placeholder-box">
          <svg viewBox="0 0 100 100">
            <line x1="0" y1="0" x2="100" y2="100" stroke="#66a182" stroke-width="8" />
            <line x1="100" y1="0" x2="0" y2="100" stroke="#66a182" stroke-width="8" />
          </svg>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.main-content {
  flex-grow: 1;
  padding: 50px;
  background-color: #f9fafb;
  height: 100vh;
  overflow-y: auto;
}
.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}
.main-title {
  font-size: 32px;
  font-weight: 800;
  color: #1f2937;
}
.filter-controls {
  display: flex;
  gap: 10px;
}
.filter-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #555;
  background-color: transparent;
  border: 2px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.filter-btn:hover {
  background-color: #f4f4f5;
}
.filter-btn.is-active {
  color: #66a182;
  border-color: #66a182;
  background-color: #e6f5ec;
}
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}
.project-card {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 16px;
  overflow: hidden;
  background-color: #e6f5ec;
}
.placeholder-box {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}
</style>
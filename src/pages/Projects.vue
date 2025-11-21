<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';

import {
  fetchProjects,
  updateProjectTitle,
  deleteProject,
  type Project,
} from '@/services/projects';
import { socket } from '@/services/socket';

type Filter = 'all' | 'newest' | 'oldest';

const router = useRouter();

const projects = ref<Project[]>([]);
const loading = ref(true);
const errorMsg = ref('');
const activeFilter = ref<Filter>('all');

const sortedProjects = computed(() => {
  const list = [...projects.value];

  if (activeFilter.value === 'newest') {
    return list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  if (activeFilter.value === 'oldest') {
    return list.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }

  return list;
});

async function loadProjects() {
  errorMsg.value = '';
  try {
    const data = await fetchProjects(); 
    projects.value = data;
  } catch (err: any) {
    console.error(err);
    errorMsg.value = 'Could not load projects';
  } finally {
    loading.value = false;
  }
}

function onProjectClick(project: Project) {
  router.push({
    name: 'edit-photo-standalone',
    query: { id: project.id },
  });
}

async function onEditTitle(event: Event, project: Project) {
  event.stopPropagation();
  const newTitle = prompt('Nuevo nombre del proyecto:', project.title);
  if (!newTitle || newTitle.trim() === '' || newTitle === project.title) {
    return;
  }

  try {
    await updateProjectTitle(project.id, newTitle);
    project.title = newTitle;
  } catch (e) {
    alert('No se pudo cambiar el nombre');
  }
}

async function onDelete(event: Event, projectId: number | string) {
  event.stopPropagation();
  if (!confirm('¿Seguro que quieres eliminar este proyecto? 🗑️')) return;

  try {
    await deleteProject(projectId);
    projects.value = projects.value.filter((p) => p.id !== projectId);
  } catch (e) {
    alert('Error al eliminar');
  }
}

onMounted(() => {
  loading.value = true;
  loadProjects();

  socket.on('projects_updated', () => {
    loadProjects();
  });
});

onUnmounted(() => {
  socket.off('projects_updated');
});
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
          :class="{ 'is-active': activeFilter === 'newest' }"
          @click="activeFilter = 'newest'"
        >
          newest
        </button>
        <button
          class="filter-btn"
          :class="{ 'is-active': activeFilter === 'oldest' }"
          @click="activeFilter = 'oldest'"
        >
          oldest
        </button>
      </div>
    </header>

    <section>
      <p v-if="loading" class="status">Loading projects…</p>
      <p v-else-if="errorMsg" class="status error">{{ errorMsg }}</p>
      <p v-else-if="sortedProjects.length === 0" class="status">
        No projects yet. Try saving one from the editor ✨
      </p>

      <div v-else class="projects-grid">
        <div
          v-for="project in sortedProjects"
          :key="project.id"
          class="project-card"
          @click="onProjectClick(project)"
        >
          <div class="thumb">
            <div
              v-if="project.thumbnail_url"
              class="thumb-img"
              :style="{ backgroundImage: `url(${project.thumbnail_url})` }"
            />
            <div v-else class="thumb-placeholder">
              <svg viewBox="0 0 100 100">
                <line x1="0" y1="0" x2="100" y2="100" stroke-width="8" />
                <line x1="100" y1="0" x2="0" y2="100" stroke-width="8" />
              </svg>
            </div>
          </div>

          <div class="card-footer">
            <span class="project-title">{{ project.title }}</span>
            <div class="actions">
              <button
                class="action-btn edit"
                @click="(e) => onEditTitle(e, project)"
                title="Renombrar"
              >
                ✎
              </button>
              <button
                class="action-btn delete"
                @click="(e) => onDelete(e, project.id)"
                title="Eliminar"
              >
                🗑
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped src="@/assets/css/projects.css"></style>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router'; // Importamos router
import { 
  fetchProjects, 
  updateProjectTitle, 
  deleteProject, 
  type Project 
} from '../services/projects';

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
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  if (activeFilter.value === 'oldest') {
    return list.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }
  return list;
});

async function loadProjects() {
  loading.value = true;
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
  // Enviamos el ID como parámetro query en la URL
  router.push({ name: 'edit-photo-standalone', query: { id: project.id } });
}

// Editar título rápido desde la tarjeta
async function onEditTitle(event: Event, project: Project) {
  event.stopPropagation(); 
  
  const newTitle = prompt("Nuevo nombre del proyecto:", project.title);
  if (newTitle && newTitle.trim() !== "" && newTitle !== project.title) {
    try {
      await updateProjectTitle(project.id, newTitle);
      project.title = newTitle;
    } catch (e) {
      alert("No se pudo cambiar el nombre");
    }
  }
}

// Eliminar proyecto
async function onDelete(event: Event, projectId: number | string) {
  event.stopPropagation();

  if (confirm("¿Seguro que quieres eliminar este proyecto? 🗑️")) {
    try {
      await deleteProject(projectId);
      projects.value = projects.value.filter(p => p.id !== projectId);
    } catch (e) {
      alert("Error al eliminar");
    }
  }
}

onMounted(() => {
  loadProjects();
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
              <button class="action-btn edit" @click="(e) => onEditTitle(e, project)" title="Renombrar">
                ✎
              </button>
              <button class="action-btn delete" @click="(e) => onDelete(e, project.id)" title="Eliminar">
                🗑
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
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

.status {
  font-size: 16px;
  color: #4b5563;
}
.status.error {
  color: #dc2626;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.project-card {
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.project-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.thumb {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 12px;
  overflow: hidden;
  background: #d1fae5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb-img {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}
.thumb-placeholder svg {
  width: 60%;
  height: 60%;
  stroke: #66a182;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 110px;
}

.actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.action-btn.edit {
  background-color: #eff6ff;
  color: #3b82f6;
}
.action-btn.edit:hover {
  background-color: #dbeafe;
}

.action-btn.delete {
  background-color: #fef2f2;
  color: #ef4444;
}
.action-btn.delete:hover {
  background-color: #fee2e2;
}
</style>
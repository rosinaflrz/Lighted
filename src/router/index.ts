// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Pages
import SignIn from '../pages/SignIn.vue'
import Register from '../pages/Register.vue'
import DashboardLanding from '../pages/DashboardLanding.vue'
import Dashboard from '../pages/Dashboard.vue'
import UploadPhoto from '../pages/UploadPhoto.vue'
import Projects from '../pages/Projects.vue'
import Settings from '../pages/Settings.vue'
import EditPhoto from '../pages/EditPhoto.vue' // <-- Importa el editor

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard-landing' },
  { path: '/signin', name: 'signin', component: SignIn },
  { path: '/register', name: 'register', component: Register },
  { path: '/dashboard-landing', name: 'dashboard-landing', component: DashboardLanding },

  { 
    path: '/dashboard', 
    name: 'dashboard', 
    component: Dashboard,
    redirect: '/dashboard/edit',
    children: [
      { path: 'edit', name: 'dashboard-edit', component: UploadPhoto },
      { path: 'projects', name: 'dashboard-projects', component: Projects },
      { path: 'settings', name: 'dashboard-settings', component: Settings },
      // <-- ASEGÚRATE DE BORRAR 'edit-photo' DE AQUÍ DENTRO
    ]
  },

  // ===== 🚀 ESTA ES LA RUTA CORRECTA 🚀 =====
  // Esta ruta es principal, por eso no tendrá el sidebar de dashboard
  { path: '/edit-photo', name: 'edit-photo-standalone', component: EditPhoto }, 

  { path: '/:pathMatch(.*)*', redirect: '/dashboard-landing' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
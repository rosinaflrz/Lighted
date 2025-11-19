<script setup lang="ts">
import { useRouter } from 'vue-router';
import logo from '../assets/3.png';

import iconEdit from '../assets/14.png';
import iconProjects from '../assets/15.png';
import iconSettings from '../assets/16.png';
import { authService } from '../services/auth';

const router = useRouter();

function goToLanding() {
  router.push('/dashboard-landing');
}

function onLogout() {
  authService.logout();
  router.push('/signin');
}
</script>

<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div>
        <img
          :src="logo"
          alt="lighted logo"
          class="logo"
          @click="goToLanding"
        />
        <nav class="sidebar-nav">
          <router-link
            to="/dashboard/edit"
            class="nav-link"
            active-class="is-active"
          >
            <img :src="iconEdit" alt="Edit Photo" class="icon" />
            <span>edit photo</span>
          </router-link>

          <router-link
            to="/dashboard/projects"
            class="nav-link"
            active-class="is-active"
          >
            <img :src="iconProjects" alt="Projects" class="icon" />
            <span>projects</span>
          </router-link>

          <router-link
            to="/dashboard/settings"
            class="nav-link"
            active-class="is-active"
          >
            <img :src="iconSettings" alt="Settings" class="icon" />
            <span>settings</span>
          </router-link>
        </nav>
      </div>

      <button
        class="logout-btn"
        @click="onLogout"
        v-auth-visible="'logged-in'"
      >
        log out
      </button>
    </aside>

    <div class="divider"></div>

    <router-view />
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background-color: #ffffff;
}

.sidebar {
  flex-shrink: 0;
  width: 280px;
  padding: 40px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.logo {
  width: 200px;
  height: auto;
  cursor: pointer;
  margin-bottom: 40px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  border: none;
  background: transparent;
  font-size: 18px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s ease, color 0.2s ease;
  text-decoration: none;
}

.nav-link:hover {
  background-color: #f4f4f5;
}

.nav-link.is-active {
  background-color: #e6f5ec;
  color: #111827;
}

.nav-link .icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.divider {
  width: 1px;
  flex-shrink: 0;
  background-color: #e5e7eb;
}

.logout-btn {
  padding: 12px 16px;
  font-size: 18px;
  font-weight: 600;
  color: #d64545;
  background-color: #fbebee;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: center;
  margin-top: 40px;
}

.logout-btn:hover {
  background-color: #f8e1e1;
}
</style>

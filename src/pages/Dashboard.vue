<script setup lang="ts">
import { useRouter } from 'vue-router';
import logo from '../assets/images/3.png';

import iconEdit from '../assets/images/14.png';
import iconProjects from '../assets/images/15.png';
import iconSettings from '../assets/images/16.png';
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


<style scoped src="@/assets/css/dashboard.css"></style>
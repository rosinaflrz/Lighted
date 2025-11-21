<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import bg from '../assets/images/8.png';
import ring from '../assets/images/6.png';
import { authService } from '../services/auth';
import { GoogleLogin } from 'vue3-google-login';

type Step = 'email' | 'password';

const router = useRouter();

const step = ref<Step>('email');
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailValid = computed(() => emailRegex.test(email.value.trim()));
const canContinueEmail = computed(() => emailValid.value);

const passValid = computed(() => password.value.trim().length >= 8);
const canContinuePass = computed(() => passValid.value && !loading.value);

function continueWithEmail() {
  if (!canContinueEmail.value) return;
  errorMsg.value = '';
  step.value = 'password';
}

function backToEmail() {
  step.value = 'email';
  password.value = '';
  errorMsg.value = '';
}

async function signIn() {
  if (!canContinuePass.value) return;
  loading.value = true;
  errorMsg.value = '';

  try {
    await authService.loginWithCredentials(email.value.trim(), password.value.trim());
    router.push('/dashboard-landing');
  } catch (err: any) {
    console.error(err);
    errorMsg.value = err.message || 'Could not sign in';
  } finally {
    loading.value = false;
  }
}

const onGoogleSuccess = async (response: any) => {
  try {
    await authService.loginWithGoogle(response.credential);
    router.push('/dashboard-landing');
  } catch (error) {
    console.error(error);
    errorMsg.value = "Error iniciando sesión con Google";
  }
};

const onGoogleError = () => {
  errorMsg.value = "Inicio de sesión cancelado";
};
</script>

<template>
  <section class="signin">
    <img class="signin-bg" :src="bg" alt="" />
    <div class="card">
      <div class="logo">
        <div class="logo-circle">
          <img class="logo-ring" :src="ring" alt="Lighted logo" />
        </div>
      </div>
      <h1>Sign in</h1>
      <form class="form" @submit.prevent>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <template v-if="step === 'email'">
          <input type="email" placeholder="your_email@here.com" v-model.trim="email" @keyup.enter.prevent="continueWithEmail" />
          <button type="button" :disabled="!canContinueEmail" @click="continueWithEmail" :class="{ disabled: !canContinueEmail }">Continue</button>
        </template>
        <template v-else>
          <div class="email-review"><span class="pill">{{ email }}</span><button type="button" class="link" @click="backToEmail">Change</button></div>
          <input type="password" placeholder="password (8+ chars)" v-model="password" @keyup.enter.prevent="signIn" />
          <button type="button" :disabled="!canContinuePass" @click="signIn" :class="{ disabled: !canContinuePass }"><span v-if="!loading">Sign in</span><span v-else>Signing in…</span></button>
        </template>
        <div class="divider"><span>or</span></div>
        <div class="google-container"><GoogleLogin :callback="onGoogleSuccess" :error="onGoogleError" /></div>
        <p class="hint">Don’t have an account? <router-link to="/register">Sign up here</router-link></p>
      </form>
    </div>
  </section>
</template>

<style scoped src="@/assets/css/signIn.css"></style>
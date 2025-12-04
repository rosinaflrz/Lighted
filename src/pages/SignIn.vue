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

// Flags para saber si el usuario ya interactuó con el campo
const emailTouched = ref(false);
const passwordTouched = ref(false);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailValid = computed(() => emailRegex.test(email.value.trim()));
// Validamos formato solo si ya escribió algo o tocó el campo
const showEmailError = computed(() => emailTouched.value && !emailValid.value && email.value.length > 0);
const canContinueEmail = computed(() => emailValid.value);

const passValid = computed(() => password.value.trim().length >= 8);
const showPassError = computed(() => passwordTouched.value && !passValid.value && password.value.length > 0);
const canContinuePass = computed(() => passValid.value && !loading.value);

function continueWithEmail() {
  emailTouched.value = true; // Marcar como tocado
  if (!canContinueEmail.value) return;
  errorMsg.value = '';
  step.value = 'password';
}

function backToEmail() {
  step.value = 'email';
  password.value = '';
  passwordTouched.value = false;
  errorMsg.value = '';
}

async function signIn() {
  passwordTouched.value = true; // Marcar como tocado
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
          <div class="field-group">
            <input 
              type="email" 
              placeholder="your_email@here.com" 
              v-model.trim="email" 
              @blur="emailTouched = true"
              @keyup.enter.prevent="continueWithEmail" 
              :class="{ 'input-error': showEmailError }"
            />
            <small v-if="showEmailError" class="field-error-msg">
              Please enter a valid email address (example@domain.com)
            </small>
          </div>
          
          <button type="button" :disabled="!canContinueEmail" @click="continueWithEmail" :class="{ disabled: !canContinueEmail }">
            Continue
          </button>
        </template>

        <template v-else>
          <div class="email-review">
            <span class="pill">{{ email }}</span>
            <button type="button" class="link" @click="backToEmail">Change</button>
          </div>
          
          <div class="field-group">
            <input 
              type="password" 
              placeholder="password (8+ chars)" 
              v-model="password" 
              @blur="passwordTouched = true"
              @keyup.enter.prevent="signIn" 
              :class="{ 'input-error': showPassError }"
            />
            <small v-if="showPassError" class="field-error-msg">
              Password must be at least 8 characters
            </small>
          </div>

          <button type="button" :disabled="!canContinuePass" @click="signIn" :class="{ disabled: !canContinuePass }">
            <span v-if="!loading">Sign in</span>
            <span v-else>Signing in…</span>
          </button>
        </template>

        <div class="divider"><span>or</span></div>
        <div class="google-container"><GoogleLogin :callback="onGoogleSuccess" :error="onGoogleError" /></div>
        <p class="hint">Don’t have an account? <router-link to="/register">Sign up here</router-link></p>
      </form>
    </div>
  </section>
</template>

<style scoped src="@/assets/css/signIn.css"></style>
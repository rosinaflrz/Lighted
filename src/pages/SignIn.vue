<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import bg from '../assets/8.png';
import ring from '../assets/6.png';
import { authService } from '../services/auth';

// 1. Importamos el componente oficial y los tipos
import { GoogleLogin, type CallbackTypes } from 'vue3-google-login';

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

// Login normal (Usuario/Contraseña)
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

// 2. Función que se ejecuta cuando Google responde ÉXITO
const onGoogleSuccess = async (response: CallbackTypes.CredentialCallback) => {
  try {
    // 'response.credential' es el token encriptado que nos da Google
    await authService.loginWithGoogle(response.credential);
    router.push('/dashboard-landing');
  } catch (error) {
    console.error(error);
    errorMsg.value = "Error iniciando sesión con Google";
  }
};

// def si hay error o el usuario cierra la ventana
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
          <input
            type="email"
            placeholder="your_email@here.com"
            v-model.trim="email"
            @keyup.enter.prevent="continueWithEmail"
            aria-label="Email"
          />

          <button
            type="button"
            :disabled="!canContinueEmail"
            @click="continueWithEmail"
            :class="{ disabled: !canContinueEmail }"
          >
            Continue
          </button>
        </template>

        <template v-else>
          <div class="email-review">
            <span class="pill">{{ email }}</span>
            <button type="button" class="link" @click="backToEmail">Change</button>
          </div>

          <input
            type="password"
            placeholder="password (8+ chars)"
            v-model="password"
            @keyup.enter.prevent="signIn"
            aria-label="Password"
          />

          <button
            type="button"
            :disabled="!canContinuePass"
            @click="signIn"
            :class="{ disabled: !canContinuePass }"
          >
            <span v-if="!loading">Sign in</span>
            <span v-else>Signing in…</span>
          </button>
        </template>

        <div class="divider">
          <span>or</span>
        </div>

        <div class="google-container">
           <GoogleLogin :callback="onGoogleSuccess" :error="onGoogleError" />
        </div>

        <p class="hint">
          Don’t have an account?
          <router-link to="/register">Sign up here</router-link>
        </p>
      </form>
    </div>
  </section>
</template>

<style scoped>
/* Estilos generales */
.signin {
  --ring-offset-x: 0px;
  --ring-offset-y: 0px;
  position: relative;
  min-height: 100dvh;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 24px;
}
.signin-bg {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 160%; min-width: 1200px; height: auto;
  opacity: 0.95; filter: blur(0.5px);
  pointer-events: none; user-select: none;
}
.card {
  position: relative;
  width: min(520px, 92vw);
  padding: 52px 36px 42px;
  background: rgba(255, 255, 255, 0.88);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1), 0 0 40px rgba(255, 255, 255, 0.4) inset;
  backdrop-filter: blur(20px);
}
.logo { display: flex; justify-content: center; }
.logo-circle {
  width: 140px; height: 140px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  position: relative; overflow: visible;
  box-shadow: 0 0 18px rgba(255, 255, 255, 0.9), 0 0 42px rgba(255, 255, 255, 0.55), 0 0 68px rgba(255, 255, 255, 0.35), 0 12px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.75) inset;
}
.logo-ring {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(calc(-50% + var(--ring-offset-x)), calc(-50% + var(--ring-offset-y)));
  width: 270px; height: auto;
  object-fit: contain; pointer-events: none;
}
h1 {
  text-align: center; margin: 18px 0 20px;
  font-size: clamp(26px, 3.4vw, 36px); font-weight: 700; color: #111827;
}
.form { display:grid; gap:14px; }
.form input {
  border: 1px solid #e5e7eb; border-radius: 999px; padding: 14px 18px;
  font-size: 16px; background: #fff; outline: none;
}
.form input::placeholder { color:#9ca3af; }
.form button {
  border-radius: 999px; padding: 14px 18px; font-weight: 700;
  background: #111; color: #fff; cursor: pointer; transition: 0.25s ease;
  border: 1px solid #111;
}
.form button:hover { background:#000; }
.form button.disabled { opacity: .45; cursor: not-allowed; }

.email-review { display:flex; align-items:center; gap:10px; justify-content:center; }
.pill {
  display:inline-flex; align-items:center; padding:6px 10px;
  border-radius:999px; border:1px solid #e5e7eb; background:#fff; font-size:14px;
}
.link {
  border:none; background:transparent; color:#111827; text-decoration:underline;
  font-weight:700; cursor:pointer;
}
.hint { text-align:center; margin-top:8px; font-size:14px; color:#111827; }
.hint a { font-weight:700; text-decoration:underline; }
.error { color:#dc2626; font-size:14px; text-align:center; }


.divider {
  display: flex; align-items: center; text-align: center; margin: 10px 0; color: #ccc;
}
.divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #d1d5db; }
.divider span { padding: 0 10px; font-size: 12px; color: #6b7280; }

.google-container {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: 10px;
}
</style>
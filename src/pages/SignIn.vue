<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import bg from '../assets/8.png';
import ring from '../assets/6.png';
import { authService } from '../services/auth';

type Step = 'email' | 'password';

const router = useRouter();

// --- State ---
const step = ref<Step>('email');
const email = ref('');
const password = ref('');

// --- Validaciones muy simples ---
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailValid = computed(() => emailRegex.test(email.value.trim()));
const canContinueEmail = computed(() => emailValid.value);

const passValid = computed(() => password.value.trim().length >= 8);
const canContinuePass = computed(() => passValid.value);

// --- Acciones ---
function continueWithEmail() {
  if (!canContinueEmail.value) return;
  step.value = 'password';
}

function backToEmail() {
  step.value = 'email';
}

function signInMock() {
  if (!canContinuePass.value) return;
  // Guardamos "sesión" fake en localStorage
  authService.login(email.value);
  // Mensaje mock (si quieres lo puedes quitar)
  // ;(window as any).$toast?.show?.('Signed in (mock) ✅');
  router.push('/dashboard-landing');
}
</script>

<template>
  <section class="signin">
    <!-- Fondo -->
    <img class="signin-bg" :src="bg" alt="" />

    <div class="card">
      <!-- Logo -->
      <div class="logo">
        <div class="logo-circle">
          <img class="logo-ring" :src="ring" alt="Lighted logo" />
        </div>
      </div>

      <h1>Sign in</h1>

      <form class="form" @submit.prevent>
        <!-- Paso 1: email -->
        <template v-if="step === 'email'">
          <input
            v-autofocus
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
            Sign in with email
          </button>

          <p class="hint">
            Don’t have an account?
            <router-link to="/register">Sign up here</router-link>
          </p>
        </template>

        <!-- Paso 2: password -->
        <template v-else>
          <div class="email-review">
            <span class="pill">{{ email }}</span>
            <button type="button" class="link" @click="backToEmail">Change</button>
          </div>

          <input
            v-autofocus
            type="password"
            placeholder="password (8+ chars)"
            v-model="password"
            @keyup.enter.prevent="signInMock"
            aria-label="Password"
          />

          <button
            type="button"
            :disabled="!canContinuePass"
            @click="signInMock"
            :class="{ disabled: !canContinuePass }"
          >
            Sign in
          </button>

          <p class="hint">
            Don’t have an account?
            <router-link to="/register">Sign up here</router-link>
          </p>
        </template>
      </form>
    </div>
  </section>
</template>

<style scoped>
/* ---- Layout general ---- */
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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 160%;
  min-width: 1200px;
  height: auto;
  opacity: 0.95;
  filter: blur(0.5px);
  pointer-events: none;
  user-select: none;
}

/* ---- Card ---- */
.card {
  position: relative;
  width: min(520px, 92vw);
  padding: 52px 36px 42px;
  background: rgba(255, 255, 255, 0.88);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.1),
    0 0 40px rgba(255, 255, 255, 0.4) inset;
  backdrop-filter: blur(20px);
}

/* ---- Logo ---- */
.logo {
  display: flex;
  justify-content: center;
}
.logo-circle {
  width: 140px;
  height: 140px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  position: relative;
  overflow: visible;
  box-shadow:
    0 0 18px rgba(255, 255, 255, 0.9),
    0 0 42px rgba(255, 255, 255, 0.55),
    0 0 68px rgba(255, 255, 255, 0.35),
    0 12px 32px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.75) inset;
}
.logo-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(calc(-50% + var(--ring-offset-x)), calc(-50% + var(--ring-offset-y)));
  width: 270px;
  height: auto;
  object-fit: contain;
  pointer-events: none;
}

/* ---- Título ---- */
h1 {
  text-align: center;
  margin: 18px 0 20px;
  font-size: clamp(26px, 3.4vw, 36px);
  font-weight: 700;
  color: #111827;
}

/* ---- Form ---- */
.form {
  display: grid;
  gap: 14px;
}

.form input {
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 14px 18px;
  font-size: 16px;
  background: #fff;
  outline: none;
}
.form input::placeholder {
  color: #9ca3af;
}

.form button {
  border-radius: 999px;
  padding: 14px 18px;
  font-weight: 700;
  background: #111;
  color: #fff;
  cursor: pointer;
  transition: 0.25s ease;
  border: 1px solid #111;
}
.form button:hover {
  background: #000;
}
.form button.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Email fijo en paso 2 */
.email-review {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}
.pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 14px;
}
.link {
  border: none;
  background: transparent;
  color: #111827;
  text-decoration: underline;
  font-weight: 700;
  cursor: pointer;
}

/* Hint */
.hint {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #111827;
}
.hint a {
  font-weight: 700;
  text-decoration: underline;
}
</style>

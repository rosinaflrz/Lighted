<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import bg from '../assets/9.png';
import ring from '../assets/6.png';
import { authService } from '../services/auth';

type Form = {
  email: string;
  password: string;
  confirm: string;
  tos: boolean;
};

const router = useRouter();

const form = reactive<Form>({
  email: '',
  password: '',
  confirm: '',
  tos: false
});

const emailOk = computed(() => /\S+@\S+\.\S+/.test(form.email));
const passOk  = computed(() => form.password.length >= 8);
const matchOk = computed(() => form.password === form.confirm);
const allOk   = computed(() => emailOk.value && passOk.value && matchOk.value && form.tos);

const onSubmit = async () => {
  if (!allOk.value) return;
  try {
    await authService.register(form.email, form.password);
    router.push('/dashboard-landing');
  } catch (err) {
    console.error(err);
    alert('Error creating account. Maybe that email is already registered.');
  }
};
</script>


<template>
  <section class="signup">
    <img class="bg" :src="bg" alt="" />

    <div class="card">
      <div class="logo">
        <div class="logo-circle">
          <img class="logo-ring" :src="ring" alt="Lighted logo" />
        </div>
      </div>

      <h1>Create account</h1>

      <form class="form" @submit.prevent="onSubmit">
        <div class="field">
          <input
            v-model="form.email"
            type="email"
            placeholder="you@email.com"
            :class="{ invalid: form.email && !emailOk }"
          />
          <small v-if="form.email && !emailOk" class="err">Invalid email</small>
        </div>

        <div class="field">
          <input
            v-model="form.password"
            type="password"
            placeholder="Password (8+ chars)"
            :class="{ invalid: form.password && !passOk }"
          />
          <small v-if="form.password && !passOk" class="err">
            At least 8 characters
          </small>
        </div>

        <div class="field">
          <input
            v-model="form.confirm"
            type="password"
            placeholder="Confirm password"
            :class="{ invalid: form.confirm && !matchOk }"
          />
          <small v-if="form.confirm && !matchOk" class="err">
            Passwords don’t match
          </small>
        </div>

        <label class="tos">
          <input v-model="form.tos" type="checkbox" />
          <span>I agree to the Terms of Service</span>
        </label>

        <button type="submit" :disabled="!allOk || loading">
          <span v-if="loading">Creating...</span>
          <span v-else>Create account</span>
        </button>

        <p class="hint">
          Already have an account?
          <RouterLink to="/signin">Sign in</RouterLink>
        </p>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      </form>
    </div>
  </section>
</template>

<style scoped>
.signup {
  --ring-offset-x: 0px;
  --ring-offset-y: 0px;
}

.signup {
  position: relative;
  min-height: 100dvh;
  background: #fff;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 24px;
}

.bg {
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

.card {
  position: relative;
  width: min(560px, 92vw);
  padding: 52px 36px 42px;
  background: rgba(255, 255, 255, 0.88);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1), 0 0 40px rgba(255, 255, 255, 0.4) inset;
  backdrop-filter: blur(20px);
}

.logo {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
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
  display: block;
  object-fit: contain;
  pointer-events: none;
}

h1 {
  text-align: center;
  margin: 18px 0 20px;
  font-size: clamp(26px, 3.4vw, 36px);
  font-weight: 700;
  color: #111827;
}

.form {
  display: grid;
  gap: 14px;
}
.field {
  display: grid;
  gap: 6px;
}
input[type='email'],
input[type='password'] {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 14px 18px;
  font-size: 16px;
  background: #fff;
  outline: none;
}
input.invalid {
  border-color: #ef4444;
}
.err {
  color: #ef4444;
  font-size: 12px;
  padding-left: 10px;
}

.tos {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #111827;
}
.tos input {
  width: 18px;
  height: 18px;
}

button {
  border-radius: 999px;
  padding: 14px 18px;
  font-weight: 700;
  background: #111;
  color: #fff;
  cursor: pointer;
  transition: 0.25s ease;
}
button:hover {
  background: #000;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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

.error-msg {
  margin-top: 6px;
  font-size: 13px;
  color: #b91c1c;
  text-align: center;
}
</style>

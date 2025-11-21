<script setup lang="ts">
import { reactive, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import bg from '../assets/images/9.png';
import ring from '../assets/images/6.png';
import { authService } from '../services/auth';

type Form = {
  email: string;
  password: string;
  confirm: string;
  tos: boolean;
};

const router = useRouter();

// ===== Estado del formulario =====
const form = reactive<Form>({
  email: '',
  password: '',
  confirm: '',
  tos: false
});

// Flags de UI
const loading = ref(false);
const errorMsg = ref('');

// ===== Validaciones =====
const emailOk = computed(() => /\S+@\S+\.\S+/.test(form.email));
const passOk  = computed(() => form.password.length >= 8);
const matchOk = computed(() => form.password === form.confirm);
const allOk   = computed(
  () => emailOk.value && passOk.value && matchOk.value && form.tos
);

// ===== Submit =====
const onSubmit = async () => {
  if (!allOk.value || loading.value) return;

  loading.value = true;
  errorMsg.value = '';

  try {
    await authService.register(form.email, form.password);
    router.push('/dashboard-landing');
  } catch (err) {
    console.error(err);
    errorMsg.value =
      'Error creating account. Maybe that email is already registered.';
  } finally {
    loading.value = false;
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
        <!-- Email -->
        <div class="field">
          <input
            v-model="form.email"
            type="email"
            placeholder="you@email.com"
            :class="{ invalid: form.email && !emailOk }"
          />
          <small v-if="form.email && !emailOk" class="err">
            Invalid email
          </small>
        </div>

        <!-- Password -->
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

        <!-- Confirm -->
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

        <!-- TOS -->
        <label class="tos">
          <input v-model="form.tos" type="checkbox" />
          <span>I agree to the Terms of Service</span>
        </label>

        <!-- Botón -->
        <button type="submit" :disabled="!allOk || loading">
          <span v-if="loading">Creating...</span>
          <span v-else>Create account</span>
        </button>

        <!-- Hint: ya tiene cuenta -->
        <p class="hint">
          Already have an account?
          <RouterLink to="/signin">Sign in</RouterLink>
        </p>

        <!-- Error del backend -->
        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      </form>
    </div>
  </section>
</template>

<style scoped src="@/assets/css/register.css"></style>

<script setup lang="ts"></script>

<template>
  <RouterView />
</template>

<style scoped>
/* Reset mínimo y tipografía base */
:root {
  --bg: #ffffff;
  --text: #111827;
}

* { box-sizing: border-box; }
html, body, #app { height: 100%; }
body {
  margin: 0;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif;
  color: var(--text);
  background: var(--bg);
}
</style>

<script setup lang="ts"></script>

<template>
  <RouterView />
</template>

<style scoped>
:root { --bg:#fff; --text:#111827; }
* { box-sizing: border-box; }
html, body, #app { height: 100%; }
body {
  margin: 0;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  background: var(--bg);
  color: var(--text);
}
</style>

/// <reference types="vite/client" />

// 👇 Necesario para que TS entienda los imports de .vue
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

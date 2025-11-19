import type { ObjectDirective, DirectiveBinding } from 'vue';
import { authService } from '@/services/auth';

export type AuthVisibleMode = 'logged-in' | 'logged-out';

function updateVisibility(el: HTMLElement, binding: DirectiveBinding<AuthVisibleMode>) {
  const loggedIn = authService.isLoggedIn();
  const mode = binding.value || 'logged-in';

  const shouldShow =
    (mode === 'logged-in' && loggedIn) ||
    (mode === 'logged-out' && !loggedIn);

  el.style.display = shouldShow ? '' : 'none';
}

export const vAuthVisible: ObjectDirective<HTMLElement, AuthVisibleMode> = {
  mounted(el, binding) {
    updateVisibility(el, binding);

    const handler = () => updateVisibility(el, binding);
    (el as any).__authVisibleHandler__ = handler;
    window.addEventListener('storage', handler);
  },
  updated(el, binding) {
    updateVisibility(el, binding);
  },
  unmounted(el) {
    const handler = (el as any).__authVisibleHandler__;
    if (handler) {
      window.removeEventListener('storage', handler);
    }
  },
};

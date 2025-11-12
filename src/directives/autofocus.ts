import type { Directive } from 'vue';

export const vAutofocus: Directive = {
  mounted(el) {
    (el as HTMLElement).focus();
  },
};

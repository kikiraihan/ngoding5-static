import { ref } from 'vue';

export const toastMsg = ref<string | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

export function toast(msg: string, ms = 2600) {
  toastMsg.value = msg;
  clearTimeout(timer);
  timer = setTimeout(() => (toastMsg.value = null), ms);
}

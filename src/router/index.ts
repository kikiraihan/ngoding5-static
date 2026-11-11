import { createRouter, createWebHistory } from 'vue-router';
import { load } from '@/lib/storage';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: () => {
        const last = load<string | null>('lastRoute', null);
        return last && (last.startsWith('/soal/') || last.startsWith('/tebak/')) ? last : '/soal/fizzbuzz';
      },
    },
    { path: '/soal/:id', name: 'problem', component: () => import('@/views/ProblemView.vue') },
    { path: '/tebak/:lang(javascript|python)/:id', name: 'quiz', component: () => import('@/views/QuizView.vue') },
    { path: '/tebak/:lang(javascript|python)', name: 'quiz-start', component: () => import('@/views/QuizView.vue') },
    { path: '/tentang', name: 'about', component: () => import('@/views/AboutView.vue') },
    { path: '/:pathMatch(.*)*', name: 'notfound', component: () => import('@/views/NotFound.vue') },
  ],
  scrollBehavior(to, from) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    if (to.path !== from.path) return { top: 0 };
    return false;
  },
});

export default router;

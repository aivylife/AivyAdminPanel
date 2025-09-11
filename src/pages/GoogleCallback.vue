<template>
  <div class="flex flex-center" style="height: 100vh">
    <q-spinner color="primary" size="3em" />
    <div class="q-ml-md">Обработка авторизации...</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { api } from 'src/services/api';

const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      throw new Error('Не удалось получить код авторизации');
    }

    // Отправляем код на бэкенд
    const response = await api.post('/auth/google', { code });
    const authData = response.data;

    // Сохраняем данные авторизации
    authStore.setAuthData(authData);

    // Перенаправляем на главную страницу
    router.push('/exercises');
  } catch (error) {
    console.error('Auth error:', error);
    router.push('/login');
  }
});
</script> 
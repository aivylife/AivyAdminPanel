<template>
  <q-page class="flex flex-center">
    <q-card class="login-card">
      <q-card-section class="logo-section">
        <img src="../assets/svg/CoverWithText.svg" class="full-width" />
      </q-card-section>
      <q-card-section class="form-section">
        <q-form @submit="onSubmit" class="q-gutter-md">
          <div v-if="errorMessage" class="error-message text-negative">
            {{ errorMessage }}
          </div>

          <q-input
            v-model="email"
            label="Email"
            type="email"
            :rules="[
              val => !!val || 'Email обязателен',
              val => /.+@.+\..+/.test(val) || 'Некорректный email'
            ]"
            outlined
            :error="!!errorMessage"
          />

          <q-input
            v-model="password"
            label="Пароль"
            :type="isPwd ? 'password' : 'text'"
            :rules="[val => !!val || 'Пароль обязателен']"
            outlined
            :error="!!errorMessage"
          >
            <template v-slot:append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>

          <div>
            <q-btn
              type="submit"
              label="Войти"
              class="full-width"
              :loading="loading"
            />
          </div>

          <!-- <div class="text-center q-pa-sm">или</div>

          <q-btn
            type="button"
            class="full-width"
            :loading="googleLoading"
            @click="loginWithGoogle"
          >
            <template v-slot:default>
              <q-icon name="img:https://www.google.com/favicon.ico" size="18px" class="q-mr-sm" />
              Войти через Google
            </template>
          </q-btn> -->
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const isPwd = ref(true);
const loading = ref(false);
const googleLoading = ref(false);
const errorMessage = ref('');

async function onSubmit() {
  try {
    errorMessage.value = '';
    loading.value = true;
    await authStore.login(email.value, password.value);
    router.push('/exercises');
  } catch (error: any) {
    console.error('Login error:', error);
    errorMessage.value = error?.response?.data?.error?.message || 
                        error?.message || 
                        'Ошибка авторизации. Проверьте email и пароль.';
  } finally {
    loading.value = false;
  }
}

async function loginWithGoogle() {
  try {
    errorMessage.value = '';
    googleLoading.value = true;
    await authStore.loginWithGoogle();
  } catch (error: any) {
    console.error('Google login error:', error);
    errorMessage.value = error?.response?.data?.error?.message || 
                        error?.message || 
                        'Ошибка авторизации через Google.';
  } finally {
    googleLoading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.login-card {
  width: 100%;
  max-width: 480px;
  overflow: hidden;
  border-radius: 12px;
}

.logo-section {
  padding: 0;
  
  img {
    display: block;
    width: 100%;
  }
}

.form-section {
  padding: 32px;
  
  .text-h5 {
    margin-bottom: 24px;
  }
}

.error-message {
  padding: 8px 12px;
  background-color: rgba(197, 48, 48, 0.1);
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
}

.q-btn {
  height: 44px;
}

.google-btn {
  border: 1px solid $grey-4;
}
</style> 
<template>
  <q-layout view="lHh Lpr lFf" class="auth-layout">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
defineOptions({
  name: 'AuthLayout'
});
</script>

<style lang="scss">
.auth-layout {
  background: linear-gradient(135deg, $aivy-turquoise-1 0%, $aivy-indigo-1 100%);
  min-height: 100vh;
}
</style> 
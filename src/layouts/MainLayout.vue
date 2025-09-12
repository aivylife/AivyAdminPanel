<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-aivy-surface text-aivy-text header">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          {{ currentTitle }}
        </q-toolbar-title>

        <q-space />

        <q-btn
          flat
          round
          dense
          icon="logout"
          @click="handleLogout"
          class="q-mr-sm"
        >
          <q-tooltip>Выйти</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-aivy-surface"
    >
      <div class="drawer-logo">
        <img :src="logoUrl" alt="Aivy Logo" />
      </div>

      <q-list>
        <q-item-label header> Управление </q-item-label>

        <q-item clickable v-ripple to="/exercises">
          <q-item-section avatar>
            <q-icon name="fitness_center" />
          </q-item-section>
          <q-item-section>Упражнения</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/modules">
          <q-item-section avatar>
            <q-icon name="view_module" />
          </q-item-section>
          <q-item-section>Модули</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/marathons">
          <q-item-section avatar>
            <q-icon name="event" />
          </q-item-section>
          <q-item-section>Марафоны</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/reference-books">
          <q-item-section avatar>
            <q-icon name="menu_book" />
          </q-item-section>
          <q-item-section>Справочники</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/actuals">
          <q-item-section avatar>
            <q-icon name="window" />
          </q-item-section>
          <q-item-section>Актуальные</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useQuasar } from 'quasar'
import EssentialLink, { EssentialLinkProps } from 'components/EssentialLink.vue'
import logoUrl from '../assets/svg/Cover.svg'

defineOptions({
  name: 'MainLayout',
})

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const leftDrawerOpen = ref(false)

const currentTitle = computed(() => {
  const path = route.path
  const titles: { [key: string]: string } = {
    '/exercises': 'Список упражнений',
    '/exercises/create': 'Создание упражнения',
    '/modules': 'Список модулей',
    '/marathons': 'Список марафонов',
    '/marathon-categories': 'Категории марафонов',
  }

  // Для страницы редактирования упражнения
  if (path.match(/^\/exercises\/\d+\/edit$/)) {
    return 'Редактирование упражнения'
  }

  return titles[path] || 'Aivy'
})

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

async function handleLogout() {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при выходе из системы',
    })
  }
}

const linksList: EssentialLinkProps[] = [
  {
    title: 'Упражнения',
    caption: 'Создание и редактирование упражнений',
    icon: 'fitness_center',
    link: '/exercises',
  },
  {
    title: 'Модули',
    caption: 'Создание и редактирование модулей',
    icon: 'view_module',
    link: '/modules',
  },
  {
    title: 'Марафоны',
    caption: 'Управление марафонами',
    icon: 'event_note',
    link: '/marathons',
  },
  {
    title: 'Категории марафонов',
    caption: 'Создание и редактирование категорий',
    icon: 'category',
    link: '/marathon-categories',
  },
]
</script>

<style lang="scss">
.aivy-gradient {
  background: linear-gradient(90deg, #60daca 0%, #64acd5 100%) !important;
}

.aivy-gradient-reversed {
  background: linear-gradient(270deg, #60daca 0%, #64acd5 100%) !important;
}

.drawer-logo {
  border-bottom: 1px solid $aivy-border;
  @extend .aivy-gradient;
  width: 100%;
  padding: 0;

  img {
    width: 100%;
    height: auto;
    display: block;
  }
}

.q-drawer {
  background: $aivy-surface !important;
  backdrop-filter: blur(10px);
}

.header {
  @extend .aivy-gradient-reversed;
  border-bottom: 1px solid $aivy-border;
}

// Глобальные стили для кнопок
.q-btn {
  &:not(.q-btn--flat):not(.q-btn--outline):not(.q-btn--unelevated):not(
      .q-header .q-btn
    ) {
    @extend .aivy-gradient;
    color: white !important;
    border: none;
  }
}

// Переопределение стилей для primary кнопок
.q-btn--standard.bg-primary {
  @extend .aivy-gradient;
}
</style>

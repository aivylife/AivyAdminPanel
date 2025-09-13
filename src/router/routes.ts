import { RouteRecordRaw } from 'vue-router'
import ModuleForm from 'components/ModuleForm.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('layouts/AuthLayout.vue'),
    children: [{ path: '', component: () => import('pages/LoginPage.vue') }],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/exercises' },
      { path: 'exercises', component: () => import('pages/ExercisesPage.vue') },
      {
        path: 'exercises/new',
        component: () => import('components/ExerciseForm.vue'),
      },
      {
        path: 'exercises/edit/:id',
        component: () => import('components/ExerciseForm.vue'),
      },
      {
        path: 'modules',
        component: () => import('pages/ModulesPage.vue'),
      },
      {
        path: 'modules/new',
        component: ModuleForm,
      },
      {
        path: 'modules/edit/:id',
        component: ModuleForm,
      },
      { path: 'marathons', component: () => import('pages/MarathonsPage.vue') },
      {
        path: 'marathons/new',
        component: () => import('components/MarathonForm.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'marathons/edit/:id',
        component: () => import('components/MarathonForm.vue'),
      },
      {
        path: 'marathon-categories',
        component: () => import('pages/MarathonCategoriesPage.vue'),
      },
      {
        path: 'reference-books',
        component: () => import('pages/ReferenceBooksPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'reference-books/:type',
        component: () => import('pages/ReferenceBookListPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'reference-books/exercise-categories',
        component: () =>
          import('pages/reference-books/ExerciseCategoriesPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'reference-books/exercise-formats',
        component: () =>
          import('pages/reference-books/ExerciseFormatsPage.vue'),
        meta: { requiresAuth: true },
      },
      { path: 'actuals', component: () => import('pages/ActualsListPage.vue') },
      {
        path: 'actuals/new',
        component: () => import('components/ActualsForm.vue'),
      },
      {
        path: 'actuals/edit/:id',
        component: () => import('components/ActualsForm.vue'),
      },
      { path: 'banners', component: () => import('pages/BannersListPage.vue') },
      {
        path: 'banners/new',
        component: () => import('components/BannersForm.vue'),
      },
      {
        path: 'banners/edit/:id',
        component: () => import('components/BannersForm.vue'),
      },
    ],
  },
  {
    path: '/auth/google/callback',
    component: () => import('pages/GoogleCallback.vue'),
    meta: { requiresAuth: false },
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes

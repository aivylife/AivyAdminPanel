<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h4">Упражнения</div>
      <q-btn
        color="primary"
        icon="add"
        label="Добавить упражнение"
        @click="router.push('/exercises/new')"
      />
    </div>

    <q-card>
      <q-card-section>
        <div class="text-h6">Список упражнений</div>
        <div class="row justify-between q-py-md q-gutter-x-md">
          <div class="col-3">
            <q-select
              v-model="filters.typeId"
              :options="exerciseTypes"
              label="Тип упражнения"
              outlined
              dense
              emit-value
              map-options
              bg-color="white"
              placeholder="Выбрать тип"
            />
          </div>
          <div class="col-3">
            <q-select
              v-model="filters.categoryId"
              :options="categories"
              label="Категория"
              outlined
              dense
              emit-value
              map-options
              bg-color="white"
              placeholder="Выбрать категорию"
            />
          </div>
          <div class="col-3">
            <q-select
              v-model="filters.formatId"
              :options="formats"
              label="Формат"
              outlined
              dense
              emit-value
              map-options
              bg-color="white"
              placeholder="Выбрать формат"
            />
          </div>
          <div class="">
            <q-input
              v-model="filters.search"
              label="поиск"
              dense
              outlined
            />
          </div>
        </div>
        <q-table
          :rows="exerciseStore.exercises"
          :columns="columns"
          row-key="id"
          :loading="exerciseStore.loading"
          v-model:pagination="pagination"
          @request="onRequest"
          @row-click="(evt, row) => router.push(`/exercises/edit/${row.id}`)"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                color="primary"
                icon="edit"
                @click.stop="router.push(`/exercises/edit/${props.row.id}`)"
              />
              <q-btn
                flat
                round
                color="negative"
                icon="delete"
                @click.stop="confirmDelete(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Диалог подтверждения удаления -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm">Вы уверены, что хотите удалить упражнение "{{ selectedExercise?.title }}"?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn flat label="Удалить" color="negative" @click="deleteExercise" :loading="deleting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useExerciseStore } from 'src/stores/exercise';
import { Exercise } from 'src/models/exercise';
import { QTableProps, useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();
const exerciseStore = useExerciseStore();

// Определяем тип для опций селекта
interface SelectOption {
  label: string;
  value: number | null; // Разрешаем null для "Все виды"
}

const exerciseTypes = ref<SelectOption[]>([]);
const categories = ref<SelectOption[]>([]);
const formats = ref<SelectOption[]>([]);
const filters = ref({
  typeId: null,
  categoryId: null,
  formatId: null,
  search: null
});
const showDeleteDialog = ref(false);
const selectedExercise = ref<Exercise | null>(null);
const deleting = ref(false);
const loading = ref(false);

const pagination = ref({
  sortBy: 'createdAt' as string | null,
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
});

// Указываем тип для колонок, чтобы исправить ошибку align
const columns: QTableProps['columns'] = [
  {
    name: 'actions',
    required: true,
    label: 'Действия',
    align: 'left',
    field: 'actions' // Это поле не используется для данных, только для слота
  },
  {
    name: 'createdAt',
    required: true,
    label: 'Дата создания',
    align: 'left',
    field: 'createdAt',
    sortable: true,
    format: (val: string) => new Date(val).toLocaleDateString('ru-RU')
  },
  {
    name: 'title',
    required: true,
    label: 'Название',
    align: 'left',
    field: 'title',
    sortable: true
  },
  {
    name: 'description',
    required: true,
    label: 'Описание',
    align: 'left',
    field: 'description',
    sortable: true
  },
  {
    name: 'type',
    required: true,
    label: 'Тип',
    align: 'left',
    field: (row: Exercise) => row.type?.name || 'N/A', 
    sortable: true
  },
  {
    name: 'timeCount',
    required: true,
    label: 'Длительность (мин)',
    align: 'left',
    field: 'timeCount',
    sortable: true
  }
];

// Указываем тип для props в onRequest
const onRequest = async (props: { pagination: QTableProps['pagination'] }) => {
  const { page = 1, rowsPerPage = 10, sortBy = null, descending = false } = props.pagination ?? pagination.value;

  const params: Record<string, any> = {
    page,
    perPage: rowsPerPage
  };

  // Обработка сортировки
  if (sortBy) {
    // Если кликнули на ту же колонку
    if (sortBy === pagination.value.sortBy) {
      // Если уже desc, значит это третий клик - сбрасываем сортировку
      if (pagination.value.descending) {
        pagination.value.sortBy = 'id';
        pagination.value.descending = true;
        params.order = JSON.stringify({ id: 'DESC' });
      } else {
        // Иначе меняем на desc
        pagination.value.descending = true;
        params.order = JSON.stringify({ [sortBy]: 'DESC' });
      }
    } else {
      // Если кликнули на другую колонку, начинаем с asc
      pagination.value.sortBy = sortBy;
      pagination.value.descending = false;
      params.order = JSON.stringify({ [sortBy]: 'ASC' });
    }
  } else {
    // Если нет активной сортировки, используем сортировку по id DESC
    pagination.value.sortBy = 'id';
    pagination.value.descending = true;
    params.order = JSON.stringify({ id: 'DESC' });
  }

  // Обновляем состояние пагинации для корректного отображения стрелок
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;

  // Добавляем фильтры
  if (filters.value.typeId) params.typeId = filters.value.typeId;
  if (filters.value.categoryId) params.categoryId = filters.value.categoryId;
  if (filters.value.formatId) params.formatId = filters.value.formatId;
  if (filters.value.search) {
    params['like.title'] = filters.value.search;
  }

  loading.value = true;
  try {
    await exerciseStore.fetchExercises(params);
    pagination.value.rowsNumber = exerciseStore.total;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Ошибка при загрузке упражнений' });
  } finally {
    loading.value = false;
  }
};

const confirmDelete = (exercise: Exercise) => {
  selectedExercise.value = exercise;
  showDeleteDialog.value = true;
};

const deleteExercise = async () => {
  if (!selectedExercise.value) return;

  deleting.value = true;
  try {
    await exerciseStore.deleteExercise(selectedExercise.value.id);
    $q.notify({
      type: 'positive',
      message: 'Упражнение успешно удалено'
    });
    showDeleteDialog.value = false;
    await onRequest({ pagination: pagination.value });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при удалении упражнения'
    });
  } finally {
    deleting.value = false;
  }
};

const fetchExerciseTypes = async () => {
  try {
    const response = await api.get<{ id: number; name: string }[]>('/api/exercise/types');
    // Используем тип SelectOption
    exerciseTypes.value = [
      { label: 'Все виды', value: null }, 
      ...response.data.map(type => ({
        label: type.name,
        value: type.id
      }))
    ];
  } catch (error) {
    console.error('Error fetching exercise types:', error);
    $q?.notify({
      type: 'negative',
      message: 'Ошибка при загрузке типов упражнений'
    });
  }
};

const fetchCategories = async () => {
  try {
    const response = await api.get<{ id: number; name: string }[]>('/api/exercise/categories');
    categories.value = [
      { label: 'Все категории', value: null },
      ...response.data.map(cat => ({ label: cat.name, value: cat.id }))
    ];
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Ошибка при загрузке категорий' });
  }
};

const fetchFormats = async () => {
  try {
    const response = await api.get<{ data: { id: number; name: string; categoryId: number }[] }>('/api/exercise/formats');
    formats.value = [
      { label: 'Все форматы', value: null },
      ...response.data.data.map((fmt: { id: number; name: string; categoryId: number }) => {
        // Найти название категории по id
        const cat = categories.value.find(c => c.value === fmt.categoryId);
        const catName = cat ? cat.label : '';
        return {
          label: catName ? `${fmt.name} (${catName})` : fmt.name,
          value: fmt.id
        };
      })
    ];
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Ошибка при загрузке форматов' });
  }
};

// Стало:
watch(
  [
    () => filters.value.typeId,
    () => filters.value.categoryId,
    () => filters.value.formatId,
    () => filters.value.search
  ],
  ([newTypeId, newCategoryId, newFormatId, newSearch], [oldTypeId, oldCategoryId, oldFormatId, oldSearch]) => {
    if (
      newTypeId !== oldTypeId ||
      newCategoryId !== oldCategoryId ||
      newFormatId !== oldFormatId ||
      newSearch !== oldSearch
    ) {
      pagination.value.page = 1;
      onRequest({ pagination: pagination.value });
    }
  },
  { immediate: true }
);

// Оставляем watch для обновления общего количества
watch(() => exerciseStore.total, (newTotal) => {
  pagination.value.rowsNumber = newTotal;
});

onMounted(async () => {
  await fetchExerciseTypes();
  await fetchCategories();
  await fetchFormats();
  onRequest({ pagination: pagination.value });
});
</script>

<style lang="scss" scoped>
.my-sticky-header-table {
  height: calc(100vh - 200px);

  :deep(.q-table__top) {
    background-color: $aivy-surface;
  }

  :deep(.q-table__bottom) {
    background-color: $aivy-surface;
  }

  :deep(thead tr th) {
    position: sticky;
    z-index: 1;
    background-color: $aivy-surface;
  }

  :deep(thead tr:first-child th) {
    top: 0;
  }
}
</style>

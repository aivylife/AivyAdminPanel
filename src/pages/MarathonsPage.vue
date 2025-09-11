<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h4">Марафоны</div>
      <q-btn
        label="Создать марафон"
        color="primary"
        icon="add"
        @click="router.push('/marathons/new')"
        class="q-px-md"
      />
    </div>

    <q-card>
      <q-card-section class="row justify-between items-center">
        <div class="text-h6">Список марафонов</div>
        <q-btn
          icon="filter_list"
          flat
          round
          dense
          @click="showFiltersDrawer = !showFiltersDrawer"
        >
          <q-tooltip>Фильтры</q-tooltip>
        </q-btn>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-table
          :rows="marathons"
          :columns="columns"
          row-key="id"
          :loading="loading"
          flat
          bordered
          :rows-per-page-options="[10, 20, 50]"
          wrap-cells
          v-model:pagination="pagination"
          @request="onRequest"
          @row-click="(evt, row) => editMarathon(row.id)"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="q-gutter-sm">
              <div class="row no-wrap justify-center">
                <q-btn
                  dense
                  round
                  flat
                  color="primary"
                  icon="edit"
                  @click.stop="editMarathon(props.row.id)"
                >
                  <q-tooltip>Редактировать</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  round
                  flat
                  color="negative"
                  icon="delete"
                  @click.stop="confirmDeleteMarathon(props.row.id)"
                >
                  <q-tooltip>Удалить</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
              <q-icon size="2em" name="sentiment_dissatisfied" />
              <span>Нет доступных марафонов</span>
              <q-btn
                label="Создать первый марафон"
                color="primary"
                no-caps
                @click="router.push('/marathons/new')"
                class="q-ml-md"
                size="sm"
              />
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Панель фильтров -->
    <q-drawer
      v-model="showFiltersDrawer"
      side="right"
      bordered
      overlay
      :width="350"
    >
      <div class="q-pa-md row justify-between items-center">
        <div class="text-h6">Фильтры</div>
        <q-btn
          icon="close"
          flat
          round
          dense
          @click="showFiltersDrawer = false"
        />
      </div>
      <q-separator />
      <q-scroll-area class="fit q-pa-md">
        <q-list separator>
          <!-- Поиск -->
          <q-item>
            <q-item-section>
              <q-input
                v-model="filters.search"
                label="Поиск"
                outlined
                dense
                clearable
                @update:model-value="onRequest({ pagination: pagination })"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-select
                v-model="filters.category"
                :options="categoryOptions"
                label="Категория"
                outlined
                dense
                emit-value
                map-options
                clearable
                @update:model-value="onRequest({ pagination: pagination })"
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-select
                v-model="filters.format"
                :options="formatOptions"
                label="Формат"
                outlined
                dense
                emit-value
                map-options
                clearable
                @update:model-value="onRequest({ pagination: pagination })"
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-select
                v-model="filters.direction"
                :options="directionOptions"
                label="Направление"
                outlined
                dense
                emit-value
                map-options
                clearable
                @update:model-value="onRequest({ pagination: pagination })"
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-select
                v-model="filters.rating"
                :options="ratingOptions"
                label="Оценка"
                outlined
                dense
                emit-value
                map-options
                clearable
                @update:model-value="onRequest({ pagination: pagination })"
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-select
                v-model="filters.isDraft"
                :options="draftOptions"
                label="Статус"
                outlined
                dense
                emit-value
                map-options
                clearable
                @update:model-value="onRequest({ pagination: pagination })"
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-select
                v-model="filters.isSubscription"
                :options="subscriptionOptions"
                label="Доступ по подписке"
                outlined
                dense
                emit-value
                map-options
                clearable
                @update:model-value="onRequest({ pagination: pagination })"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, QTableProps } from 'quasar';
import { api } from 'src/boot/axios';

interface FilterOption {
  label: string;
  value: number | null;
}

const router = useRouter();
const $q = useQuasar();
const marathons = ref([]);
const loading = ref(false);
const showFiltersDrawer = ref(false);

// Справочники
const categoryOptions = ref<FilterOption[]>([]);
const directionOptions = ref<FilterOption[]>([]);
const formatOptions = ref<FilterOption[]>([]);

// Фильтры
const filters = ref({
  category: null as number | null,
  rating: null as number | null,
  isDraft: null as boolean | null,
  isSubscription: null as boolean | null,
  format: null as number | null,
  direction: null as number | null,
  search: ''
});

// Опции для фильтров
const ratingOptions = [
  { label: 'Все оценки', value: null },
  { label: '5 звезд', value: 5 },
  { label: '4 звезды', value: 4 },
  { label: '3 звезды', value: 3 },
  { label: '2 звезды', value: 2 },
  { label: '1 звезда', value: 1 }
];

const draftOptions = [
  { label: 'Все', value: null },
  { label: 'Черновик', value: true },
  { label: 'Опубликовано', value: false }
];

const subscriptionOptions = [
  { label: 'Все', value: null },
  { label: 'По подписке', value: true },
  { label: 'Отдельно', value: false }
];

const pagination = ref({
  sortBy: 'createdAt' as string | null,
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
});

const columns: QTableProps['columns'] = [
  {
    name: 'actions',
    required: true,
    label: 'Действия',
    align: 'left',
    field: 'actions'
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
  { name: 'description', label: 'Описание', align: 'left' as const, field: 'description', sortable: true },
  { name: 'duration', label: 'Длительность (дни)', align: 'center' as const, field: 'duration', sortable: true }
];

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
  if (filters.value.category) params.categoryId = filters.value.category;
  if (filters.value.rating) params.rating = filters.value.rating;
  if (filters.value.isDraft !== null) params.isDraft = filters.value.isDraft;
  if (filters.value.isSubscription !== null) params.isSubscription = filters.value.isSubscription;
  if (filters.value.format) params.formatId = filters.value.format;
  if (filters.value.direction) params.directionId = filters.value.direction;
  if (filters.value.search) {
    params['like.title'] = filters.value.search;
  }

  loading.value = true;
  try {
    const response = await api.get('/api/marathon', { params });
    marathons.value = response.data.data || response.data;
    pagination.value.rowsNumber = response.data.pagination?.totalElements || response.data.total || 0;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Ошибка при загрузке марафонов' });
  } finally {
    loading.value = false;
  }
};

// Загрузка справочников
const fetchCategories = async () => {
  try {
    const response = await api.get('/api/marathon-filter/category');
    categoryOptions.value = (response.data.data || []).map((item: any) => ({
      label: item.name,
      value: item.id
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке категорий'
    });
  }
};

const fetchDirections = async () => {
  try {
    const response = await api.get('/api/marathon-filter/direction');
    directionOptions.value = (response.data.data || []).map((item: any) => ({
      label: item.name,
      value: item.id
    }));
  } catch (error) {
    console.error('Error fetching directions:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке направлений'
    });
  }
};

const fetchFormats = async () => {
  try {
    const response = await api.get('/api/marathon-filter/format');
    formatOptions.value = (response.data.data || []).map((item: any) => ({
      label: item.name,
      value: item.id
    }));
  } catch (error) {
    console.error('Error fetching formats:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке форматов'
    });
  }
};

const editMarathon = (id: number) => {
  router.push(`/marathons/edit/${id}`);
};

const confirmDeleteMarathon = (id: number) => {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы действительно хотите удалить этот марафон?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/api/marathon/${id}`);
      $q.notify({ type: 'positive', message: 'Марафон успешно удален' });
      onRequest({ pagination: pagination.value });
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Ошибка при удалении марафона' });
    }
  });
};

onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchDirections(),
    fetchFormats()
  ]);
  onRequest({ pagination: pagination.value });
});
</script>

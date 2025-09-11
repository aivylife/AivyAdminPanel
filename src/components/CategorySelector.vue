<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue')" persistent>
    <q-card style="width: 90vw; max-width: 800px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Выбор категории упражнения</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="$emit('update:modelValue', false)" />
      </q-card-section>

      <q-card-section>
        <!-- Поиск -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col">
            <q-input
              v-model="search"
              label="Поиск категорий"
              outlined
              dense
              clearable
              @update:model-value="onRequest({ pagination })"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </div>

        <!-- Таблица категорий -->
        <q-table
          :rows="categories"
          :columns="columns"
          row-key="id"
          :loading="loading"
          flat
          bordered
          class="category-select-table"
          :rows-per-page-options="[10, 20, 50]"
          v-model:pagination="pagination"
          @request="onRequest"
        >
          <template v-slot:body="props">
            <q-tr
              :props="props"
              class="cursor-pointer"
              @click="selectCategory(props.row)"
              v-ripple
            >
              <q-td key="id" :props="props">
                {{ props.row.id }}
              </q-td>
              <q-td key="name" :props="props">
                {{ props.row.name }}
              </q-td>
            </q-tr>
          </template>

          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
              <q-icon size="2em" name="sentiment_dissatisfied" />
              <span>Нет категорий для выбора</span>
            </div>
          </template>
        </q-table>

        <q-inner-loading :showing="loading">
          <q-spinner size="50px" color="primary" />
        </q-inner-loading>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" @click="$emit('update:modelValue', false)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from 'vue';
import { useQuasar, QTableColumn } from 'quasar';
import { api } from 'src/boot/axios';

interface Category {
  id: number;
  name: string;
  emoji: string;
}

export default defineComponent({
  name: 'CategorySelector',
  props: {
    modelValue: Boolean,
    initialCategory: {
      type: Object as PropType<Category | null>,
      default: null
    }
  },
  emits: ['update:modelValue', 'select'],

  setup(props, { emit }) {
    const $q = useQuasar();
    const categories = ref<Category[]>([]);
    const loading = ref(false);
    const selectedCategory = ref<Category | null>(props.initialCategory);
    const search = ref('');

    const pagination = ref({
      sortBy: 'name',
      descending: false,
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0
    });

    const columns: QTableColumn[] = [
      { name: 'id', label: 'ID', align: 'left', field: 'id', sortable: true },
      { name: 'name', label: 'Название', align: 'left', field: 'name', sortable: true }
    ];

    const fetchCategories = async () => {
      loading.value = true;
      try {
        const params: Record<string, any> = {
          page: pagination.value.page,
          perPage: pagination.value.rowsPerPage
        };

        if (search.value) {
          params['like.name'] = search.value;
        }

        if (pagination.value.sortBy) {
          params.order = JSON.stringify({
            [pagination.value.sortBy]: pagination.value.descending ? 'DESC' : 'ASC'
          });
        }

        const response = await api.get('/api/exercise/categories', { params });
        categories.value = response.data.data || response.data;
        pagination.value.rowsNumber = response.data.pagination?.totalElements || response.data.total || 0;
      } catch (error) {
        console.error('Error fetching categories:', error);
        $q.notify({
          type: 'negative',
          message: 'Ошибка при загрузке категорий'
        });
      } finally {
        loading.value = false;
      }
    };

    const onRequest = (props: { pagination: any }) => {
      const { page = 1, rowsPerPage = 10, sortBy = null, descending = false } = props.pagination ?? pagination.value;

      pagination.value.page = page;
      pagination.value.rowsPerPage = rowsPerPage;
      pagination.value.sortBy = sortBy || 'name';
      pagination.value.descending = descending;

      fetchCategories();
    };

    const selectCategory = (category: Category) => {
      selectedCategory.value = category;
      emit('select', category);
      emit('update:modelValue', false);
    };

    // Следим за открытием диалога
    watch(() => props.modelValue, (newValue) => {
      if (newValue) {
        fetchCategories();
      }
    });

    // Обновляем выбранную категорию при изменении initialCategory
    watch(() => props.initialCategory, (newCategory) => {
      selectedCategory.value = newCategory;
    }, { deep: true });

    return {
      categories,
      columns,
      loading,
      selectedCategory,
      search,
      pagination,
      onRequest,
      selectCategory
    };
  }
});
</script>

<style lang="scss" scoped>
.category-select-table {
  max-height: 60vh;
}
</style> 
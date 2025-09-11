<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue')" persistent>
    <q-card style="width: 90vw; max-width: 800px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Выбор формата упражнения</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="$emit('update:modelValue', false)" />
      </q-card-section>

      <q-card-section>
        <!-- Фильтры -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col">
            <q-input
              v-model="search"
              label="Поиск форматов"
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
          <div class="col-auto">
            <q-select
              v-model="selectedCategoryFilter"
              :options="categoryOptions"
              label="Фильтр по категории"
              outlined
              dense
              clearable
              emit-value
              map-options
              @update:model-value="onRequest({ pagination })"
            />
          </div>
        </div>

        <!-- Таблица форматов -->
        <q-table
          :rows="formats"
          :columns="columns"
          row-key="id"
          :loading="loading"
          flat
          bordered
          class="format-select-table"
          :rows-per-page-options="[10, 20, 50]"
          v-model:pagination="pagination"
          @request="onRequest"
        >
          <template v-slot:body="props">
            <q-tr
              :props="props"
              class="cursor-pointer"
              @click="selectFormat(props.row)"
              v-ripple
            >
              <q-td key="icon" :props="props" class="text-center">
                <img 
                  v-if="props.row.icon && props.row.icon.path" 
                  :src="getFullImagePath(props.row.icon.path)" 
                  alt="icon" 
                  style="width:24px;height:24px;object-fit:contain;" 
                />
                <q-icon v-else name="format_list_bulleted" size="24px" color="grey-5" />
              </q-td>
              <q-td key="name" :props="props">
                {{ props.row.name }}
              </q-td>
              <q-td key="categoryName" :props="props">
                {{ props.row.categoryName }}
              </q-td>
            </q-tr>
          </template>

          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
              <q-icon size="2em" name="sentiment_dissatisfied" />
              <span>Нет форматов для выбора</span>
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
import { defineComponent, ref, watch, PropType, computed } from 'vue';
import { useQuasar, QTableColumn } from 'quasar';
import { api } from 'src/boot/axios';

interface Format {
  id: number;
  name: string;
  categoryId: number;
  icon?: { id: number; name: string; path: string } | null;
}

interface Category {
  id: number;
  name: string;
  emoji: string;
}

export default defineComponent({
  name: 'FormatSelector',
  props: {
    modelValue: Boolean,
    initialFormat: {
      type: Object as PropType<Format | null>,
      default: null
    },
    categoryId: {
      type: Number,
      default: null
    }
  },
  emits: ['update:modelValue', 'select'],

  setup(props, { emit }) {
    const $q = useQuasar();
    const formats = ref<Format[]>([]);
    const categories = ref<Category[]>([]);
    const loading = ref(false);
    const selectedFormat = ref<Format | null>(props.initialFormat);
    const search = ref('');
    const selectedCategoryFilter = ref<number | null>(props.categoryId);

    const pagination = ref({
      sortBy: 'name',
      descending: false,
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0
    });

    const columns: QTableColumn[] = [
      { name: 'icon', label: 'Иконка', align: 'center', field: 'icon', sortable: false },
      { name: 'name', label: 'Название', align: 'left', field: 'name', sortable: true },
      { name: 'categoryName', label: 'Категория', align: 'left', field: 'categoryName', sortable: true }
    ];

    const categoryOptions = computed(() => {
      return categories.value.map(cat => ({
        label: cat.name,
        value: cat.id
      }));
    });

    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/exercise/categories');
        categories.value = response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    const fetchFormats = async () => {
      loading.value = true;
      try {
        const params: Record<string, any> = {
          page: pagination.value.page,
          perPage: pagination.value.rowsPerPage
        };

        if (search.value) {
          params['like.name'] = search.value;
        }

        if (selectedCategoryFilter.value) {
          params['categoryId'] = selectedCategoryFilter.value;
        }

        if (pagination.value.sortBy) {
          params.order = JSON.stringify({
            [pagination.value.sortBy]: pagination.value.descending ? 'DESC' : 'ASC'
          });
        }

        const response = await api.get('/api/exercise/formats', { params });
        const formatsData = response.data.data || response.data;
        
        // Добавляем название категории к каждому формату
        formats.value = formatsData.map((format: Format) => ({
          ...format,
          categoryName: getCategoryName(format.categoryId)
        }));
        
        pagination.value.rowsNumber = response.data.pagination?.totalElements || response.data.total || 0;
      } catch (error) {
        console.error('Error fetching formats:', error);
        $q.notify({
          type: 'negative',
          message: 'Ошибка при загрузке форматов'
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

      fetchFormats();
    };

    const selectFormat = (format: Format) => {
      selectedFormat.value = format;
      emit('select', format);
      emit('update:modelValue', false);
    };

    const getCategoryName = (categoryId: number): string => {
      const category = categories.value.find(c => c.id === categoryId);
      return category ? category.name : '';
    };

    const getFullImagePath = (path: string) => {
      if (!path) return '';
      if (path.startsWith('http')) return path;
      const baseUrl = (process.env.API_URL || 'https://aivy.mobgroup.kz').replace('/api', '');
      return `${baseUrl}${path}`;
    };

    // Следим за открытием диалога
    watch(() => props.modelValue, (newValue) => {
      if (newValue) {
        fetchCategories();
        fetchFormats();
      }
    });

    // Обновляем выбранный формат при изменении initialFormat
    watch(() => props.initialFormat, (newFormat) => {
      selectedFormat.value = newFormat;
    }, { deep: true });

    // Обновляем фильтр категории при изменении categoryId
    watch(() => props.categoryId, (newCategoryId) => {
      selectedCategoryFilter.value = newCategoryId;
    });

    return {
      formats,
      categories,
      columns,
      loading,
      selectedFormat,
      search,
      selectedCategoryFilter,
      categoryOptions,
      pagination,
      onRequest,
      selectFormat,
      getCategoryName,
      getFullImagePath
    };
  }
});
</script>

<style lang="scss" scoped>
.format-select-table {
  max-height: 60vh;
}
</style> 
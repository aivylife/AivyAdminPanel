<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue')" persistent>
    <q-card style="width: 90vw; max-width: 1200px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Выбор упражнений</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="$emit('update:modelValue', false)" />
      </q-card-section>

      <q-card-section>
        <!-- Фильтры и поиск (можно добавить позже) -->

        <q-table
          :rows="exercises"
          :columns="columns"
          row-key="id"
          :loading="loading"
          selection="multiple"
          v-model:selected="localSelected"
          flat
          bordered
          class="exercise-select-table"
          :rows-per-page-options="[10, 20, 50]"
          v-model:pagination="pagination"
          @request="onRequest"
        >
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
              <q-icon size="2em" name="sentiment_dissatisfied" />
              <span>Нет упражнений для выбора</span>
            </div>
          </template>
        </q-table>

        <q-inner-loading :showing="loading">
          <q-spinner size="50px" color="primary" />
        </q-inner-loading>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="Отмена" flat @click="$emit('update:modelValue', false)" />
        <q-btn label="Выбрать" color="primary" @click="confirmSelection" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, PropType, computed } from 'vue';
import { useQuasar, QTableColumn } from 'quasar';
import { api } from 'src/boot/axios';
import { Exercise } from 'src/types/exercise';

export default defineComponent({
  name: 'ExerciseSelector',
  props: {
    modelValue: Boolean, // Для управления видимостью диалога
    initialSelection: {
      type: Array as PropType<number[]>,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'update:selected'],

  setup(props, { emit }) {
    const $q = useQuasar();
    const exercises = ref<Exercise[]>([]);
    const loading = ref(false);
    const localSelected = ref<Exercise[]>([]); // Хранит выбранные объекты Exercise
    const total = ref(0);

    const pagination = ref({
      sortBy: 'createdAt',
      descending: true,
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0
    });

    const columns: QTableColumn[] = [
      { name: 'title', label: 'Название', align: 'left', field: 'title', sortable: true },
      { name: 'description', label: 'Краткое описание', align: 'left', field: 'description', classes: 'description-cell' },
      { name: 'type', label: 'Тип', align: 'left', field: row => row.type?.name || '-', sortable: true }, // Отображаем имя типа
      { name: 'timeCount', label: 'Время (мин)', align: 'center', field: 'timeCount', sortable: true },
    ];

    const fetchExercises = async (params: Record<string, any> = {}) => {
      loading.value = true;
      exercises.value = [];
      try {
        const response = await api.get<{ data: Exercise[], pagination: { totalElements: number, perPage: number, page: number } }>('/api/exercise', { 
          params: {
            ...params,
            isMarathon: true
          }
        });

        if (response.data && Array.isArray(response.data.data)) {
          exercises.value = response.data.data;
          if (response.data.pagination) {
            total.value = response.data.pagination.totalElements;
            pagination.value.rowsNumber = response.data.pagination.totalElements;
            pagination.value.page = response.data.pagination.page;
            pagination.value.rowsPerPage = response.data.pagination.perPage;
          }
        } else {
          console.error('Invalid API response structure for exercises:', response.data);
          $q.notify({
            type: 'negative',
            message: 'Некорректный ответ от сервера при загрузке упражнений'
          });
        }

        if (props.initialSelection.length > 0) {
          localSelected.value = exercises.value.filter(ex => props.initialSelection.includes(ex.id));
        }

      } catch (error) {
        console.error('Error fetching exercises:', error);
        $q.notify({
          type: 'negative',
          message: 'Ошибка при загрузке упражнений'
        });
      } finally {
        loading.value = false;
      }
    };

    const onRequest = async (props: { pagination: any }) => {
      const { page, rowsPerPage, sortBy, descending } = props.pagination;
      
      const params: Record<string, any> = {
        page,
        perPage: rowsPerPage
      };

      if (sortBy) {
        params.order = JSON.stringify({ [sortBy]: descending ? 'DESC' : 'ASC' });
      }

      await fetchExercises(params);
    };

    const confirmSelection = () => {
      const selectedIds = localSelected.value.map(ex => ex.id);
      emit('update:selected', selectedIds);
      emit('update:modelValue', false); // Закрываем диалог
    };

    // Следим за открытием диалога, чтобы загрузить данные
    watch(() => props.modelValue, (newValue) => {
      if (newValue) {
        fetchExercises();
      }
    });

    // Обновляем localSelected, если initialSelection изменился извне
    watch(() => props.initialSelection, (newSelection) => {
       localSelected.value = exercises.value.filter(ex => newSelection.includes(ex.id));
    }, { deep: true });


    return {
      exercises,
      columns,
      loading,
      localSelected,
      confirmSelection,
      pagination,
      onRequest
    };
  }
});
</script>

<style lang="scss" scoped>
.exercise-select-table {
  max-height: 60vh;
}

:deep(.description-cell) {
  max-width: 300px;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 
<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h4">Модули</div>
      <q-btn
        label="Создать модуль"
        color="primary"
        icon="add"
        @click="router.push('/modules/new')"
        class="q-px-md"
      />
    </div>

    <q-card>
      <q-card-section>
        <q-table
          title="Список модулей"
          :rows="modules"
          :columns="columns"
          row-key="id"
          :loading="loading"
          flat
          bordered
          :rows-per-page-options="[10, 20, 50]"
          wrap-cells
          v-model:pagination="pagination"
          @request="onRequest"
          @row-click="(evt, row) => editModule(row.id)"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="q-gutter-sm">
              <q-btn
                dense
                round
                flat
                color="primary"
                icon="edit"
                @click.stop="editModule(props.row.id)"
              >
                <q-tooltip>Редактировать</q-tooltip>
              </q-btn>
              <q-btn
                dense
                round
                flat
                color="negative"
                icon="delete"
                @click.stop="confirmDeleteModule(props.row.id)"
              >
                <q-tooltip>Удалить</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
              <q-icon size="2em" name="sentiment_dissatisfied" />
              <span>Нет доступных модулей</span>
              <q-btn
                label="Создать первый модуль"
                color="primary"
                no-caps
                @click="router.push('/modules/new')"
                class="q-ml-md"
                size="sm"
              />
            </div>
          </template>
        </q-table>
      </q-card-section>
      <q-inner-loading :showing="loading">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, QTableColumn, QTableProps } from 'quasar';
import { api } from 'src/boot/axios';

interface Module {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  title: string;
  description: string;
  duration: number;
  price: number;
  weekNumber: number;
  marathonId: number;
}

export default defineComponent({
  name: 'ModulesPage',

  setup() {
    const $q = useQuasar();
    const router = useRouter();
    const modules = ref<Module[]>([]);
    const loading = ref(false);
    const pagination = ref({
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0,
      sortBy: 'id' as string | null,
      descending: false
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
        format: (val: string) => new Date(val).toLocaleDateString('ru-RU'),
        style: 'min-width: 150px'
      },
      {
        name: 'title',
        required: true,
        label: 'Название',
        align: 'left',
        field: 'title',
        sortable: true,
        style: 'min-width: 200px'
      },
      { name: 'weekNumber', label: 'Неделя', align: 'center', field: 'weekNumber', sortable: true, style: 'min-width: 100px' },
      { name: 'description', label: 'Краткое описание', align: 'left', field: 'description', classes: 'description-cell', style: 'min-width: 300px; max-width: 400px; white-space: normal;' },
      { name: 'duration', label: 'Длительность (дни)', align: 'center', field: 'duration', sortable: true, style: 'min-width: 180px' },
      { name: 'price', label: 'Цена', align: 'center', field: 'price', sortable: true, style: 'min-width: 100px' }
    ];

    const editModule = (id: number) => {
      router.push(`/modules/edit/${id}`);
    };

    const deleteModule = async (id: number) => {
      loading.value = true;
      try {
        await api.delete(`/api/module/${id}`);
        $q.notify({
          type: 'positive',
          message: 'Модуль успешно удален'
        });
        onRequest({ pagination: pagination.value });
      } catch (error) {
        console.error('Error deleting module:', error);
        $q.notify({
          type: 'negative',
          message: 'Ошибка при удалении модуля'
        });
      } finally {
        loading.value = false;
      }
    };

    const confirmDeleteModule = (id: number) => {
      $q.dialog({
        title: 'Подтвердите удаление',
        message: 'Вы уверены, что хотите удалить этот модуль?',
        cancel: true,
        persistent: true,
        ok: {
          label: 'Удалить',
          color: 'negative',
          flat: false
        },
        cancel: {
          label: 'Отмена',
          flat: false
        }
      }).onOk(() => {
        deleteModule(id);
      });
    };

    const onRequest = async (props: { pagination: QTableProps['pagination'] }) => {
      const { page = 1, rowsPerPage = 10, sortBy = null, descending = false } = props.pagination ?? pagination.value;

      const params: Record<string, any> = {
        page,
        perPage: rowsPerPage
      };

      if (sortBy) {
        if (sortBy === pagination.value.sortBy) {
          if (pagination.value.descending) {
            pagination.value.sortBy = 'id';
            pagination.value.descending = true;
            params.order = JSON.stringify({ id: 'DESC' });
          } else {
            pagination.value.descending = true;
            params.order = JSON.stringify({ [sortBy]: 'DESC' });
          }
        } else {
          pagination.value.sortBy = sortBy;
          pagination.value.descending = false;
          params.order = JSON.stringify({ [sortBy]: 'ASC' });
        }
      } else {
        pagination.value.sortBy = 'id';
        pagination.value.descending = true;
        params.order = JSON.stringify({ id: 'DESC' });
      }

      pagination.value.page = page;
      pagination.value.rowsPerPage = rowsPerPage;

      loading.value = true;
      try {
        const response = await api.get('/api/module', { params });
        modules.value = response.data.data || response.data;
        pagination.value.rowsNumber = response.data.pagination?.totalElements || response.data.total || 0;
      } catch (error) {
        console.error('Error fetching modules:', error);
        $q.notify({ type: 'negative', message: 'Ошибка при загрузке модулей' });
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      onRequest({ pagination: pagination.value });
    });

    return {
      modules,
      columns,
      loading,
      editModule,
      confirmDeleteModule,
      pagination,
      onRequest,
      router
    };
  }
});
</script>

<style lang="scss" scoped>
.description-cell {
  max-width: 400px;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

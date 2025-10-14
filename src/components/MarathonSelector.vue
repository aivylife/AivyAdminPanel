<template>
  <div class="q-pa-md">
    <q-input
      v-model="filters.title"
      label="Поиск марафона"
      outlined
      dense
      clearable
      class="q-mb-md"
      @update:model-value="onRequest({ pagination: pagination })"
    >
      <template v-slot:append>
        <q-icon name="search" />
      </template>
    </q-input>

    <q-table
      :rows="marathons"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      :rows-per-page-options="[10, 20, 50]"
      v-model:pagination="pagination"
      @request="onRequest"
      class="marathon-table"
    >
      <template v-slot:body="props">
        <q-tr
          :props="props"
          class="cursor-pointer"
          @click="selectMarathon(props.row)"
          v-ripple
        >
          <q-td key="createdAt" :props="props">
            {{ new Date(props.row.createdAt).toLocaleDateString('ru-RU') }}
          </q-td>
          <q-td key="title" :props="props">
            {{ props.row.title }}
          </q-td>
        </q-tr>
      </template>

      <template v-slot:no-data>
        <div class="full-width row flex-center text-grey q-pa-md">
          <q-icon size="2em" name="sentiment_dissatisfied" class="q-mr-sm" />
          <span>Нет доступных марафонов</span>
        </div>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar, QTableProps } from 'quasar'
import { api } from 'src/boot/axios'

const emit = defineEmits(['select'])
const $q = useQuasar()
const marathons = ref([])
const loading = ref(false)

const filters = ref({
  title: '',
})

const pagination = ref({
  sortBy: 'id',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

const columns: QTableProps['columns'] = [
  {
    name: 'createdAt',
    required: true,
    label: 'Дата создания',
    align: 'left' as const,
    field: 'createdAt',
    sortable: true,
    format: (val: string) => new Date(val).toLocaleDateString('ru-RU'),
  },
  {
    name: 'title',
    required: true,
    label: 'Название',
    align: 'left' as const,
    field: 'title',
    sortable: true,
  },
]

const onRequest = async (props: { pagination: QTableProps['pagination'] }) => {
  const {
    page = 1,
    rowsPerPage = 10,
    sortBy = null,
    descending = false,
  } = props.pagination ?? pagination.value

  const params: Record<string, any> = {
    page,
    perPage: rowsPerPage,
  }

  // Обработка сортировки
  if (sortBy) {
    // Если кликнули на ту же колонку
    if (sortBy === pagination.value.sortBy) {
      // Если уже desc, значит это третий клик - сбрасываем сортировку
      if (pagination.value.descending) {
        pagination.value.sortBy = 'id'
        pagination.value.descending = true
        params.order = JSON.stringify({ id: 'DESC' })
      } else {
        // Иначе меняем на desc
        pagination.value.descending = true
        params.order = JSON.stringify({ [sortBy]: 'DESC' })
      }
    } else {
      // Если кликнули на другую колонку, начинаем с asc
      pagination.value.sortBy = sortBy
      pagination.value.descending = false
      params.order = JSON.stringify({ [sortBy]: 'ASC' })
    }
  } else {
    // Если нет активной сортировки, используем сортировку по id DESC
    pagination.value.sortBy = 'id'
    pagination.value.descending = true
    params.order = JSON.stringify({ id: 'DESC' })
  }

  // Обновляем состояние пагинации для корректного отображения стрелок
  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage

  if (filters.value.title) {
    params['like.title'] = filters.value.title
  }

  loading.value = true
  try {
    const response = await api.get('/marathon', { params })
    marathons.value = response.data.data || response.data
    pagination.value.rowsNumber =
      response.data.pagination?.totalElements || response.data.total || 0
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Ошибка при загрузке марафонов' })
  } finally {
    loading.value = false
  }
}

const selectMarathon = (marathon: any) => {
  emit('select', marathon)
}

onMounted(() => {
  onRequest({ pagination: pagination.value })
})
</script>

<style lang="scss" scoped>
.marathon-table {
  height: calc(100vh - 200px);
  .q-table__container {
    height: 100%;
  }
}
</style>

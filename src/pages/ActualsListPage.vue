<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h4">Актуальные</div>
      <q-btn
        label="Создать актуальное"
        color="primary"
        icon="add"
        @click="router.push('/actuals/new')"
        class="q-px-md"
      />
    </div>

    <q-card>
      <q-card-section class="row justify-between items-center">
        <div class="text-h6">Список актуальных</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-table
          :rows="actualStories"
          :columns="columns"
          row-key="id"
          :loading="loading"
          flat
          bordered
          :rows-per-page-options="[10, 20, 50]"
          wrap-cells
          v-model:pagination="pagination"
          @request="onRequest"
          @row-click="(evt, row) => editActualStory(row.id)"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="q-gutter-sm">
              <div class="row no-wrap items-center flex-start">
                <q-btn
                  dense
                  round
                  flat
                  color="primary"
                  icon="edit"
                  @click.stop="editActualStory(props.row.id)"
                >
                  <q-tooltip>Редактировать</q-tooltip>
                </q-btn>

                <q-btn
                  dense
                  round
                  flat
                  color="negative"
                  icon="delete"
                  @click.stop="confirmDeleteActualStory(props.row.id)"
                >
                  <q-tooltip>Удалить</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>

          <template v-slot:no-data>
            <div
              class="full-width row flex-center text-grey q-gutter-sm q-pa-lg"
            >
              <q-icon size="2em" name="sentiment_dissatisfied" />
              <span>Нет доступных актуальных</span>
              <q-btn
                label="Создать первое актуальное"
                color="primary"
                no-caps
                @click="router.push('/actuals/new')"
                class="q-ml-md"
                size="sm"
              />
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar, QTableProps } from 'quasar'
import { api } from 'src/boot/axios'

const router = useRouter()
const $q = useQuasar()
const actualStories = ref([])
const loading = ref(false)

const pagination = ref({
  sortBy: 'createdAt' as string | null,
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

const columns: QTableProps['columns'] = [
  {
    name: 'actions',
    required: true,
    label: 'Действия',
    align: 'left',
    field: 'actions',
  },
  {
    name: 'createdAt',
    required: true,
    label: 'Дата создания',
    align: 'left',
    field: 'createdAt',
    sortable: true,
    format: (val: string) => new Date(val).toLocaleDateString('ru-RU'),
  },
  {
    name: 'updatedAt',
    required: true,
    label: 'Дата обновления',
    align: 'left',
    field: 'updatedAt',
    sortable: true,
    format: (val: string) => new Date(val).toLocaleDateString('ru-RU'),
  },
  {
    name: 'name',
    required: true,
    label: 'Название',
    align: 'left',
    field: 'name',
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

  loading.value = true

  try {
    const response = await api.get('/actual-stories', { params })
    actualStories.value = response.data.data || response.data

    pagination.value.rowsNumber =
      response.data.pagination?.totalElements || response.data.total || 0
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Ошибка при загрузке актуальных' })
  } finally {
    loading.value = false
  }
}

const editActualStory = (id: number) => {
  router.push(`/actuals/edit/${id}`)
}

const confirmDeleteActualStory = (id: number) => {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы действительно хотите удалить это актуальное?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/actual-stories/${id}`)

      $q.notify({
        type: 'positive',
        message: 'Актуальное успешно удалено',
      })

      onRequest({ pagination: pagination.value })
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Ошибка при удалении актуального',
      })
    }
  })
}

onMounted(async () => {
  onRequest({ pagination: pagination.value })
})
</script>

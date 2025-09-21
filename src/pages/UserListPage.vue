<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h4">Пользователи</div>
    </div>

    <q-card>
      <q-card-section class="row justify-between items-center">
        <div class="text-h6">Список пользователей</div>

        <q-input v-model="filters.email" label="Почта" dense outlined />
      </q-card-section>

      <q-separator />
      <q-card-section>
        <q-table
          :rows="users"
          :columns="columns"
          row-key="id"
          :loading="loading"
          flat
          bordered
          :rows-per-page-options="[10, 20, 50]"
          wrap-cells
          v-model:pagination="pagination"
          @request="onRequest"
          @row-click="(evt, row) => editUser(row.id)"
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
                  @click.stop="editUser(props.row.id)"
                >
                  <q-tooltip>Редактировать</q-tooltip>
                </q-btn>

                <q-btn
                  dense
                  round
                  flat
                  color="negative"
                  icon="delete"
                  @click.stop="confirmDeleteUser(props.row.id)"
                >
                  <q-tooltip>Удалить</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar, QTableProps } from 'quasar'
import { api } from 'src/boot/axios'
import { PaginationData } from '@/types/utils'
import { Subscription, User } from '@/types/user'

const router = useRouter()
const $q = useQuasar()
const users = ref<User[]>([])

const loading = ref(false)

const pagination = ref({
  sortBy: 'createdAt' as string | null,
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

const filters = ref({
  email: null,
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
    label: 'Дата регистрации',
    align: 'left',
    field: 'createdAt',
    sortable: true,
    format: (val: string) => new Date(val).toLocaleDateString('ru-RU'),
  },
  {
    name: 'email',
    required: true,
    label: 'Email',
    align: 'left',
    field: 'email',
    sortable: false,
  },
  {
    name: 'name',
    required: true,
    label: 'Имя',
    align: 'left',
    field: 'name',
    sortable: false,
  },
  {
    name: 'subscription',
    required: true,
    label: 'Подписка',
    align: 'left',
    field: 'subscription',
    sortable: false,
    format: (val: User['subscription'] | null) => {
      if (!val) return 'Нет'

      return val.plan.name
    },
  },
]

const onRequest = async (props: { pagination: QTableProps['pagination'] }) => {
  const {
    page = 1,
    rowsPerPage = 10,
    sortBy = null,
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
        params.order = JSON.stringify({ [sortBy]: 'ASC' })
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

  // Добавляем фильтры
  if (filters.value.email) {
    params['like.email'] = filters.value.email
  }

  loading.value = true

  try {
    const response = await api.get<PaginationData<User[]>>('/api/user', {
      params: { ...params, relations: 'subscription' },
    })

    users.value = response.data.data || response.data
    pagination.value.rowsNumber = response.data.pagination?.totalElements || 0
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке пользователей',
    })
  } finally {
    loading.value = false
  }
}

const editUser = (id: number) => {
  router.push(`/users/${id}`)
}

const confirmDeleteUser = (id: number) => {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы действительно хотите удалить этого пользователя?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/api/user/${id}`)

      $q.notify({
        type: 'positive',
        message: 'Пользователь успешно удален',
      })

      onRequest({ pagination: pagination.value })
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Ошибка при удалении пользователя',
      })
    }
  })
}

watch(
  [() => filters.value.email],
  ([newEmail], [oldEmail]) => {
    if (newEmail !== oldEmail) {
      pagination.value.page = 1
      onRequest({ pagination: pagination.value })
    }
  },
  { immediate: true }
)

onMounted(async () => {
  onRequest({ pagination: pagination.value })
})
</script>

<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h4">Форматы упражнений</div>
      <q-btn color="primary" label="Добавить формат" @click="openDialog" />
    </div>

    <q-table
      :rows="formats"
      :columns="columns"
      row-key="id"
      :loading="loading"
      v-model:pagination="pagination"
      @request="onRequest"
      @row-click="(evt, row) => editFormat(row)"
    >
      <template v-slot:body-cell-icon="props">
        <q-td :props="props" class="q-pa-none text-center">
          <img
            v-if="props.row.icon && props.row.icon.path"
            :src="getFullImagePath(props.row.icon.path)"
            alt="icon"
            style="width: 28px; height: 28px; object-fit: contain"
          />
        </q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            color="primary"
            icon="edit"
            @click.stop="editFormat(props.row)"
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

    <q-dialog v-model="dialog" persistent>
      <q-card style="min-width: 400px; max-width: 560px; padding: 0 24px">
        <q-card-section>
          <div class="text-h5 text-weight-bold text-center">
            {{ isEdit ? 'Редактировать формат' : 'Добавить формат' }}
          </div>
        </q-card-section>
        <q-separator class="gradient-separator q-mt-xs" />
        <q-card-section class="">
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input
              v-model="form.name"
              label="Название"
              :rules="[(val) => !!val || 'Обязательное поле']"
              dense
              class="full-width q-mb-md"
            />
            <q-select
              v-model="form.categoryId"
              :options="categories"
              label="Категория"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              :rules="[(val) => !!val || 'Обязательное поле']"
              dense
              class="full-width q-mb-sm"
              :placeholder="'Выберите категорию'"
              clearable
            />
            <q-separator class="gradient-separator q-my-xs" />
            <div class="icon-row q-mb-md q-mt-sm">
              <div v-if="form.icon" class="icon-preview">
                <img :src="getFullImagePath(form.icon.path)" alt="icon" />
                <div class="icon-name">{{ form.icon.name }}</div>
              </div>
              <q-btn
                color="primary"
                icon="collections"
                label="Выбрать иконку"
                @click="showIconSelector = true"
                class="icon-btn"
                flat
              />
            </div>
            <q-separator class="gradient-separator q-my-xs" />
            <div class="image-row q-mb-md q-mt-sm">
              <div class="image-uploader full-width">
                <FileUploader
                  v-model="form.photo"
                  label="Изображение"
                  accept="image/*"
                  icon="image"
                  class="full-width"
                  dense
                />
              </div>
            </div>
            <q-separator class="gradient-separator q-my-md" />
            <div class="row justify-end q-mt-md">
              <q-btn label="Отмена" color="negative" flat v-close-popup />
              <q-btn
                label="СОХРАНИТЬ"
                type="submit"
                color="primary"
                class="q-ml-sm"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <IconSelector
      v-model="showIconSelector"
      :initial-icon="
        form.icon && form.icon.id
          ? {
              ...form.icon,
              type: '',
              uuidName: '',
              createdAt: '',
              updatedAt: '',
              createdById: 0,
              deletedAt: null,
            }
          : null
      "
      @select="onIconSelect"
    />

    <!-- Диалог подтверждения удаления -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
            >Вы уверены, что хотите удалить формат "{{
              selectedFormat?.name
            }}"?</span
          >
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn
            flat
            label="Удалить"
            color="negative"
            @click="deleteFormat"
            :loading="deleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api, BASE_URL } from 'src/boot/axios'
import FileUploader from 'src/components/FileUploader.vue'
import IconSelector from 'src/components/IconSelector.vue'

interface Category {
  id: number
  name: string
}

interface Format {
  id: number
  name: string
  photo: File | { id: number; name: string; path?: string } | null
  icon: { id: number; name: string; path: string } | null
  categoryId: number | null
}

interface Pagination {
  sortBy: string
  descending: boolean
  page: number
  rowsPerPage: number
  rowsNumber: number
}

export default defineComponent({
  name: 'ExerciseFormatsPage',
  components: { FileUploader, IconSelector },

  setup() {
    const $q = useQuasar()
    const loading = ref(false)
    const dialog = ref(false)
    const showIconSelector = ref(false)
    const isEdit = ref(false)
    const formats = ref<Format[]>([])
    const categories = ref<Category[]>([])
    const pagination = ref<Pagination>({
      sortBy: 'name',
      descending: false,
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0,
    })
    const showDeleteDialog = ref(false)
    const selectedFormat = ref<Format | null>(null)
    const deleting = ref(false)

    const form = ref({
      id: null as number | null,
      name: '',
      photo: null as File | { id: number; name: string; path?: string } | null,
      icon: null as { id: number; name: string; path: string } | null,
      categoryId: null as number | null,
    })

    const columns = [
      {
        name: 'icon',
        label: 'Иконка',
        field: 'icon',
        align: 'center' as const,
        sortable: false,
        style: 'width: 44px; min-width: 44px; max-width: 56px;',
      },
      { name: 'name', label: 'Название', field: 'name', sortable: true },
      {
        name: 'category',
        label: 'Категория',
        field: (row: Format) =>
          categories.value.find((c) => c.id === row.categoryId)?.name,
        sortable: true,
      },
      {
        name: 'actions',
        label: 'Действия',
        field: 'actions',
        align: 'right' as const,
      },
    ]

    const getFullImagePath = (path: string) => {
      if (!path) return ''
      if (path.startsWith('http')) return path

      return `${BASE_URL}${path}`
    }

    const onRequest = async (props: any) => {
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

      if (sortBy) {
        params.order = JSON.stringify({ [sortBy]: descending ? 'DESC' : 'ASC' })
      }

      loading.value = true
      try {
        const response = await api.get('/exercise/formats', { params })
        formats.value = response.data.data || []
        pagination.value.page = response.data.pagination?.page || 1
        pagination.value.rowsPerPage = response.data.pagination?.perPage || 10
        pagination.value.rowsNumber =
          response.data.pagination?.totalElements || 0
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Ошибка при загрузке форматов',
          icon: 'error',
        })
      } finally {
        loading.value = false
      }
    }

    const loadCategories = async () => {
      try {
        const response = await api.get('/exercise/categories')
        categories.value = response.data
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Ошибка при загрузке категорий',
          icon: 'error',
        })
      }
    }

    const openDialog = () => {
      isEdit.value = false
      form.value = {
        id: null,
        name: '',
        photo: null,
        icon: null,
        categoryId: null,
      }
      dialog.value = true
    }

    const editFormat = (format: Format) => {
      isEdit.value = true
      form.value = {
        id: format.id,
        name: format.name,
        photo: format.photo || null,
        icon: format.icon,
        categoryId: format.categoryId,
      }
      dialog.value = true
    }

    const onIconSelect = (icon: { id: number; name: string; path: string }) => {
      form.value.icon = icon
    }

    const onSubmit = async () => {
      try {
        const data: any = {
          name: form.value.name,
          categoryId: form.value.categoryId,
        }
        if (form.value.photo && 'id' in form.value.photo) {
          data.photoId = form.value.photo.id
        }
        if (form.value.icon && form.value.icon.id) {
          data.icon = { id: form.value.icon.id }
        }
        if (isEdit.value && form.value.id) {
          await api.patch(`/exercise/format/${form.value.id}`, data)
        } else {
          await api.post('/exercise/format', data)
        }
        dialog.value = false
        onRequest({ pagination: pagination.value })
        $q.notify({
          color: 'positive',
          message: 'Формат успешно сохранён',
          icon: 'check',
        })
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Ошибка при сохранении формата',
          icon: 'error',
        })
      }
    }

    const confirmDelete = (format: Format) => {
      selectedFormat.value = format
      showDeleteDialog.value = true
    }

    const deleteFormat = async () => {
      if (!selectedFormat.value) return

      deleting.value = true
      try {
        await api.delete(`/exercise/format/${selectedFormat.value.id}`)
        onRequest({ pagination: pagination.value })
        $q.notify({
          color: 'positive',
          message: 'Формат успешно удалён',
          icon: 'check',
        })
        showDeleteDialog.value = false
      } catch (error) {
        console.error('Error deleting format:', error)
        $q.notify({
          color: 'negative',
          message: 'Ошибка при удалении формата',
          icon: 'error',
        })
      } finally {
        deleting.value = false
      }
    }

    onMounted(() => {
      onRequest({ pagination: pagination.value })
      loadCategories()
    })

    return {
      loading,
      dialog,
      showIconSelector,
      isEdit,
      formats,
      categories,
      pagination,
      form,
      columns,
      openDialog,
      editFormat,
      onSubmit,
      confirmDelete,
      onIconSelect,
      getFullImagePath,
      onRequest,
      showDeleteDialog,
      selectedFormat,
      deleting,
      deleteFormat,
    }
  },
})
</script>

<style scoped>
.full-width {
  width: 100%;
}
:deep(.gradient-separator) {
  background: linear-gradient(135deg, #4fd1c5 0%, #5a67d8 100%) !important;
  height: 2px;
  margin: 8px 0;
}
.icon-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 56px;
}
.icon-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.icon-preview img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: 8px;
  background: #f5f5f5;
}
.icon-name {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
  max-width: 80px;
  text-align: center;
  word-break: break-all;
}
.icon-btn {
  height: 36px;
  align-self: center;
  min-width: 120px;
}
.image-row {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
  min-height: 80px;
}
.image-preview {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.image-preview img {
  max-width: 60px;
  max-height: 60px;
  width: auto;
  height: auto;
  display: block;
}
.image-uploader {
  flex: 1;
}
</style>

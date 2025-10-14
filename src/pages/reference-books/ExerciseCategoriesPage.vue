<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h4">Категории упражнений</div>
    </div>

    <q-table
      :rows="categories"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :pagination.sync="pagination"
      @row-click="(evt, row) => editCategory(row)"
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
            @click.stop="editCategory(props.row)"
          />
          <!-- <q-btn flat round color="negative" icon="delete" @click.stop="confirmDelete(props.row)" /> -->
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialog" persistent>
      <q-card style="min-width: 400px; max-width: 560px; padding: 0 24px">
        <q-card-section>
          <div class="text-h5 text-weight-bold text-center">
            {{ isEdit ? 'Редактировать категорию' : 'Добавить категорию' }}
          </div>
        </q-card-section>
        <q-separator class="gradient-separator q-mt-xs" />
        <q-card-section class="">
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input
              v-model="form.name"
              label="Название"
              readonly
              class="full-width q-mb-md"
              dense
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
            <q-separator class="gradient-separator q-my-xs" />
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
  photo: File | { id: number; name: string; path?: string } | null
  icon: { id: number; name: string; path: string } | null
}

export default defineComponent({
  name: 'ExerciseCategoriesPage',
  components: { FileUploader, IconSelector },

  setup() {
    const $q = useQuasar()
    const loading = ref(false)
    const dialog = ref(false)
    const showIconSelector = ref(false)
    const isEdit = ref(false)
    const categories = ref<Category[]>([])
    const pagination = ref({
      sortBy: 'name',
      descending: false,
      page: 1,
      rowsPerPage: 10,
    })

    const form = ref({
      id: null as number | null,
      name: '',
      photo: null as File | { id: number; name: string; path?: string } | null,
      icon: null as { id: number; name: string; path: string } | null,
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

    const loadCategories = async () => {
      loading.value = true
      try {
        const response = await api.get('/exercise/categories')
        categories.value = response.data
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Ошибка при загрузке категорий',
          icon: 'error',
        })
      } finally {
        loading.value = false
      }
    }

    const openDialog = () => {
      isEdit.value = false
      form.value = {
        id: null,
        name: '',
        photo: null,
        icon: null,
      }
      dialog.value = true
    }

    const editCategory = (category: Category) => {
      isEdit.value = true
      form.value = {
        id: category.id,
        name: category.name,
        photo: null,
        icon: category.icon,
      }
      dialog.value = true
    }

    const onIconSelect = (icon: { id: number; name: string; path: string }) => {
      form.value.icon = icon
    }

    const onSubmit = async () => {
      try {
        const formData = new FormData()
        formData.append('name', form.value.name)
        if (form.value.photo) {
          if ('id' in form.value.photo) {
            formData.append('photoId', form.value.photo.id.toString())
          } else {
            formData.append('photo', form.value.photo)
          }
        }
        if (form.value.icon) {
          formData.append('icon', JSON.stringify({ id: form.value.icon.id }))
        }
        if (isEdit.value && form.value.id) {
          await api.patch(`/exercise/category/${form.value.id}`, formData)
        } else {
          await api.post('/exercise/category', formData)
        }
        dialog.value = false
        loadCategories()
        $q.notify({
          color: 'positive',
          message: 'Категория успешно сохранена',
          icon: 'check',
        })
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Ошибка при сохранении категории',
          icon: 'error',
        })
      }
    }

    const confirmDelete = (category: Category) => {
      $q.dialog({
        title: 'Подтверждение',
        message: 'Вы уверены, что хотите удалить эту категорию?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await api.delete(`/exercise/categories/${category.id}`)
          loadCategories()
          $q.notify({
            color: 'positive',
            message: 'Категория успешно удалена',
            icon: 'check',
          })
        } catch (error) {
          $q.notify({
            color: 'negative',
            message: 'Ошибка при удалении категории',
            icon: 'error',
          })
        }
      })
    }

    onMounted(() => {
      loadCategories()
    })

    return {
      loading,
      dialog,
      showIconSelector,
      isEdit,
      categories,
      pagination,
      form,
      columns,
      openDialog,
      editCategory,
      onSubmit,
      confirmDelete,
      onIconSelect,
      getFullImagePath,
    }
  },
})
</script>

<style lang="scss" scoped>
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.emoji-btn {
  font-size: 24px;
  padding: 4px;
  min-height: 40px;
  min-width: 40px;
}

.full-width {
  width: 100%;
}
.gradient-separator {
  width: 100%;
  height: 2px;
  background: linear-gradient(135deg, #4fd1c5 0%, #5a67d8 100%) !important;
  border: none;
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

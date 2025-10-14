<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h4">{{ title }}</div>
      <q-btn
        label="Добавить"
        color="primary"
        icon="add"
        @click="openForm"
        class="q-px-md"
      />
    </div>

    <q-card>
      <q-table
        :rows="items"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="{ rowsPerPage: 10 }"
        flat
        bordered
      >
        <template v-if="showIconColumn" v-slot:body-cell-icon="props">
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
              dense
              color="primary"
              icon="edit"
              @click="editItem(props.row)"
              class="q-mr-sm"
            />
            <q-btn
              flat
              round
              dense
              color="negative"
              icon="delete"
              @click="confirmDelete(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Форма создания/редактирования -->
    <q-dialog v-model="showForm" persistent>
      <q-card style="min-width: 400px; max-width: 560px; padding: 0 24px">
        <q-card-section>
          <div class="text-h5 text-weight-bold text-center">
            {{ formTitle }}
          </div>
        </q-card-section>
        <!-- <q-separator class="gradient-separator q-mt-xs" /> -->
        <q-card-section class="">
          <q-form @submit="saveItem" class="q-gutter-md">
            <q-input
              v-model="formData.name"
              label="Название"
              :rules="[(val) => !!val || 'Обязательное поле']"
              outlined
              dense
              class="full-width q-mb-md"
            />
            <!-- <q-separator v-if="showIconField" class="gradient-separator q-my-xs" /> -->
            <div v-if="showIconField" class="icon-row q-mb-md q-mt-sm">
              <div v-if="formData.icon" class="icon-preview">
                <img :src="getFullImagePath(formData.icon.path)" alt="icon" />
                <div class="icon-name">{{ formData.icon.name }}</div>
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
            <q-separator class="gradient-separator q-my-md" />
            <div class="row justify-end q-mt-md">
              <q-btn label="Отмена" color="negative" flat v-close-popup />
              <q-btn
                label="СОХРАНИТЬ"
                type="submit"
                color="primary"
                class="q-ml-sm"
                :loading="saving"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <IconSelector
      v-model="showIconSelector"
      :initial-icon="
        formData.icon && formData.icon.id
          ? {
              ...formData.icon,
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
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
            >Вы уверены, что хотите удалить этот элемент?</span
          >
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn
            flat
            label="Удалить"
            color="negative"
            @click="deleteItem"
            :loading="deleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api, BASE_URL } from 'src/boot/axios'
import IconSelector from 'src/components/IconSelector.vue'

interface ReferenceItem {
  id: number
  name: string
  icon?: { id: number; name: string; path: string } | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

interface FormData {
  name: string
  icon: { id: number; name: string; path: string } | null
}

export default defineComponent({
  name: 'ReferenceBookListPage',
  components: { IconSelector },
  setup() {
    const $q = useQuasar()
    const route = useRoute()
    const router = useRouter()
    const loading = ref(false)
    const saving = ref(false)
    const deleting = ref(false)
    const showForm = ref(false)
    const showDeleteDialog = ref(false)
    const showIconSelector = ref(false)
    const items = ref<ReferenceItem[]>([])
    const selectedItem = ref<ReferenceItem | null>(null)
    const formData = ref<FormData>({ name: '', icon: null })

    const referenceType = route.params.type as string
    const referenceConfig = {
      categories: {
        title: 'Категории',
        endpoint: '/marathon-filter/category',
        hasIcon: false,
      },
      directions: {
        title: 'Направления',
        endpoint: '/marathon-filter/direction',
        hasIcon: true,
      },
      formats: {
        title: 'Форматы',
        endpoint: '/marathon-filter/format',
        hasIcon: false,
      },
    }

    const config =
      referenceConfig[referenceType as keyof typeof referenceConfig]
    if (!config) {
      router.push('/reference-books')
      return {}
    }

    const title = ref(config.title)
    const showIconColumn = ref(config.hasIcon)
    const showIconField = ref(config.hasIcon)
    const formTitle = computed(() =>
      selectedItem.value ? 'Редактировать' : 'Добавить'
    )

    const columns = [
      { name: 'id', label: 'ID', field: 'id', align: 'left' as const },
      {
        name: 'name',
        label: 'Название',
        field: 'name',
        align: 'left' as const,
      },
      ...(showIconColumn.value
        ? [
            {
              name: 'icon',
              label: 'Иконка',
              field: 'icon',
              align: 'center' as const,
              style: 'width: 44px; min-width: 44px; max-width: 56px;',
            },
          ]
        : []),
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

    const fetchItems = async () => {
      loading.value = true
      try {
        const response = await api.get(config.endpoint)
        items.value = response.data.data || []
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Ошибка при загрузке данных',
        })
      } finally {
        loading.value = false
      }
    }

    const openForm = () => {
      selectedItem.value = null
      formData.value = { name: '', icon: null }
      showForm.value = true
    }

    const editItem = (item: ReferenceItem) => {
      selectedItem.value = item
      formData.value = { name: item.name || '', icon: item.icon || null }
      showForm.value = true
    }

    const onIconSelect = (icon: { id: number; name: string; path: string }) => {
      formData.value.icon = icon
    }

    const saveItem = async () => {
      if (!formData.value.name) {
        $q.notify({ type: 'negative', message: 'Введите название' })
        return
      }

      saving.value = true
      try {
        const dataToSave: Record<string, any> = { name: formData.value.name }
        if (showIconField.value && formData.value.icon) {
          dataToSave.icon = { id: formData.value.icon.id }
        }

        if (selectedItem.value) {
          await api.patch(
            `${config.endpoint}/${selectedItem.value.id}`,
            dataToSave
          )
          $q.notify({ type: 'positive', message: 'Элемент успешно обновлен' })
        } else {
          await api.post(config.endpoint, dataToSave)
          $q.notify({ type: 'positive', message: 'Элемент успешно создан' })
        }

        showForm.value = false
        fetchItems()
      } catch (error) {
        $q.notify({ type: 'negative', message: 'Ошибка при сохранении' })
      } finally {
        saving.value = false
      }
    }

    const confirmDelete = (item: ReferenceItem) => {
      selectedItem.value = item
      showDeleteDialog.value = true
    }

    const deleteItem = async () => {
      if (!selectedItem.value) return

      deleting.value = true
      try {
        await api.delete(`${config.endpoint}/${selectedItem.value.id}`)
        $q.notify({ type: 'positive', message: 'Элемент успешно удален' })
        showDeleteDialog.value = false
        fetchItems()
      } catch (error) {
        $q.notify({ type: 'negative', message: 'Ошибка при удалении' })
      } finally {
        deleting.value = false
      }
    }

    const openLucideWebsite = () => {
      window.open('https://lucide.dev/icons', '_blank', 'noopener,noreferrer')
    }

    onMounted(() => {
      fetchItems()
    })

    return {
      title,
      formTitle,
      items,
      columns,
      loading,
      saving,
      deleting,
      showForm,
      showDeleteDialog,
      showIconSelector,
      formData,
      showIconColumn,
      showIconField,
      openForm,
      editItem,
      saveItem,
      confirmDelete,
      deleteItem,
      onIconSelect,
      getFullImagePath,
      openLucideWebsite,
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
</style>

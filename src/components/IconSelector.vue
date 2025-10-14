<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue')"
    persistent
  >
    <q-card style="width: 90vw; max-width: 1200px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Выбор иконки</div>
        <q-space />
        <q-btn
          icon="close"
          flat
          round
          dense
          @click="$emit('update:modelValue', false)"
        />
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Поиск и загрузка -->
          <div class="col-12">
            <div class="row q-col-gutter-md">
              <div class="col">
                <q-input
                  v-model="search"
                  label="Поиск иконок"
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
                <q-btn
                  color="primary"
                  icon="upload"
                  label="Загрузить иконку"
                  @click="showUploadDialog = true"
                />
              </div>
            </div>
          </div>

          <!-- Сетка иконок -->
          <div class="col-12">
            <div class="icon-grid">
              <div
                v-for="icon in icons"
                :key="icon.id"
                class="icon-card"
                :class="{ 'selected-icon': selectedIcon?.id === icon.id }"
                @click="selectIcon(icon)"
              >
                <div class="icon-img-wrapper">
                  <img
                    :src="getFullImagePath(icon.path)"
                    class="icon-img"
                    @error="handleImageError"
                    alt="icon"
                  />
                </div>
                <div class="text-caption icon-name">{{ icon.name }}</div>
              </div>
            </div>
          </div>

          <!-- Пагинация -->
          <div class="col-12">
            <div class="row justify-center">
              <q-pagination
                v-model="pagination.page"
                :max="Math.ceil(pagination.rowsNumber / pagination.rowsPerPage)"
                :max-pages="6"
                boundary-numbers
                direction-links
                @update:model-value="onRequest({ pagination })"
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="Отмена" flat @click="$emit('update:modelValue', false)" />
        <q-btn
          label="Выбрать"
          color="primary"
          @click="confirmSelection"
          :disable="!selectedIcon"
        />
      </q-card-actions>
    </q-card>

    <!-- Диалог загрузки иконки -->
    <q-dialog v-model="showUploadDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Загрузка иконки</div>
        </q-card-section>

        <q-card-section>
          <q-file
            v-model="newIcon"
            label="Выберите файл"
            accept="image/*"
            outlined
            :rules="[(val) => !!val || 'Выберите файл']"
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn label="Отмена" flat v-close-popup />
          <q-btn
            label="Загрузить"
            color="primary"
            @click="uploadIcon"
            :loading="uploading"
            :disable="!newIcon"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api, BASE_URL } from 'src/boot/axios'

interface Icon {
  id: number
  name: string
  path: string
  type: string
  uuidName: string
  createdAt: string
  updatedAt: string
  createdById: number
  deletedAt: string | null
}

interface Props {
  modelValue: boolean
  initialIcon?: Icon | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', icon: Icon): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const $q = useQuasar()
const icons = ref<Icon[]>([])
const selectedIcon = ref<Icon | null>(props.initialIcon || null)
const search = ref('')
const showUploadDialog = ref(false)
const newIcon = ref<File | null>(null)
const uploading = ref(false)

const pagination = ref({
  page: 1,
  rowsPerPage: 24,
  rowsNumber: 0,
})

const getFullImagePath = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http')) return path

  return `${BASE_URL}${path}`
}

const handleImageError = (error: any) => {
  console.error('Error loading image:', error)
}

const loadIcons = async () => {
  try {
    const params: Record<string, any> = {
      page: pagination.value.page,
      perPage: pagination.value.rowsPerPage,
    }

    if (search.value) {
      params.search = search.value
    }

    const response = await api.get('/api-file/file/icons', { params })
    icons.value = response.data
    pagination.value.rowsNumber = response.data.length
  } catch (error) {
    console.error('Error loading icons:', error)
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке иконок',
    })
  }
}

const onRequest = async ({
  pagination: newPagination,
}: {
  pagination: typeof pagination.value
}) => {
  pagination.value = newPagination
  await loadIcons()
}

const selectIcon = (icon: Icon) => {
  selectedIcon.value = icon
}

const confirmSelection = () => {
  if (selectedIcon.value) {
    emit('select', selectedIcon.value)
    emit('update:modelValue', false)
  }
}

const uploadIcon = async () => {
  if (!newIcon.value) return

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', newIcon.value)

    await api.post('/api-file/file/upload/icon', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    $q.notify({
      type: 'positive',
      message: 'Иконка успешно загружена',
    })

    showUploadDialog.value = false
    newIcon.value = null
    await loadIcons()
  } catch (error) {
    console.error('Error uploading icon:', error)
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке иконки',
    })
  } finally {
    uploading.value = false
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      loadIcons()
    }
  }
)
</script>

<style lang="scss" scoped>
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 20px;
  padding: 12px 0;
}

.icon-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 16px 8px 8px 8px;
  cursor: pointer;
  min-height: 120px;
  min-width: 100px;
  transition: box-shadow 0.2s, border 0.2s;
  border: 2px solid transparent;
}

.icon-card.selected-icon {
  border: 2px solid var(--q-primary);
}

.icon-img-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.icon-img {
  max-width: 48px;
  max-height: 48px;
  width: auto;
  height: auto;
  display: block;
  margin: 0 auto;
}

.icon-name {
  width: 100%;
  text-align: center;
  margin-top: 4px;
  word-break: break-all;
  font-size: 12px;
  color: #666;
}
</style>

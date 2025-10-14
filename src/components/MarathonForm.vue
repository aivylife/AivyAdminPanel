<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h4">
        {{ isEdit ? 'Редактировать' : 'Создать' }} марафон
      </div>
      <q-btn
        flat
        color="grey-8"
        icon="arrow_back"
        label="Назад"
        @click="router.push('/marathons')"
        class="q-px-md"
      />
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Форма марафона -->
      <div class="col-12 col-md-8">
        <q-card class="marathon-form-card q-pa-md">
          <q-card-section>
            <q-form @submit="onSubmit" class="q-gutter-md">
              <!-- Основные поля -->
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="formData.title"
                    label="Название"
                    :rules="[(val) => !!val || 'Обязательное поле']"
                    outlined
                    bg-color="white"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model.number="formData.price"
                    label="Цена"
                    type="number"
                    :rules="[
                      (val) => val >= 0 || 'Цена не может быть отрицательной',
                    ]"
                    outlined
                    bg-color="white"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model.number="formData.rating"
                    label="Рейтинг"
                    type="number"
                    :rules="[
                      (val) =>
                        val >= 0 || 'Рейтинг не может быть отрицательным',
                    ]"
                    outlined
                    bg-color="white"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model.number="formData.newPrice"
                    label="Новая цена"
                    type="number"
                    :rules="[
                      (val) => val >= 0 || 'Цена не может быть отрицательной',
                    ]"
                    outlined
                    bg-color="white"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                  <q-input
                    v-model.number="formData.durationDays"
                    label="Длительность (дни)"
                    type="number"
                    :rules="[
                      (val) =>
                        val >= 0 || 'Длительность не может быть отрицательной',
                    ]"
                    outlined
                    bg-color="white"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <q-input
                    v-model.number="formData.durationMinutes"
                    label="Длительность (минуты)"
                    type="number"
                    :rules="[
                      (val) =>
                        val >= 0 || 'Длительность не может быть отрицательной',
                    ]"
                    outlined
                    bg-color="white"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <q-input
                    v-model.number="formData.accessDuration"
                    label="Доступ (дни)"
                    type="number"
                    :rules="[
                      (val) =>
                        val >= 0 ||
                        'Длительность доступа не может быть отрицательной',
                    ]"
                    outlined
                    bg-color="white"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model.number="formData.charityCount"
                    label="Количество благотворительных мест"
                    type="number"
                    :rules="[
                      (val) =>
                        val >= 0 || 'Количество не может быть отрицательным',
                    ]"
                    outlined
                    bg-color="white"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-toggle
                    v-model="formData.isReleased"
                    label="Опубликован"
                    color="primary"
                  />
                </div>
              </div>

              <!-- Выбор категории, направления и формата -->
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                  <q-select
                    v-model="formData.categoryId"
                    :options="categoryOptions"
                    label="Категория"
                    :rules="[(val) => !!val || 'Обязательное поле']"
                    outlined
                    emit-value
                    map-options
                    bg-color="white"
                    :loading="loadingCategories"
                    placeholder="Выбрать категорию"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <q-select
                    v-model="formData.directionId"
                    :options="directionOptions"
                    label="Направление"
                    :rules="[(val) => !!val || 'Обязательное поле']"
                    outlined
                    emit-value
                    map-options
                    bg-color="white"
                    :loading="loadingDirections"
                    placeholder="Выбрать направление"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <q-select
                    v-model="formData.formatId"
                    :options="formatOptions"
                    label="Формат"
                    :rules="[(val) => !!val || 'Обязательное поле']"
                    outlined
                    emit-value
                    map-options
                    bg-color="white"
                    :loading="loadingFormats"
                    placeholder="Выбрать формат"
                  />
                </div>
              </div>

              <q-separator class="q-my-lg" />

              <!-- Текстовые поля -->
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    v-model="formData.description"
                    label="Описание"
                    type="textarea"
                    outlined
                    bg-color="white"
                    autogrow
                    class="description-field"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <!-- <q-input
                    v-model="formData.marketingText"
                    label="Маркетинговый текст"
                    type="textarea"
                    outlined
                    bg-color="white"
                    autogrow
                    class="description-field"
                  /> -->
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <MarkdownEditor
                    v-model="targetTextModel"
                    label="Цель марафона"
                    class="description-field"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <MarkdownEditor
                    v-model="problemTextModel"
                    label="Проблема"
                    class="description-field"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <MarkdownEditor
                    v-model="solutionTextModel"
                    label="Решение"
                    class="description-field"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <MarkdownEditor
                    v-model="resultsTextModel"
                    label="Результаты, которые вы получите"
                    class="description-field"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <MarkdownEditor
                    v-model="longTermChangesTextModel"
                    label="Долгосрочные изменения"
                    class="description-field"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <MarkdownEditor
                    v-model="suitableTextModel"
                    label="Для кого подходит"
                    class="description-field"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <MarkdownEditor
                    v-model="participationFormatTextModel"
                    label="Формат участия"
                    class="description-field"
                  />
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <!-- <q-input
                    v-model="formData.sellingText"
                    label="Продающий текст"
                    type="textarea"
                    outlined
                    bg-color="white"
                    autogrow
                    class="description-field"
                  /> -->
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <FileUploader
                    v-model="formData.photo"
                    :initial-file="formData.photo"
                    label="Фото марафона, используйте изображение в формате .webp"
                    accept="image/webp"
                    icon="photo"
                    :rules="[(val) => !!val || 'Фото обязательно']"
                  />
                </div>
              </div>

              <div class="row justify-end q-gutter-sm">
                <q-btn
                  label="Отмена"
                  type="button"
                  color="grey-7"
                  flat
                  class="q-px-md"
                  @click="router.push('/marathons')"
                />
                <q-btn
                  label="Сохранить"
                  type="submit"
                  color="primary"
                  :loading="loading"
                  class="q-px-xl"
                />
              </div>
            </q-form>
          </q-card-section>
          <q-inner-loading
            :showing="
              loading ||
              loadingCategories ||
              loadingDirections ||
              loadingFormats
            "
          >
            <q-spinner size="50px" color="primary" />
          </q-inner-loading>
        </q-card>
      </div>

      <!-- Список модулей -->
      <div class="col-12 col-md-4">
        <q-card class="modules-card q-pa-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Модули марафона</div>
            <q-list separator>
              <q-item
                v-for="module in sortedModules"
                :key="module.id"
                class="q-pa-sm"
              >
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{
                    module.title
                  }}</q-item-label>
                  <q-item-label caption>
                    Неделя {{ module.weekNumber }} • {{ module.duration }} дней
                  </q-item-label>
                  <q-item-label caption class="text-primary">
                    {{ module.price }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    round
                    dense
                    color="primary"
                    icon="edit"
                    @click="editModule(module)"
                  >
                    <q-tooltip>Редактировать модуль</q-tooltip>
                  </q-btn>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-btn
                    flat
                    color="primary"
                    icon="add"
                    label="Добавить модуль"
                    @click="addNewModule"
                    class="full-width"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Модальное окно редактирования модуля -->
    <q-dialog v-model="showModuleForm" persistent>
      <q-card style="min-width: 800px">
        <q-card-section class="q-pt-none">
          <MarathonModuleForm
            :module-id="editingModuleId"
            :marathon-id="formData.id || 0"
            :model-value="
              editingModuleId
                ? formData.modules.find((m) => m.id === editingModuleId)
                : null
            "
            :hide-marathon-field="true"
            @submit="handleModuleSubmit"
            @cancel="showModuleForm = false"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import FileUploader from './FileUploader.vue'
import MarathonModuleForm from './MarathonModuleForm.vue'
import MarkdownEditor from './MarkdownEditor.vue'

interface MarathonFormData {
  id?: number
  title: string
  description: string
  photoId?: number
  photo?: {
    id: number
    name: string
    uuidName: string
    path: string
  }
  price: number
  newPrice: number
  durationDays: number
  durationMinutes: number
  marketingText: string
  sellingText: string
  rating: number
  accessDuration: number
  isReleased: boolean
  charityCount: number
  categoryId: number
  directionId: number
  formatId: number
  modules: any[]
  targetText?: string
  problemText?: string
  solutionText?: string
  resultsText?: string
  longTermChangesText?: string
  suitableText?: string
  participationFormatText?: string
}

interface FilterOption {
  label: string
  value: number
}

export default defineComponent({
  name: 'MarathonForm',

  components: {
    FileUploader,
    MarathonModuleForm,
    MarkdownEditor,
  },

  setup() {
    const $q = useQuasar()
    const router = useRouter()
    const route = useRoute()
    const loading = ref(false)
    const loadingCategories = ref(false)
    const loadingDirections = ref(false)
    const loadingFormats = ref(false)
    const isEdit = computed(() => !!route.params.id)
    const showModuleForm = ref(false)
    const editingModuleId = ref<number | undefined>(undefined)

    const formData = ref<MarathonFormData>({
      title: '',
      description: '',
      photo: undefined,
      photoId: undefined,
      price: 0,
      newPrice: 0,
      durationDays: 0,
      durationMinutes: 0,
      marketingText: '',
      sellingText: '',
      rating: 0,
      accessDuration: 0,
      isReleased: false,
      charityCount: 0,
      categoryId: 0,
      directionId: 0,
      formatId: 0,
      modules: [],
    })

    const categoryOptions = ref<FilterOption[]>([])
    const directionOptions = ref<FilterOption[]>([])
    const formatOptions = ref<FilterOption[]>([])

    const sortedModules = computed(() => {
      return [...formData.value.modules].sort(
        (a, b) => a.weekNumber - b.weekNumber
      )
    })

    const fetchCategories = async () => {
      loadingCategories.value = true
      try {
        const response = await api.get('/marathon-filter/category')
        categoryOptions.value = (response.data.data || []).map((item: any) => ({
          label: item.name,
          value: item.id,
        }))
      } catch (error) {
        console.error('Error fetching categories:', error)
        $q.notify({
          type: 'negative',
          message: 'Ошибка при загрузке категорий',
        })
      } finally {
        loadingCategories.value = false
      }
    }

    const fetchDirections = async () => {
      loadingDirections.value = true
      try {
        const response = await api.get('/marathon-filter/direction')
        directionOptions.value = (response.data.data || []).map(
          (item: any) => ({
            label: item.name,
            value: item.id,
          })
        )
      } catch (error) {
        console.error('Error fetching directions:', error)
        $q.notify({
          type: 'negative',
          message: 'Ошибка при загрузке направлений',
        })
      } finally {
        loadingDirections.value = false
      }
    }

    const fetchFormats = async () => {
      loadingFormats.value = true
      try {
        const response = await api.get('/marathon-filter/format')
        formatOptions.value = (response.data.data || []).map((item: any) => ({
          label: item.name,
          value: item.id,
        }))
      } catch (error) {
        console.error('Error fetching formats:', error)
        $q.notify({
          type: 'negative',
          message: 'Ошибка при загрузке форматов',
        })
      } finally {
        loadingFormats.value = false
      }
    }

    const fetchMarathonData = async (id: string | number) => {
      loading.value = true
      try {
        const response = await api.get(`/marathon/${id}`, {
          params: {
            relations: 'modules,modules.dayExercises',
          },
        })
        const data = response.data
        formData.value = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          photoId: data.photoId,
          photo: data.photo,
          price: data.price || 0,
          newPrice: data.newPrice || 0,
          durationDays: data.durationDays || 0,
          durationMinutes: data.durationMinutes || 0,
          marketingText: '',
          sellingText: '',
          rating: data.rating || 0,
          accessDuration: data.accessDuration || 0,
          isReleased: data.isReleased ?? true,
          charityCount: data.charityCount || 0,
          categoryId: data.categoryId || 0,
          directionId: data.directionId || 0,
          formatId: data.formatId || 0,
          modules: data.modules || [],
          targetText: data.targetText || '',
          problemText: data.problemText || '',
          solutionText: data.solutionText || '',
          resultsText: data.resultsText || '',
          longTermChangesText: data.longTermChangesText || '',
          suitableText: data.suitableText || '',
          participationFormatText: data.participationFormatText || '',
        }
        console.log('Загруженные данные марафона:', formData.value)
      } catch (error) {
        console.error('Error loading marathon:', error)
        $q.notify({
          type: 'negative',
          message: 'Ошибка при загрузке марафона',
        })
        router.push('/marathons')
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchCategories()
      fetchDirections()
      fetchFormats()
      const id = route.params.id
      if (isEdit.value && typeof id === 'string') {
        fetchMarathonData(id)
      }
    })

    const onSubmit = async () => {
      loading.value = true
      try {
        if (isEdit.value) {
          await api.patch(`/marathon/${route.params.id}`, formData.value)
          $q.notify({
            type: 'positive',
            message: 'Марафон успешно обновлен',
          })
        } else {
          await api.post('/marathon', formData.value)
          $q.notify({
            type: 'positive',
            message: 'Марафон успешно создан',
          })
        }
        router.push('/marathons')
      } catch (error: any) {
        console.error('Error saving marathon:', error)
        const message =
          error.response?.data?.message || 'Ошибка при сохранении марафона'
        $q.notify({
          type: 'negative',
          message: message,
        })
      } finally {
        loading.value = false
      }
    }

    const editModule = (module: any) => {
      editingModuleId.value = module.id
      showModuleForm.value = true
    }

    const addNewModule = () => {
      editingModuleId.value = undefined
      showModuleForm.value = true
    }

    const handleModuleSubmit = () => {
      showModuleForm.value = false
      if (formData.value.id) {
        fetchMarathonData(formData.value.id)
      }
    }

    // Computed для MarkdownEditor, чтобы всегда была строка
    const targetTextModel = computed({
      get: () => formData.value.targetText || '',
      set: (v) => (formData.value.targetText = v),
    })
    const problemTextModel = computed({
      get: () => formData.value.problemText || '',
      set: (v) => (formData.value.problemText = v),
    })
    const solutionTextModel = computed({
      get: () => formData.value.solutionText || '',
      set: (v) => (formData.value.solutionText = v),
    })
    const resultsTextModel = computed({
      get: () => formData.value.resultsText || '',
      set: (v) => (formData.value.resultsText = v),
    })
    const longTermChangesTextModel = computed({
      get: () => formData.value.longTermChangesText || '',
      set: (v) => (formData.value.longTermChangesText = v),
    })
    const suitableTextModel = computed({
      get: () => formData.value.suitableText || '',
      set: (v) => (formData.value.suitableText = v),
    })
    const participationFormatTextModel = computed({
      get: () => formData.value.participationFormatText || '',
      set: (v) => (formData.value.participationFormatText = v),
    })

    return {
      formData,
      loading,
      loadingCategories,
      loadingDirections,
      loadingFormats,
      isEdit,
      onSubmit,
      categoryOptions,
      directionOptions,
      formatOptions,
      showModuleForm,
      editingModuleId,
      sortedModules,
      editModule,
      addNewModule,
      handleModuleSubmit,
      router,
      targetTextModel,
      problemTextModel,
      solutionTextModel,
      resultsTextModel,
      longTermChangesTextModel,
      suitableTextModel,
      participationFormatTextModel,
    }
  },
})
</script>

<style lang="scss" scoped>
.marathon-form-card {
  max-width: 900px;
  margin: 0 auto;
}

.description-field {
  min-height: 100px;
}

:deep(.q-separator) {
  background: linear-gradient(
    135deg,
    $aivy-turquoise-5 0%,
    $aivy-indigo-3 100%
  );
  height: 2px;
  margin: 24px 0;
}

.modules-card {
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}
</style>

<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h4">
        {{ isEdit ? 'Редактировать' : 'Создать' }} модуль
      </div>
      <q-btn
        flat
        color="grey-8"
        icon="arrow_back"
        label="Назад"
        @click="router.push('/modules')"
        class="q-px-md"
      />
    </div>

    <q-card class="module-form-card q-pa-md">
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
                v-model="selectedMarathonTitle"
                label="Марафон"
                :rules="[(val) => !!val || 'Обязательное поле']"
                outlined
                bg-color="white"
                readonly
              >
                <template v-slot:append>
                  <q-btn
                    flat
                    round
                    dense
                    icon="search"
                    @click="showMarathonSelector = true"
                  />
                </template>
              </q-input>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model="formData.description"
                label="Краткое описание"
                type="textarea"
                outlined
                bg-color="white"
                autogrow
                class="description-field"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="formData.weekNumber"
                label="Номер недели"
                type="number"
                :rules="[
                  (val) => val > 0 || 'Номер недели должен быть больше 0',
                ]"
                outlined
                bg-color="white"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="formData.duration"
                label="Длительность (дни)"
                type="number"
                :rules="[
                  (val) => val > 0 || 'Длительность должна быть больше 0',
                ]"
                outlined
                bg-color="white"
              />
            </div>
            <div class="col-12 col-md-4">
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

          <!-- Выбор упражнений -->
          <q-separator class="q-my-lg" />
          <div class="row justify-between items-center q-mb-md">
            <div class="text-h6">Упражнения по дням</div>
            <q-btn
              label="Добавить день"
              color="secondary"
              icon="add"
              @click="addDay"
              size="sm"
            />
          </div>

          <!-- Используем groupedDayExercises для итерации -->
          <q-list
            v-if="groupedDayExercises.length > 0"
            bordered
            class="q-mb-md"
          >
            <q-expansion-item
              v-for="dayGroup in groupedDayExercises"
              :key="dayGroup.dayNumber"
              :label="`День ${dayGroup.dayNumber}`"
              group="days-group"
              header-class="text-primary"
              expand-icon-class="text-primary"
            >
              <div class="row justify-between items-center q-pa-sm">
                <span class="text-grey">День {{ dayGroup.dayNumber }}</span>
                <!-- Просто отображаем номер дня -->
                <div>
                  <q-btn
                    label="Добавить/Изменить упражнения"
                    color="primary"
                    icon="add"
                    @click="openExerciseSelector(dayGroup.dayNumber)"
                    size="sm"
                    class="q-mr-sm"
                  />
                  <!-- Кнопки управления порядком дней -->
                  <q-btn
                    flat
                    round
                    dense
                    color="primary"
                    icon="arrow_upward"
                    @click="moveDayUp(dayGroup.dayNumber)"
                    size="sm"
                    class="q-mr-xs"
                    :disable="isDayFirst(dayGroup.dayNumber)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    color="primary"
                    icon="arrow_downward"
                    @click="moveDayDown(dayGroup.dayNumber)"
                    size="sm"
                    class="q-mr-sm"
                    :disable="isDayLast(dayGroup.dayNumber)"
                  />
                  <!-- Удаление дня -->
                  <q-btn
                    flat
                    round
                    dense
                    color="negative"
                    icon="delete"
                    @click="removeDayAssignments(dayGroup.dayNumber)"
                    size="sm"
                  />
                </div>
              </div>

              <!-- Итерируем по assignments внутри группы дня -->
              <q-list
                v-if="dayGroup.assignments.length > 0"
                separator
                dense
                class="q-mt-sm exercise-list"
              >
                <q-item
                  v-for="assignment in dayGroup.assignments"
                  :key="assignment.exerciseId + '-' + assignment.order"
                  class="exercise-item"
                >
                  <!-- Используем getExerciseDetailsById для получения названия -->
                  <q-item-section>
                    <q-item-label
                      >({{ assignment.order }})
                      {{
                        assignment.exercise?.title || 'Упражнение не найдено'
                      }}</q-item-label
                    >
                  </q-item-section>
                  <q-item-section side v-if="assignment.exerciseId !== -1">
                    <div class="row items-center">
                      <q-btn
                        flat
                        round
                        dense
                        color="primary"
                        icon="arrow_upward"
                        @click.stop="moveExerciseUp(assignment)"
                        size="sm"
                        class="q-mr-xs"
                        :disable="isExerciseFirst(assignment)"
                      />
                      <q-btn
                        flat
                        round
                        dense
                        color="primary"
                        icon="arrow_downward"
                        @click.stop="moveExerciseDown(assignment)"
                        size="sm"
                        class="q-mr-sm"
                        :disable="isExerciseLast(assignment)"
                      />
                      <q-btn
                        flat
                        round
                        dense
                        color="negative"
                        icon="remove_circle_outline"
                        @click.stop="removeExerciseAssignment(assignment)"
                        size="sm"
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else class="text-grey text-center q-pa-sm">
                Нет упражнений для этого дня.
              </div>
            </q-expansion-item>
          </q-list>
          <div v-else class="text-grey text-center q-pa-md">
            Нажмите "Добавить день", чтобы добавить новый день и упражнения к
            нему.
          </div>

          <q-separator class="q-my-lg" />

          <div class="row justify-end q-gutter-sm">
            <q-btn
              label="Отмена"
              type="button"
              color="grey-7"
              flat
              class="q-px-md"
              @click="router.push('/modules')"
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
      <q-inner-loading :showing="loading || loadingMarathons">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>
    </q-card>

    <!-- Диалог выбора упражнений (пока не используется для dayExercises) -->
    <ExerciseSelector
      v-model="showExerciseSelector"
      :initial-selection="selectorInitialSelection"
      @update:selected="updateSelectedExercisesForDay"
    />

    <!-- Модальное окно выбора марафона -->
    <q-dialog v-model="showMarathonSelector">
      <q-card style="width: 700px; max-width: 90vw">
        <q-card-section class="row items-center">
          <div class="text-h6">Выбор марафона</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-none">
          <MarathonSelector @select="selectMarathon" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import type { Exercise } from 'src/types/exercise'
import type { MarathonModule } from 'src/types/marathon'
import ExerciseSelector from './ExerciseSelector.vue'
import MarathonSelector from './MarathonSelector.vue'

interface DayExerciseAssignment {
  dayNumber: number
  order: number
  exerciseId: number
  exercise?: Exercise
}

interface ModuleFormData {
  id?: number
  title: string
  description: string
  duration: number
  price: number
  weekNumber: number
  marathonId: number | null
  dayExercises: DayExerciseAssignment[]
}

interface Marathon {
  id: number
  title: string
  type: string
}

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const loading = ref(false)
const loadingMarathons = ref(false)
const isEdit = computed(() => !!route.params.id)
const showExerciseSelector = ref(false)
const currentDayNumber = ref<number | null>(null) // Переименовано с currentDayIndex
const allExercises = ref<Exercise[]>([])
const marathonOptions = ref<{ label: string; value: number }[]>([])
const showMarathonSelector = ref(false)
const selectedMarathonTitle = ref('')
const marathonFilter = ref({
  search: '',
  category: null as number | null,
  format: null as number | null,
  direction: null as number | null,
  rating: null as number | null,
  isDraft: null as boolean | null,
  isSubscription: null as boolean | null,
})
const marathons = ref([])
const marathonPagination = ref({
  sortBy: 'createdAt',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

const columns = [
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
  {
    name: 'description',
    label: 'Описание',
    align: 'left' as const,
    field: 'description',
    sortable: true,
  },
  {
    name: 'duration',
    label: 'Длительность (дни)',
    align: 'center' as const,
    field: 'duration',
    sortable: true,
  },
  {
    name: 'actions',
    label: 'Действия',
    align: 'center' as const,
    field: 'actions',
  },
]

const formData = ref<ModuleFormData>({
  title: '',
  description: '',
  duration: 0,
  price: 0,
  weekNumber: 1,
  marathonId: null,
  dayExercises: [],
})

// Загрузка списка марафонов
const fetchMarathons = async () => {
  loadingMarathons.value = true
  try {
    const response = await api.get<{ data: { id: number; title: string }[] }>(
      '/marathon'
    )
    if (response.data && Array.isArray(response.data.data)) {
      marathonOptions.value = response.data.data.map((m) => ({
        label: m.title,
        value: m.id,
      }))
    } else if (Array.isArray(response.data)) {
      marathonOptions.value = response.data.map((m) => ({
        label: m.title,
        value: m.id,
      }))
    } else {
      console.error('Invalid API response structure for marathons')
      marathonOptions.value = []
    }
  } catch (error) {
    console.error('Error fetching marathons:', error)
    marathonOptions.value = []
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке списка марафонов',
    })
  } finally {
    loadingMarathons.value = false
  }
}

// Функция для загрузки всех упражнений (нужна для деталей)
const fetchAllExercises = async () => {
  try {
    const response = await api.get<{ data: Exercise[] }>('/exercise')
    if (response.data && Array.isArray(response.data.data)) {
      allExercises.value = response.data.data
    } else if (Array.isArray(response.data)) {
      allExercises.value = response.data
    } else {
      console.error('Invalid API response structure for all exercises')
      allExercises.value = []
    }
  } catch (error) {
    console.error('Error fetching all exercises:', error)
    allExercises.value = []
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке списка упражнений',
    })
  }
}

// Загружаем данные модуля при редактировании
const fetchModuleData = async (id: string | number) => {
  loading.value = true
  try {
    const response = await api.get(`/module/${id}`, {
      params: { relations: 'dayExercises,dayExercises.exercise,marathon' },
    })
    const moduleData = response.data
    // Сортируем полученные назначения по дню и порядку
    const sortedDayExercises = (moduleData.dayExercises || []).sort(
      (
        a: { dayNumber: number; order: number; exerciseId: number },
        b: { dayNumber: number; order: number; exerciseId: number }
      ) => {
        if (a.dayNumber !== b.dayNumber) {
          return a.dayNumber - b.dayNumber
        }
        return a.order - b.order
      }
    )
    formData.value = {
      id: moduleData.id,
      title: moduleData.title,
      description: moduleData.description || '',
      duration: moduleData.duration,
      price: moduleData.price,
      weekNumber: moduleData.weekNumber,
      marathonId: moduleData.marathonId,
      dayExercises: sortedDayExercises,
    }
    selectedMarathonTitle.value = moduleData.marathon?.title || ''
  } catch (error) {
    console.error('Error loading module:', error)
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке модуля',
    })
    router.push('/modules')
  } finally {
    loading.value = false
  }
}

// Группируем упражнения по дням для отображения в UI
const groupedDayExercises = computed(() => {
  const groups: { [key: number]: DayExerciseAssignment[] } = {}
  for (const assignment of formData.value.dayExercises) {
    if (!groups[assignment.dayNumber]) {
      groups[assignment.dayNumber] = []
    }
    groups[assignment.dayNumber].push(assignment)
    // Сортируем внутри дня по order (на всякий случай, если прилетели не по порядку)
    groups[assignment.dayNumber].sort((a, b) => a.order - b.order)
  }
  // Возвращаем массив пар [dayNumber, assignments], отсортированный по dayNumber
  return Object.entries(groups)
    .map(([day, assignments]) => ({
      dayNumber: parseInt(day, 10),
      assignments,
    }))
    .sort((a, b) => a.dayNumber - b.dayNumber)
})

// Пересчет номеров дней для всех дней
const recalculateDayNumbers = () => {
  // Получаем все уникальные номера дней и сортируем их
  const allDayNumbers = [
    ...new Set(formData.value.dayExercises.map((a) => a.dayNumber)),
  ].sort((a, b) => a - b)

  // Создаем мапу для пересчета номеров
  const dayNumberMap = new Map()
  allDayNumbers.forEach((oldNumber, index) => {
    dayNumberMap.set(oldNumber, index + 1)
  })

  // Обновляем номера дней во всех назначениях
  formData.value.dayExercises = formData.value.dayExercises.map(
    (assignment) => ({
      ...assignment,
      dayNumber: dayNumberMap.get(assignment.dayNumber) || assignment.dayNumber,
    })
  )
}

// Обновление функции addDay для добавления нового дня с корректным dayNumber
const addDay = () => {
  // Находим максимальный номер дня среди существующих назначений
  const maxDayNumber =
    formData.value.dayExercises.length > 0
      ? Math.max(...formData.value.dayExercises.map((d) => d.dayNumber))
      : 0

  // Используем следующий номер дня
  const nextDayNumber = maxDayNumber + 1

  // Добавляем пустое назначение с временным exerciseId, чтобы день отобразился
  formData.value.dayExercises.push({
    dayNumber: nextDayNumber,
    order: 1,
    exerciseId: -1, // Временный ID, который будет удален при добавлении реальных упражнений
  })

  // Увеличиваем длительность на 1 день
  formData.value.duration = nextDayNumber

  // Уведомляем пользователя о добавлении дня
  $q.notify({
    type: 'info',
    message: `День ${nextDayNumber} добавлен. Используйте кнопку "Добавить/Изменить упражнения", чтобы добавить упражнения.`,
  })
}

// Обновление функции removeDayAssignments для удаления всех упражнений, связанных с удаляемым днем
const removeDayAssignments = (dayNumber: number) => {
  formData.value.dayExercises = formData.value.dayExercises.filter(
    (assignment) => assignment.dayNumber !== dayNumber
  )

  // Пересчитываем номера дней после удаления
  recalculateDayNumbers()

  // Обновляем длительность
  formData.value.duration = Math.max(
    ...formData.value.dayExercises.map((d) => d.dayNumber),
    0
  )
}

// Открытие селектора упражнений для конкретного дня
const openExerciseSelector = (dayNumber: number) => {
  currentDayNumber.value = dayNumber // Используем номер дня
  showExerciseSelector.value = true
}

// Обновление упражнений для выбранного дня из селектора
const updateSelectedExercisesForDay = async (selectedIds: number[]) => {
  if (currentDayNumber.value === null) return

  const dayNum = currentDayNumber.value

  // Получаем существующие упражнения для этого дня
  const existingExercises = formData.value.dayExercises.filter(
    (assignment) => assignment.dayNumber === dayNum
  )

  // Получаем ID существующих упражнений
  const existingIds = existingExercises.map((ex) => ex.exerciseId)

  // Фильтруем только новые ID, которых еще нет в существующих
  const newIds = selectedIds.filter((id) => !existingIds.includes(id))

  // Если есть новые упражнения, добавляем их
  if (newIds.length > 0) {
    const maxOrder = Math.max(...existingExercises.map((ex) => ex.order), 0)

    // Получаем данные упражнений из API
    const fetchExerciseData = async (id: number) => {
      try {
        const response = await api.get(`/exercise/${id}`, {
          params: { isMarathon: true },
        })
        return response.data
      } catch (error) {
        console.error('Error fetching exercise data:', error)
        return null
      }
    }

    // Создаем новые назначения с данными упражнений
    const newAssignments: DayExerciseAssignment[] = await Promise.all(
      newIds.map(async (id, index) => {
        const exerciseData = await fetchExerciseData(id)
        return {
          dayNumber: dayNum,
          exerciseId: id,
          order: maxOrder + index + 1,
          exercise: exerciseData,
        }
      })
    )

    // Добавляем новые назначения в общий список
    formData.value.dayExercises.push(...newAssignments)

    // Удаляем пустое упражнение, если оно есть
    formData.value.dayExercises = formData.value.dayExercises.filter(
      (assignment) =>
        !(assignment.dayNumber === dayNum && assignment.exerciseId === -1)
    )
  }

  // Сортируем весь массив
  formData.value.dayExercises.sort((a, b) => {
    if (a.dayNumber !== b.dayNumber) {
      return a.dayNumber - b.dayNumber
    }
    return a.order - b.order
  })

  currentDayNumber.value = null // Сбрасываем номер дня
}

// Удаление конкретного назначения упражнения
const removeExerciseAssignment = (
  assignmentToRemove: DayExerciseAssignment
) => {
  // Удаляем только конкретное упражнение
  formData.value.dayExercises = formData.value.dayExercises.filter(
    (assignment) =>
      !(
        assignment.dayNumber === assignmentToRemove.dayNumber &&
        assignment.exerciseId === assignmentToRemove.exerciseId &&
        assignment.order === assignmentToRemove.order
      )
  )

  // Если в дне не осталось упражнений, добавляем пустое назначение
  const hasExercisesInDay = formData.value.dayExercises.some(
    (assignment) => assignment.dayNumber === assignmentToRemove.dayNumber
  )

  if (!hasExercisesInDay) {
    formData.value.dayExercises.push({
      dayNumber: assignmentToRemove.dayNumber,
      order: 1,
      exerciseId: -1,
    })
  }
}

// Определение, является ли день первым по порядку
const isDayFirst = (dayNumber: number): boolean => {
  const allDayNumbers = [
    ...new Set(formData.value.dayExercises.map((a) => a.dayNumber)),
  ]
  allDayNumbers.sort((a, b) => a - b)
  return allDayNumbers[0] === dayNumber
}

// Определение, является ли день последним по порядку
const isDayLast = (dayNumber: number): boolean => {
  const allDayNumbers = [
    ...new Set(formData.value.dayExercises.map((a) => a.dayNumber)),
  ]
  allDayNumbers.sort((a, b) => a - b)
  return allDayNumbers[allDayNumbers.length - 1] === dayNumber
}

// Перемещение дня на позицию вверх (уменьшение номера)
const moveDayUp = (dayNumber: number) => {
  // Получаем все уникальные номера дней
  const allDayNumbers = [
    ...new Set(formData.value.dayExercises.map((a) => a.dayNumber)),
  ]
  allDayNumbers.sort((a, b) => a - b)

  // Находим индекс текущего дня в отсортированном массиве
  const currentIndex = allDayNumbers.indexOf(dayNumber)
  if (currentIndex <= 0) return // Если это уже первый день, ничего не делаем

  // Получаем номер предыдущего дня
  const previousDayNumber = allDayNumbers[currentIndex - 1]

  // Перемещаем все записи между днями
  swapDayNumbers(dayNumber, previousDayNumber)
}

// Перемещение дня на позицию вниз (увеличение номера)
const moveDayDown = (dayNumber: number) => {
  // Получаем все уникальные номера дней
  const allDayNumbers = [
    ...new Set(formData.value.dayExercises.map((a) => a.dayNumber)),
  ]
  allDayNumbers.sort((a, b) => a - b)

  // Находим индекс текущего дня в отсортированном массиве
  const currentIndex = allDayNumbers.indexOf(dayNumber)
  if (currentIndex >= allDayNumbers.length - 1) return // Если это уже последний день, ничего не делаем

  // Получаем номер следующего дня
  const nextDayNumber = allDayNumbers[currentIndex + 1]

  // Перемещаем все записи между днями
  swapDayNumbers(dayNumber, nextDayNumber)
}

// Обновление функции swapDayNumbers для пересчета номеров дней
const swapDayNumbers = (day1: number, day2: number) => {
  // Создаем временную копию массива, чтобы не изменять оригинал во время перебора
  const assignments = [...formData.value.dayExercises]

  // Создаем новый массив с обмененными номерами дней
  const newAssignments: DayExerciseAssignment[] = []

  for (const assignment of assignments) {
    if (assignment.dayNumber === day1) {
      // Меняем номер дня для первого дня
      newAssignments.push({ ...assignment, dayNumber: day2 })
    } else if (assignment.dayNumber === day2) {
      // Меняем номер дня для второго дня
      newAssignments.push({ ...assignment, dayNumber: day1 })
    } else {
      // Остальные записи оставляем без изменений
      newAssignments.push({ ...assignment })
    }
  }

  // Обновляем formData с новыми номерами дней
  formData.value.dayExercises = newAssignments

  // Пересчитываем номера дней после обмена
  recalculateDayNumbers()

  // Уведомляем пользователя об изменении порядка
  $q.notify({
    type: 'info',
    message: `Порядок дней изменен: день ${day1} ⇄ день ${day2}`,
  })
}

// Получение деталей упражнения по ID
const getExerciseDetailsById = (exerciseId: number): Exercise | undefined => {
  // Если это временное ID, возвращаем заглушку
  if (exerciseId === -1) {
    return {
      id: -1,
      title: 'Нажмите "Добавить упражнения"',
      type: 'info',
    } as Exercise
  }
  return allExercises.value.find((ex) => ex.id === exerciseId)
}

// Наблюдатель за изменением длительности
watch(
  () => formData.value.duration,
  (newDuration, oldDuration) => {
    // Получаем все уникальные номера дней
    const existingDayNumbers = new Set(
      formData.value.dayExercises.map((a) => a.dayNumber)
    )
    const maxDayNumber = Math.max(...existingDayNumbers, 0)

    if (newDuration > maxDayNumber) {
      // Добавляем новые дни, если длительность увеличилась
      for (let i = maxDayNumber + 1; i <= newDuration; i++) {
        formData.value.dayExercises.push({
          dayNumber: i,
          order: 1,
          exerciseId: -1,
        })
      }
    } else if (newDuration < maxDayNumber) {
      // Удаляем дни, которые превышают новую длительность
      formData.value.dayExercises = formData.value.dayExercises.filter(
        (assignment) => assignment.dayNumber <= newDuration
      )
      // Пересчитываем номера дней после удаления
      recalculateDayNumbers()
    }
  }
)

const selectMarathon = (marathon: Marathon) => {
  formData.value.marathonId = marathon.id
  selectedMarathonTitle.value = marathon.title
  showMarathonSelector.value = false
}

onMounted(() => {
  fetchMarathons()
  fetchAllExercises() // Теперь загружаем упражнения
  const id = route.params.id
  if (isEdit.value && typeof id === 'string') {
    fetchModuleData(id)
  }
})

const onSubmit = async () => {
  loading.value = true
  try {
    // Группируем назначения по дням для пересчета order
    const assignmentsByDay: { [key: number]: DayExerciseAssignment[] } = {}
    formData.value.dayExercises.forEach((assignment) => {
      if (!assignmentsByDay[assignment.dayNumber]) {
        assignmentsByDay[assignment.dayNumber] = []
      }
      assignmentsByDay[assignment.dayNumber].push(assignment)
    })

    // Пересчитываем order и собираем итоговый массив
    const processedDayExercises: DayExerciseAssignment[] = []
    Object.keys(assignmentsByDay)
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      .forEach((dayNumStr) => {
        const dayNum = parseInt(dayNumStr, 10)
        // Сортируем упражнения внутри дня (если нужна стабильная сортировка перед назначением order)
        // Пока просто берем как есть, предполагая, что UI-порядок = порядок в formData
        assignmentsByDay[dayNum].forEach((assignment, index) => {
          processedDayExercises.push({
            ...assignment,
            order: index + 1, // Назначаем order на основе индекса в массиве дня
          })
        })
      })

    const dataToSave: Omit<ModuleFormData, 'id'> = {
      title: formData.value.title,
      description: formData.value.description,
      duration: formData.value.duration,
      price: formData.value.price,
      weekNumber: formData.value.weekNumber,
      marathonId: formData.value.marathonId,
      dayExercises: processedDayExercises, // Отправляем обработанный массив
    }

    if (!dataToSave.marathonId) {
      $q.notify({ type: 'negative', message: 'Необходимо выбрать марафон' })
      loading.value = false
      return
    }

    if (isEdit.value) {
      await api.patch(`/module/${route.params.id}`, dataToSave)
      $q.notify({
        type: 'positive',
        message: 'Модуль успешно обновлен',
      })
    } else {
      await api.post('/module', dataToSave)
      $q.notify({
        type: 'positive',
        message: 'Модуль успешно создан',
      })
    }
    router.push('/modules')
  } catch (error: any) {
    console.error('Error saving module:', error)
    const message =
      error.response?.data?.message || 'Ошибка при сохранении модуля'
    $q.notify({
      type: 'negative',
      message: message,
    })
  } finally {
    loading.value = false
  }
}

// Вычисляем начальные выбранные ID для селектора
const selectorInitialSelection = computed(() => {
  if (currentDayNumber.value === null) return []
  // Находим все назначения для текущего дня и возвращаем их exerciseId
  return formData.value.dayExercises
    .filter((assignment) => assignment.dayNumber === currentDayNumber.value)
    .sort((a, b) => a.order - b.order) // Сортируем по order, чтобы в селекторе было в правильном порядке
    .map((assignment) => assignment.exerciseId)
})

// Добавляем новые функции в script setup
const isExerciseFirst = (assignment: DayExerciseAssignment): boolean => {
  const dayExercises = formData.value.dayExercises
    .filter((ex) => ex.dayNumber === assignment.dayNumber)
    .sort((a, b) => a.order - b.order)
  return dayExercises[0]?.order === assignment.order
}

const isExerciseLast = (assignment: DayExerciseAssignment): boolean => {
  const dayExercises = formData.value.dayExercises
    .filter((ex) => ex.dayNumber === assignment.dayNumber)
    .sort((a, b) => a.order - b.order)
  return dayExercises[dayExercises.length - 1]?.order === assignment.order
}

const moveExerciseUp = (assignment: DayExerciseAssignment) => {
  const dayExercises = formData.value.dayExercises
    .filter((ex) => ex.dayNumber === assignment.dayNumber)
    .sort((a, b) => a.order - b.order)

  const currentIndex = dayExercises.findIndex(
    (ex) => ex.order === assignment.order
  )
  if (currentIndex <= 0) return

  const previousExercise = dayExercises[currentIndex - 1]
  swapExerciseOrders(assignment, previousExercise)
}

const moveExerciseDown = (assignment: DayExerciseAssignment) => {
  const dayExercises = formData.value.dayExercises
    .filter((ex) => ex.dayNumber === assignment.dayNumber)
    .sort((a, b) => a.order - b.order)

  const currentIndex = dayExercises.findIndex(
    (ex) => ex.order === assignment.order
  )
  if (currentIndex >= dayExercises.length - 1) return

  const nextExercise = dayExercises[currentIndex + 1]
  swapExerciseOrders(assignment, nextExercise)
}

const swapExerciseOrders = (
  exercise1: DayExerciseAssignment,
  exercise2: DayExerciseAssignment
) => {
  const tempOrder = exercise1.order

  formData.value.dayExercises = formData.value.dayExercises.map((ex) => {
    if (ex.dayNumber === exercise1.dayNumber && ex.order === exercise1.order) {
      return { ...ex, order: exercise2.order }
    }
    if (ex.dayNumber === exercise2.dayNumber && ex.order === exercise2.order) {
      return { ...ex, order: tempOrder }
    }
    return ex
  })

  $q.notify({
    type: 'info',
    message: `Порядок упражнений изменен: ${
      exercise1.exercise?.title || 'Упражнение'
    } ⇄ ${exercise2.exercise?.title || 'Упражнение'}`,
  })
}
</script>

<style lang="scss" scoped>
.module-form-card {
  max-width: 900px;
  margin: 0 auto;
}

.description-field {
  min-height: 100px;
}

:deep(.q-list--bordered) {
  position: relative;
  border: none;
  border-radius: 10px;
  padding: 16px;
  background: white;
  margin-top: 16px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 10px;
    padding: 1px;
    background: linear-gradient(
      135deg,
      $aivy-turquoise-5 0%,
      $aivy-indigo-3 100%
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

:deep(.q-item) {
  padding-top: 8px;
  padding-bottom: 8px;
}

:deep(.q-expansion-item) {
  margin-bottom: 8px; // Небольшой отступ между днями
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

:deep(.exercise-list) {
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin: 8px 0;
}

:deep(.exercise-item) {
  background-color: white;
  border-radius: 6px;
  margin: 4px 0;
  padding: 8px 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }

  .q-item__section {
    padding: 0;
  }
}

:deep(.q-expansion-item) {
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .q-expansion-item__container {
    .q-item {
      padding: 12px 16px;
    }
  }
}

:deep(.q-expansion-item__content) {
  padding: 0 16px 16px;
}
</style>

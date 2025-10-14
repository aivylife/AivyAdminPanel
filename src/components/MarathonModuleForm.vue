<template>
  <div>
    <div class="text-h5 q-mb-lg">
      {{ isEdit ? 'Редактировать' : 'Создать' }} модуль
    </div>

    <q-form @submit="onSubmit" class="q-gutter-md">
      <div class="row q-col-gutter-md">
        <div class="col-12">
          <q-input
            v-model="formData.title"
            label="Название"
            :rules="[(val) => !!val || 'Обязательное поле']"
            outlined
            bg-color="white"
          />
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
            :rules="[(val) => val > 0 || 'Номер недели должен быть больше 0']"
            outlined
            bg-color="white"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-input
            v-model.number="formData.duration"
            label="Длительность (дни)"
            type="number"
            :rules="[(val) => val > 0 || 'Длительность должна быть больше 0']"
            outlined
            bg-color="white"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-input
            v-model.number="formData.price"
            label="Цена"
            type="number"
            :rules="[(val) => val >= 0 || 'Цена не может быть отрицательной']"
            outlined
            bg-color="white"
          />
        </div>
      </div>

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

      <q-list v-if="groupedDayExercises.length > 0" bordered class="q-mb-md">
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
            <div>
              <q-btn
                label="Добавить/Изменить упражнения"
                color="primary"
                icon="add"
                @click="openExerciseSelector(dayGroup.dayNumber)"
                size="sm"
                class="q-mr-sm"
              />
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
        Нажмите "Добавить день", чтобы добавить новый день и упражнения к нему.
      </div>

      <q-separator class="q-my-lg" />

      <div class="row justify-end q-gutter-sm">
        <q-btn
          label="Отмена"
          type="button"
          color="grey-7"
          flat
          @click="$emit('cancel')"
        />
        <q-btn
          label="Сохранить"
          type="submit"
          color="primary"
          :loading="loading"
        />
      </div>
    </q-form>

    <ExerciseSelector
      v-model="showExerciseSelector"
      :initial-selection="selectorInitialSelection"
      @update:selected="updateSelectedExercisesForDay"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import type { Exercise } from 'src/types/exercise'
import ExerciseSelector from './ExerciseSelector.vue'

const $q = useQuasar()
const loading = ref(false)
const loadingExercises = ref(false)
const showExerciseSelector = ref(false)
const currentDayNumber = ref<number | null>(null)
const exercises = ref<any[]>([])

const props = defineProps({
  moduleId: {
    type: Number,
    default: null,
  },
  marathonId: {
    type: Number,
    required: true,
  },
  modelValue: {
    type: Object,
    default: null,
  },
  hideMarathonField: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  id: null as number | null,
  title: '',
  description: '',
  duration: 7,
  price: 0,
  weekNumber: 1,
  marathonId: props.marathonId,
  dayExercises: [] as any[],
})

const isEdit = computed(() => !!props.moduleId)

const fetchModuleData = async (id: number) => {
  if (!id) return

  loading.value = true
  try {
    const response = await api.get(`/module/${id}`, {
      params: { relations: 'dayExercises,dayExercises.exercise' },
    })
    const moduleData = response.data

    if (moduleData) {
      formData.value = {
        id: moduleData.id,
        title: moduleData.title,
        description: moduleData.description,
        duration: moduleData.duration,
        price: moduleData.price,
        weekNumber: moduleData.weekNumber,
        marathonId: props.marathonId,
        dayExercises: moduleData.dayExercises || [],
      }
    }
  } catch (error) {
    console.error('Error fetching module:', error)
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке модуля',
    })
  } finally {
    loading.value = false
  }
}

watch(
  () => props.moduleId,
  (newId) => {
    if (newId) {
      fetchModuleData(newId)
    } else {
      formData.value = {
        id: null,
        title: '',
        description: '',
        duration: 7,
        price: 0,
        weekNumber: 1,
        marathonId: props.marathonId,
        dayExercises: [],
      }
    }
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  async (newValue) => {
    if (newValue) {
      try {
        const response = await api.get(`/module/${newValue.id}`, {
          params: { relations: 'dayExercises,dayExercises.exercise' },
        })
        const moduleData = response.data

        formData.value = {
          id: moduleData.id,
          title: moduleData.title,
          description: moduleData.description,
          duration: moduleData.duration,
          price: moduleData.price,
          weekNumber: moduleData.weekNumber,
          marathonId: props.marathonId,
          dayExercises: moduleData.dayExercises || [],
        }
      } catch (error) {
        console.error('Error fetching module data:', error)
        $q.notify({
          type: 'negative',
          message: 'Ошибка при загрузке данных модуля',
        })
      }
    }
  },
  { immediate: true }
)

const groupedDayExercises = computed(() => {
  const groups: { [key: number]: any[] } = {}

  formData.value.dayExercises.forEach((assignment) => {
    if (!groups[assignment.dayNumber]) {
      groups[assignment.dayNumber] = []
    }
    groups[assignment.dayNumber].push(assignment)
  })

  return Object.entries(groups)
    .map(([dayNumber, assignments]) => ({
      dayNumber: Number(dayNumber),
      assignments: assignments.sort((a, b) => a.order - b.order),
    }))
    .sort((a, b) => a.dayNumber - b.dayNumber)
})

const totalDuration = computed(() => {
  return formData.value.dayExercises.reduce((total, exercise) => {
    const exerciseDetails = getExerciseDetailsById(exercise.exerciseId)
    return total + (exerciseDetails?.duration || 0)
  }, 0)
})

const sortExercises = (dayNumber: number) => {
  const dayExercises = formData.value.dayExercises.filter(
    (de) => de.dayNumber === dayNumber
  )
  dayExercises.sort((a, b) => a.order - b.order)

  formData.value.dayExercises = formData.value.dayExercises.map((de) => {
    if (de.dayNumber === dayNumber) {
      const index = dayExercises.findIndex(
        (e) => e.exerciseId === de.exerciseId
      )
      return { ...de, order: index + 1 }
    }
    return de
  })
}

const addExercise = (dayNumber: number, exerciseId: number) => {
  const dayExercises = formData.value.dayExercises.filter(
    (de) => de.dayNumber === dayNumber
  )
  const maxOrder = Math.max(...dayExercises.map((de) => de.order), 0)

  formData.value.dayExercises.push({
    dayNumber,
    exerciseId,
    order: maxOrder + 1,
  })

  sortExercises(dayNumber)
}

const exerciseOptions = computed(() => {
  return exercises.value.map((exercise) => ({
    label: exercise.title,
    value: exercise.id,
  }))
})

const fetchExercises = async () => {
  loadingExercises.value = true
  try {
    const response = await api.get('/exercise')
    exercises.value = response.data.data || []
  } catch (error) {
    console.error('Error fetching exercises:', error)
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке упражнений',
    })
  } finally {
    loadingExercises.value = false
  }
}

const getExerciseDetailsById = (id: number) => {
  return exercises.value.find((ex) => ex.id === id)
}

const selectorInitialSelection = computed(() => {
  if (currentDayNumber.value === null) return []
  return formData.value.dayExercises
    .filter((assignment) => assignment.dayNumber === currentDayNumber.value)
    .sort((a, b) => a.order - b.order)
    .map((assignment) => assignment.exerciseId)
})

const recalculateDayNumbers = () => {
  const allDayNumbers = [
    ...new Set(formData.value.dayExercises.map((a) => a.dayNumber)),
  ].sort((a, b) => a - b)
  const dayNumberMap = new Map()
  allDayNumbers.forEach((oldNumber, index) => {
    dayNumberMap.set(oldNumber, index + 1)
  })

  formData.value.dayExercises = formData.value.dayExercises.map(
    (assignment) => ({
      ...assignment,
      dayNumber: dayNumberMap.get(assignment.dayNumber) || assignment.dayNumber,
    })
  )
}

const addDay = () => {
  const maxDayNumber =
    formData.value.dayExercises.length > 0
      ? Math.max(...formData.value.dayExercises.map((d) => d.dayNumber))
      : 0

  const nextDayNumber = maxDayNumber + 1

  formData.value.dayExercises.push({
    dayNumber: nextDayNumber,
    order: 1,
    exerciseId: -1,
  })

  formData.value.duration = nextDayNumber

  $q.notify({
    type: 'info',
    message: `День ${nextDayNumber} добавлен. Используйте кнопку "Добавить/Изменить упражнения", чтобы добавить упражнения.`,
  })
}

const removeDayAssignments = (dayNumber: number) => {
  formData.value.dayExercises = formData.value.dayExercises.filter(
    (assignment) => assignment.dayNumber !== dayNumber
  )

  recalculateDayNumbers()
  formData.value.duration = Math.max(
    ...formData.value.dayExercises.map((d) => d.dayNumber),
    0
  )
}

const moveDayUp = (dayNumber: number) => {
  const allDayNumbers = [
    ...new Set(formData.value.dayExercises.map((a) => a.dayNumber)),
  ]
  allDayNumbers.sort((a, b) => a - b)

  const currentIndex = allDayNumbers.indexOf(dayNumber)
  if (currentIndex <= 0) return

  const previousDayNumber = allDayNumbers[currentIndex - 1]
  swapDayNumbers(dayNumber, previousDayNumber)
}

const moveDayDown = (dayNumber: number) => {
  const allDayNumbers = [
    ...new Set(formData.value.dayExercises.map((a) => a.dayNumber)),
  ]
  allDayNumbers.sort((a, b) => a - b)

  const currentIndex = allDayNumbers.indexOf(dayNumber)
  if (currentIndex >= allDayNumbers.length - 1) return

  const nextDayNumber = allDayNumbers[currentIndex + 1]
  swapDayNumbers(dayNumber, nextDayNumber)
}

const isDayFirst = (dayNumber: number): boolean => {
  const allDayNumbers = [
    ...new Set(formData.value.dayExercises.map((a) => a.dayNumber)),
  ]
  allDayNumbers.sort((a, b) => a - b)
  return allDayNumbers[0] === dayNumber
}

const isDayLast = (dayNumber: number): boolean => {
  const allDayNumbers = [
    ...new Set(formData.value.dayExercises.map((a) => a.dayNumber)),
  ]
  allDayNumbers.sort((a, b) => a - b)
  return allDayNumbers[allDayNumbers.length - 1] === dayNumber
}

const openExerciseSelector = (dayNumber: number) => {
  currentDayNumber.value = dayNumber
  showExerciseSelector.value = true
}

interface DayExerciseAssignment {
  dayNumber: number
  order: number
  exerciseId: number
  exercise?: Exercise
}

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
        const response = await api.get(`/exercise/${id}`)
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

const removeExerciseAssignment = (assignmentToRemove: any) => {
  formData.value.dayExercises = formData.value.dayExercises.filter(
    (assignment) =>
      !(
        assignment.dayNumber === assignmentToRemove.dayNumber &&
        assignment.exerciseId === assignmentToRemove.exerciseId &&
        assignment.order === assignmentToRemove.order
      )
  )

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

const swapDayNumbers = (day1: number, day2: number) => {
  const assignments = [...formData.value.dayExercises]
  const newAssignments = []

  for (const assignment of assignments) {
    if (assignment.dayNumber === day1) {
      newAssignments.push({ ...assignment, dayNumber: day2 })
    } else if (assignment.dayNumber === day2) {
      newAssignments.push({ ...assignment, dayNumber: day1 })
    } else {
      newAssignments.push({ ...assignment })
    }
  }

  formData.value.dayExercises = newAssignments
  recalculateDayNumbers()

  $q.notify({
    type: 'info',
    message: `Порядок дней изменен: день ${day1} ⇄ день ${day2}`,
  })
}

watch(
  () => formData.value.duration,
  (newDuration, oldDuration) => {
    const existingDayNumbers = new Set(
      formData.value.dayExercises.map((a) => a.dayNumber)
    )
    const maxDayNumber = Math.max(...existingDayNumbers, 0)

    if (newDuration > maxDayNumber) {
      for (let i = maxDayNumber + 1; i <= newDuration; i++) {
        formData.value.dayExercises.push({
          dayNumber: i,
          order: 1,
          exerciseId: -1,
        })
      }
    } else if (newDuration < maxDayNumber) {
      formData.value.dayExercises = formData.value.dayExercises.filter(
        (assignment) => assignment.dayNumber <= newDuration
      )
      recalculateDayNumbers()
    }
  }
)

const onSubmit = async () => {
  loading.value = true
  try {
    const moduleData = {
      ...formData.value,
      marathonId: props.marathonId,
    }

    if (formData.value.id) {
      await api.patch(`/module/${formData.value.id}`, moduleData)
      $q.notify({
        type: 'positive',
        message: 'Модуль успешно обновлен',
      })
    } else {
      await api.post('/module', moduleData)
      $q.notify({
        type: 'positive',
        message: 'Модуль успешно создан',
      })
    }

    emit('submit')
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

onMounted(() => {
  fetchExercises()
})
</script>

<style lang="scss" scoped>
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
  margin-bottom: 8px;
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

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Exercise, ExerciseResponse } from 'src/models/exercise';
import { exerciseApi } from 'src/services/api';

export const useExerciseStore = defineStore('exercise', () => {
  const exercises = ref<Exercise[]>([]);
  const currentExercise = ref<Exercise | null>(null);
  const total = ref(0);
  const page = ref(1);
  const limit = ref(10);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const search = ref(null);
  const typeId = ref(null);

  async function fetchExercises(params: Record<string, any>) {
    loading.value = true;
    try {
      const response = await exerciseApi.getAll(params);
      exercises.value = response.data.data || response.data;
      total.value = response.data.pagination?.totalElements || response.data.total || 0;
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      loading.value = false;
    }
  }

  async function fetchExerciseById(id: number) {
    try {
      loading.value = true;
      error.value = null;
      const response = await exerciseApi.getById(id);
      currentExercise.value = response.data;
    } catch (err) {
      error.value = 'Ошибка при загрузке упражнения';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  async function createExercise(data: Exercise) {
    try {
      loading.value = true;
      error.value = null;
      await exerciseApi.create(data);
      await fetchExercises(page.value);
    } catch (err) {
      error.value = 'Ошибка при создании упражнения';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  async function updateExercise(id: number, data: Partial<Exercise>) {
    try {
      loading.value = true;
      error.value = null;
      await exerciseApi.update(id, data);
      await fetchExercises(page.value);
    } catch (err) {
      error.value = 'Ошибка при обновлении упражнения';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  async function deleteExercise(id: number) {
    try {
      loading.value = true;
      error.value = null;
      await exerciseApi.delete(id);
      await fetchExercises(page.value);
    } catch (err) {
      error.value = 'Ошибка при удалении упражнения';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  return {
    exercises,
    currentExercise,
    total,
    page,
    limit,
    loading,
    error,
    fetchExercises,
    fetchExerciseById,
    createExercise,
    updateExercise,
    deleteExercise
  };
}); 
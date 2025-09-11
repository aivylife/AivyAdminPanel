<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h4">Справочники</div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Категории -->
      <div class="col-12 col-md-4">
        <q-card class="reference-card" @click="$router.push('/reference-books/categories')">
          <q-card-section>
            <div class="text-h6">Категории</div>
            <div class="text-subtitle2 text-grey">Управление категориями марафонов</div>
          </q-card-section>
          <q-card-section>
            <q-icon name="category" size="48px" color="primary" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Направления -->
      <div class="col-12 col-md-4">
        <q-card class="reference-card" @click="$router.push('/reference-books/directions')" >
          <!-- -->
          <q-card-section>
            <div class="text-h6">Направления</div>
            <div class="text-subtitle2 text-grey">Управление направлениями марафонов</div>
          </q-card-section>
          <q-card-section>
            <q-icon name="explore" size="48px" color="primary" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Форматы -->
      <div class="col-12 col-md-4">
        <q-card class="reference-card" @click="$router.push('/reference-books/formats')">
          <q-card-section>
            <div class="text-h6">Форматы</div>
            <div class="text-subtitle2 text-grey">Управление форматами марафонов</div>
          </q-card-section>
          <q-card-section>
            <q-icon name="format_list_bulleted" size="48px" color="primary" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Категории упражнений -->
      <div class="col-12 col-md-4">
        <q-card class="reference-card" @click="$router.push('/reference-books/exercise-categories')">
          <q-card-section>
            <div class="text-h6">Категории упражнений</div>
            <div class="text-subtitle2 text-grey">Управление категориями упражнений</div>
          </q-card-section>
          <q-card-section>
            <q-icon name="fitness_center" size="48px" color="primary" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Форматы упражнений -->
      <div class="col-12 col-md-4">
        <q-card class="reference-card" @click="$router.push('/reference-books/exercise-formats')">
          <q-card-section>
            <div class="text-h6">Форматы упражнений</div>
            <div class="text-subtitle2 text-grey">Управление форматами упражнений</div>
          </q-card-section>
          <q-card-section>
            <q-icon name="format_shapes" size="48px" color="primary" />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ReferenceBooksPage',
});
</script>

<style lang="scss" scoped>
.reference-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .q-card__section {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
</style>

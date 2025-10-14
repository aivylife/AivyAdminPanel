<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h4">Редактировать пользователя</div>
      <q-btn
        flat
        color="grey-8"
        icon="arrow_back"
        label="Назад"
        @click="router.push('/users')"
        class="q-px-md"
      />
    </div>

    <q-card class="exercise-form-card q-pa-md">
      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <div class="story-rows">
            <q-input
              label="Имя"
              v-model="formData.name"
              outlined
              bg-color="white"
            />

            <q-input
              label="Email"
              v-model="formData.email"
              outlined
              bg-color="white"
            />

            <q-input
              label="Возраст"
              v-model.number="formData.age"
              outlined
              bg-color="white"
            />

            <q-input
              v-if="formData.subscription?.plan"
              label="Подписка"
              v-model.number="formData.subscription.plan.name"
              outlined
              bg-color="white"
              :disabled="true"
            />
          </div>

          <q-separator class="q-my-lg" />

          <h6 class="text-h6">Назначить подписку</h6>

          <q-select
            v-model="formData.subscriptionPlanId"
            :options="subscriptionOptions"
            label="Подписка"
            outlined
            emit-value
            map-options
            bg-color="white"
            placeholder="Выбрать подписку"
          />

          <q-separator class="q-my-lg" />

          <div class="row justify-end q-gutter-sm">
            <q-btn
              label="Отмена"
              type="button"
              color="grey-7"
              flat
              class="q-px-md"
              @click="router.push('/users')"
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

      <q-inner-loading :showing="loading">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import FileUploader from './FileUploader.vue'
import MarkdownEditor from './MarkdownEditor.vue'
import IconSelector from './IconSelector.vue'
import CategorySelector from './CategorySelector.vue'
import FormatSelector from './FormatSelector.vue'
import { api } from 'src/boot/axios'
import { Subscription, User } from '@/types/user'
import { PaginationData } from '@/types/utils'

type UserForm = Partial<User> & { subscriptionPlanId: number | null }

export default defineComponent({
  name: 'UserForm',

  components: {
    FileUploader,
    MarkdownEditor,
    IconSelector,
    CategorySelector,
    FormatSelector,
  },

  setup() {
    const $q = useQuasar()
    const route = useRoute()
    const router = useRouter()
    const loading = ref(false)
    const subscriptionOptions = ref<{ label: string; value: number }[]>([])

    const formData = ref<UserForm>({
      email: '',
      name: '',
      age: null,
      subscription: null,
      subscriptionPlanId: null,
    })

    onMounted(async () => {
      await fetchSubscriptions()

      const id = route.params.id

      if (!id) return

      loading.value = true

      try {
        const response = await api.get<User>(`/user/${id}`, {
          params: { relations: 'subscription' },
        })
        const user = response.data

        formData.value = {
          email: user.email,
          name: user.name,
          age: user.age,
          subscription: user.subscription,
          subscriptionPlanId: null,
        }
      } catch (error) {
        console.error('Error loading story:', error)

        $q?.notify({
          type: 'negative',
          message: 'Ошибка при загрузке баннера',
        })
      } finally {
        loading.value = false
      }
    })

    const fetchSubscriptions = async () => {
      try {
        const response = await api.get<PaginationData<Subscription[]>>(
          '/subscription-plan',
          {
            params: {
              page: 1,
              perPage: 99,
              order: '{ "durationDays": "ASC" }',
            },
          }
        )

        subscriptionOptions.value = (response.data.data || []).map((item) => ({
          label: item.name,
          value: item.id,
        }))
      } catch (error) {
        console.error('Error fetching subscriptions:', error)
        $q.notify({
          type: 'negative',
          message: 'Ошибка при загрузке подписок',
        })
      }
    }

    const onSubmit = async () => {
      loading.value = true

      const data: Partial<User> = {
        email: formData.value.email || '',
        name: formData.value.name || '',
        age: formData.value.age || null,
      }

      if (formData.value.subscriptionPlanId) {
        try {
          await api.post('/payment/add-subscription', {
            userId: Number(route.params.id),
            subscriptionPlanId: formData.value.subscriptionPlanId,
          })
        } catch (error) {
          console.error('Error assigning subscription:', error)
          $q?.notify({
            type: 'negative',
            message: 'Ошибка при назначении подписки',
          })
          loading.value = false
          return
        }
      }

      try {
        await api.patch(`/user/${route.params.id}`, data)

        $q?.notify({
          type: 'positive',
          message: 'Пользователь успешно обновлен',
        })

        router.push('/users')
      } catch (error) {
        console.error('Error saving user:', error)

        $q?.notify({
          type: 'negative',
          message: 'Ошибка при сохранении пользователя',
        })
      } finally {
        loading.value = false
      }
    }

    return {
      router,
      formData,
      loading,
      subscriptionOptions,
      onSubmit,
    }
  },
})
</script>

<style lang="scss" scoped>
.story-card {
  display: flex;
  flex-direction: row;
  gap: 20px;
  border-bottom-style: dashed;
  padding-bottom: 8px;
  border-bottom-width: 2px;
}

.story-rows {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-grow: 1;
}

.exercise-form-card {
  max-width: 1200px;
  margin: 0 auto;
}

.q-card {
  background: rgba(255, 255, 255, 0.9);
}

.q-gutter-md {
  margin-top: 16px;
  margin-bottom: 16px;
}

.q-mb-md {
  margin-bottom: 16px;
}

.q-mt-md {
  margin-top: 16px;
}

.q-my-lg {
  margin-top: 24px;
  margin-bottom: 24px;
}

:deep(.q-editor) {
  min-height: 200px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  overflow: hidden;

  .q-editor__toolbar {
    background: rgba(255, 255, 255, 0.9);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding: 8px;
  }

  .q-editor__content {
    background: rgba(255, 255, 255, 0.5);
    padding: 16px;
    min-height: 200px;
  }

  .q-editor__toolbar-group {
    margin-right: 8px;
  }

  .q-btn {
    margin: 0 2px;
  }
}

.content-blocks {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-block {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
}

.content-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.content-block-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.add-content-btn {
  margin-top: 16px;
  align-self: flex-start;
}

:deep(.q-list--bordered) {
  position: relative;
  border: none;
  border-radius: 10px;
  padding: 16px;
  background: white;

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
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask: linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

:deep(.q-expansion-item) {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      135deg,
      $aivy-turquoise-5 0%,
      $aivy-indigo-3 100%
    );
  }

  &:last-child::after {
    display: none;
  }
}

.description-field {
  :deep(.q-field__control) {
    max-height: 100px;
  }

  :deep(.q-field__native) {
    max-height: 180px;
  }
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

:deep(.q-separator--horizontal) {
  background: linear-gradient(
    135deg,
    $aivy-turquoise-5 0%,
    $aivy-indigo-3 100%
  );
  height: 2px;
  margin: 24px 0;
}

.preview-sticky-btn {
  z-index: 1000;
  margin-right: -60px;
}

.preview-panel {
  position: fixed;
  top: 0;
  right: -450px;
  width: 400px;
  height: 100%;
  transition: right 0.3s ease-in-out;
  z-index: 1500;
  display: flex;
  flex-direction: column;

  &.is-open {
    right: 0;
  }
}

.preview-panel-content {
  flex-grow: 1;
  overflow-y: hidden;
}

.preview-descriptions {
  background-color: #f5f5f5; // Серый фон
  padding: 0 0px 10px 0px;
  border-radius: 8px;
}

.preview-description-block {
  margin-bottom: 10px; // Отступ между блоками
  &:last-child {
    margin-bottom: 0;
  }
}

.hide-preview-button {
  position: absolute;
  left: -14px;
  top: 50%;
  transform: translateY(-50%);
  background-color: white;
  border: 1px solid #e0e0e0;
  z-index: 1501;
}

.iphone-frame {
  width: 320px;
  height: calc(100% - 40px);
  margin: 20px auto;
  border-radius: 36px;
  border: 8px solid black;
  background: black;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.iphone-notch {
  width: 160px;
  height: 25px;
  background: black;
  border-radius: 0 0 15px 15px;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}

.iphone-screen {
  width: 100%;
  height: 100%;
  background: white;
  position: absolute;
  top: 0;
  left: 0;
  overflow-y: auto;
  border-radius: 28px;
}

.iphone-content-padding {
  padding: 0px;
  padding-top: 5px;
  font-size: 14px;
  line-height: 1.4;
}

.task-detail-block {
  background-color: #ffffff; // Белый фон, как в дизайне
  border: 1px solid #e0e0e0; // Серый бордер
  // Оставляем padding и rounded-borders через классы Quasar
}

:deep(.gradient-separator) {
  background: linear-gradient(135deg, #4fd1c5 0%, #5a67d8 100%) !important;
  height: 2px;
  margin: 8px 0;
}

.icon-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  min-height: 56px;
  padding-left: 16px;
}

.icon-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-preview img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 8px;
  background: #f5f5f5;
}

.icon-name {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  max-width: 100px;
  text-align: center;
  word-break: break-all;
}

.icon-btn {
  height: 36px;
  align-self: center;
  min-width: 120px;
}

.cursor-pointer {
  cursor: pointer;
}
</style>

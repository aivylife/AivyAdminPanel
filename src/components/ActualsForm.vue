<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h4">
        {{ isEdit ? 'Редактировать' : 'Создать' }} актуальное
      </div>
      <q-btn
        flat
        color="grey-8"
        icon="arrow_back"
        label="Назад"
        @click="router.push('/actuals')"
        class="q-px-md"
      />
    </div>

    <q-card class="exercise-form-card q-pa-md">
      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <h6 class="text-h6">Актуальное</h6>

          <q-input
            v-model="formData.name"
            label="Название"
            :rules="[(val) => Boolean(val) || 'Обязательное поле']"
            outlined
            bg-color="white"
          />

          <div class="col-12 col-md-4">
            <FileUploader
              v-model="formData.preview"
              label="Обложка актуального, используйте изображение в формате .webp"
              accept="image/webp"
              icon="image"
              :rules="[(val) => Boolean(val) || 'Обязательное поле']"
            />
          </div>

          <q-separator class="gradient-separator q-my-xs" />

          <h6 class="text-h6">Сторис</h6>

          <div style="display: flex; flex-direction: column; gap: 20px">
            <div
              v-for="(story, index) in formData.stories"
              :key="index"
              class="story-card"
            >
              <div class="story-rows">
                <q-input
                  label="Порядок"
                  type="number"
                  v-model.number="story.order"
                  :rules="[(val) => val > 0 || 'Должен быть больше 0']"
                  outlined
                  bg-color="white"
                />

                <q-input
                  label="Ссылка"
                  v-model="story.link"
                  outlined
                  bg-color="white"
                />

                <q-btn
                  flat
                  label="Удалить"
                  color="negative"
                  @click="onDeleteStory(story.id, index)"
                />
              </div>

              <FileUploader
                v-model="story.file"
                label="Изображение/видео"
                accept="image/*,video/*"
                icon="image"
                :rules="[(val) => Boolean(val) || 'Обязательное поле']"
              />
            </div>
          </div>

          <q-btn
            class="q-mt-md"
            label="Добавить сторис"
            @click="onAddStory"
            color="primary"
            size="sm"
          />

          <q-separator class="q-my-lg" />

          <div class="row justify-end q-gutter-sm">
            <q-btn
              label="Отмена"
              type="button"
              color="grey-7"
              flat
              class="q-px-md"
              @click="router.push('/actuals')"
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
import { Actuals, Story } from '@/types/story'
import type { File } from '@/models/exercise'

type ActualsForm = {
  id?: number
  name: string
  stories: Partial<Story>[]
  preview: File | null
}

export default defineComponent({
  name: 'ActualsForm',

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
    const isEdit = ref(false)

    const formData = ref<ActualsForm>({
      name: '',
      stories: [
        {
          order: 1,
          link: '',
          file: null,
        },
      ],
      preview: null,
    })

    const onAddStory = () => {
      formData.value.stories.push({
        order: formData.value.stories.length + 1,
        link: '',
        file: null,
      })
    }

    const onDeleteStory = async (id?: number, index?: number) => {
      if (!id) {
        formData.value.stories.splice(index!, 1)
        return
      }

      $q.dialog({
        title: 'Подтверждение',
        message: 'Вы действительно хотите удалить эту сторис?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await api.delete(`/api/story/${id}`)

          formData.value.stories = formData.value.stories.filter(
            (story) => story.id !== id
          )

          $q?.notify({
            type: 'positive',
            message: 'Сторис успешно удалена',
          })
        } catch (error) {
          console.error('Error deleting story:', error)

          $q?.notify({
            type: 'negative',
            message: 'Ошибка при удалении сторис',
          })
        }
      })
    }

    // Функция для загрузки видео контента по запросу
    // const loadVideoContent = async () => {
    //   if (
    //     formData.value.typeId === 1 &&
    //     formData.value.content?.data?.VIDEO?.file
    //   ) {
    //     try {
    //       videoContentPreviewUrl.value = await getFileUrlPreview(
    //         formData.value.content.data.VIDEO.file
    //       )
    //     } catch (err) {
    //       console.error('Error loading video content:', err)
    //     }
    //   }
    // }

    // Функция для загрузки аудио контента по запросу
    // const loadAudioContent = async (index: number) => {
    //   if (
    //     formData.value.typeId === 2 &&
    //     formData.value.content?.data?.AUDIO?.content?.[index]?.file
    //   ) {
    //     try {
    //       const url = await getFileUrlPreview(
    //         formData.value.content.data.AUDIO.content[index].file
    //       )
    //       audioPreviewUrls.value[index] = url
    //     } catch (err) {
    //       console.error('Error loading audio content:', err)
    //     }
    //   }
    // }

    onMounted(async () => {
      const id = route.params.id

      if (!id) return

      loading.value = true
      isEdit.value = true

      try {
        const response = await api.get<Actuals>(`/api/actual-stories/${id}`)
        const actualStory = response.data

        formData.value = {
          id: actualStory.id,
          name: actualStory.name,
          stories:
            actualStory.stories.sort(
              (a, b) => (a.order || 0) - (b.order || 0)
            ) || [],
          preview: actualStory.preview || null,
        }
      } catch (error) {
        console.error('Error loading actuals:', error)

        $q?.notify({
          type: 'negative',
          message: 'Ошибка при загрузке актуальных',
        })
      } finally {
        loading.value = false
      }
    })

    const onSubmit = async () => {
      loading.value = true

      try {
        const { id, name, stories, preview } = formData.value

        if (isEdit.value) {
          for await (const story of stories || []) {
            if (story.id) {
              await api.patch(`/api/story/${story.id}`, story)
            } else {
              const data: Partial<Story> = {
                title: '',
                description: '',
                positionText: '',
                group: '',
                isReleased: true,
                isBanner: false,
                order: story.order,
                link: story.link,
                fileId: story.file?.id || null,
                previewId: preview?.id || null,
              }

              const storyResponse = await api.post<Story>('/api/story', data)
              story.id = storyResponse.data.id
            }
          }

          await api.patch(`/api/actual-stories/${id}`, {
            name,
            preview,
            stories: stories.map((story) => ({ id: story.id })),
          })

          $q?.notify({
            type: 'positive',
            message: 'Актуальное успешно обновлено',
          })
        } else {
          const createdStories: Story[] = []

          for await (const story of stories || []) {
            const data: Partial<Story> = {
              title: '',
              description: '',
              positionText: '',
              group: '',
              isReleased: true,
              isBanner: false,
              order: story.order,
              link: story.link,
              fileId: story.file?.id || null,
              previewId: preview?.id || null,
            }

            const storyResponse = await api.post<Story>('/api/story', data)
            createdStories.push(storyResponse.data)
          }

          await api.post('/api/actual-stories', {
            name,
            preview,
            stories: createdStories.map((story) => ({ id: story.id })),
          })

          $q?.notify({
            type: 'positive',
            message: 'Актуальное успешно создано',
          })
        }

        router.push('/actuals')
      } catch (error) {
        console.error('Error saving exercise:', error)

        $q?.notify({
          type: 'negative',
          message: 'Ошибка при сохранении актуального',
        })
      } finally {
        loading.value = false
      }
    }

    return {
      router,
      formData,
      loading,
      isEdit,
      onSubmit,
      onAddStory,
      onDeleteStory,
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

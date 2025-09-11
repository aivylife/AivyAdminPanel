<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h4">{{ isEdit ? 'Редактировать' : 'Создать' }} упражнение</div>
      <q-btn
        flat
        color="grey-8"
        icon="arrow_back"
        label="Назад"
        @click="$router.push('/exercises')"
        class="q-px-md"
      />
    </div>

    <q-card class="exercise-form-card q-pa-md">
      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <!-- Основные поля -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="formData.title"
                label="Название"
                :rules="[val => !!val || 'Обязательное поле']"
                outlined
                bg-color="white"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                v-model="formData.typeId"
                :options="exerciseTypes"
                label="Тип упражнения"
                :rules="[val => !!val || 'Обязательное поле']"
                outlined
                emit-value
                map-options
                bg-color="white"
                :loading="loadingTypes"
                placeholder="Выбрать тип"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                :model-value="selectedCategoryName"
                label="Категория упражнения"
                :rules="[val => !!formData.categoryId || 'Обязательное поле']"
                outlined
                readonly
                bg-color="white"
                placeholder="Нажмите для выбора категории"
                @click="showCategorySelector = true"
                class="cursor-pointer"
              >
                <template v-slot:append>
                  <q-icon name="list" color="primary" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="selectedFormatName"
                :label="`Формат упражнения ${formData.categoryId ? `(${categories.find(c => c.id === formData.categoryId)?.name || ''})` : ''}`"
                :rules="[val => !!formData.formatId || 'Обязательное поле']"
                outlined
                readonly
                bg-color="white"
                placeholder="Нажмите для выбора формата"
                @click="showFormatSelector = true"
                class="cursor-pointer"
              >
                <template v-slot:append>
                  <q-icon name="list" color="primary" />
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
                :rules="[val => !!val || 'Обязательное поле']"
                outlined
                bg-color="white"
                autogrow
                class="description-field"
              />
              </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model.number="formData.timeCount"
                label="Длительность (в минутах)"
                type="number"
                :rules="[val => val > 0 || 'Длительность должна быть больше 0']"
                outlined
                bg-color="white"
              />
            </div>
            <div class="col-12 col-md-6">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-toggle
                    v-model="formData.isShared"
                    label="Общедоступное"
                    color="primary"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-toggle
                    v-model="formData.isMarathon"
                    label="Для марафона"
                    color="primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <q-separator class="gradient-separator q-my-xs" />
          <div class="icon-row q-mb-md q-mt-sm">
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
          <q-separator class="gradient-separator q-my-xs" />

          <!-- Основные медиафайлы -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <FileUploader
                v-model="formData.mainPhoto"
                label="Основное фото"
                accept="image/*"
                icon="image"
              />
            </div>
            <div class="col-12 col-md-4">
              <FileUploader
                v-model="formData.mainVideo"
                label="Основное видео"
                accept="video/*"
                icon="movie"
              />
            </div>
            <div class="col-12 col-md-4">
              <FileUploader
                v-model="formData.mainAudio"
                label="Основное аудио"
                accept="audio/*"
                icon="audiotrack"
              />
            </div>
          </div>

          <!-- Блоки описаний -->
          <q-separator class="q-my-lg" />
          <div class="text-h6 q-mb-md">Блоки описаний</div>
          <q-list v-if="formData.content.data.description?.length > 0" bordered>
            <q-expansion-item
              v-for="(description, index) in formData.content.data.description"
              :key="index"
              group="description-items"
              header-class="text-primary"
              expand-icon-class="text-primary"
              :label="`Блок описания ${index + 1}`"
            >
              <div class="row justify-between items-center q-mb-sm">
                <div class="text-subtitle1"></div>
                <q-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  @click="removeDescription(index)"
                />
              </div>
              <MarkdownEditor
                v-model="formData.content.data.description[index]"
                label="Текст описания"
                :rules="[val => !!val || 'Обязательное поле']"
              />
            </q-expansion-item>
          </q-list>
          <q-btn
            class="q-mt-md"
            label="Добавить блок описания"
            @click="addDescription"
            color="primary"
            size="sm"
          />

          <!-- Контент в зависимости от типа -->
          <template v-if="formData.typeId && formData.typeId !== 5">
            <q-separator class="q-my-lg" />

            <!-- Видео контент -->
            <template v-if="formData.typeId === 1">
              <div class="text-h6 q-mb-md">Видео контент</div>
              <FileUploader
                v-model="formData.content.data.VIDEO.file"
                label="Видео файл"
                accept="video/*"
                :rules="[val => !!val || 'Обязательное поле']"
                icon="movie"
                class="q-mt-md"
              />
            </template>

            <!-- Аудио контент -->
            <template v-if="formData.typeId === 2">
              <div class="text-h6 q-mb-md">Аудио контент</div>

              <q-list v-if="formData.content.data.AUDIO?.content?.length > 0" bordered>
                <q-expansion-item
                  v-for="(audio, index) in formData.content.data.AUDIO.content"
                  :key="index"
                  group="audio-items"
                  header-class="text-primary"
                  expand-icon-class="text-primary"
                  :label="audio.title || `Аудио ${index + 1}`"
                >
                  <div class="row justify-between items-center q-mb-sm">
                    <div class="text-subtitle1">Аудио {{ index + 1 }}</div>
                    <q-btn
                      flat
                      round
                      dense
                      color="negative"
                      icon="delete"
                      @click="removeAudioContent(index)"
                    />
                  </div>
                  <q-input
                    v-model="audio.title"
                    label="Название аудио"
                    outlined
                    bg-color="white"
                  />
                  <q-input
                    v-model="audio.description"
                    label="Описание"
                    type="textarea"
                    outlined
                    bg-color="white"
                    class="q-mt-md"
                  />
                  <q-input
                    v-model.number="audio.timeCount"
                    label="Длительность (в минутах)"
                    type="number"
                    outlined
                    bg-color="white"
                    class="q-mt-md"
                  />
                  <FileUploader
                    v-model="audio.file"
                    label="Аудио файл"
                    accept="audio/*"
                    :rules="[val => !!val || 'Обязательное поле']"
                    icon="audiotrack"
                    class="q-mt-md"
                  />
                </q-expansion-item>
              </q-list>
              <q-btn
                class="q-mt-md"
                label="Добавить аудио"
                @click="addAudioContent"
                size="sm"
              />
            </template>

            <!-- Аффирмации -->
            <template v-if="formData.typeId === 3">
              <div class="text-h6 q-mb-md">Аффирмации</div>
              <q-list v-if="formData.content.data.AFFIRMATION?.content?.length > 0" bordered>
                <q-expansion-item
                  v-for="(affirmation, index) in formData.content.data.AFFIRMATION.content"
                  :key="index"
                  group="affirmation-items"
                  header-class="text-primary"
                  expand-icon-class="text-primary"
                  :label="affirmation.text || `Аффирмация ${index + 1}`"
                >
                  <div class="row justify-between items-center q-mb-sm">
                    <div class="text-subtitle1">Аффирмация {{ index + 1 }}</div>
                    <q-btn
                      flat
                      round
                      dense
                      color="negative"
                      icon="delete"
                      @click="removeAffirmation(index)"
                    />
                  </div>
                  <q-input
                    v-model="affirmation.text"
                    label="Текст аффирмации"
                    type="textarea"
                    outlined
                    bg-color="white"
                  />
                </q-expansion-item>
              </q-list>
              <q-btn
                class="q-mt-md"
                label="Добавить аффирмацию"
                @click="addAffirmation"
                size="sm"
              />
            </template>

            <!-- Задания -->
            <template v-if="formData.typeId === 4">
              <div class="text-h6 q-mb-md">Задания</div>
              <q-list v-if="formData.content.data.TASK?.content?.length > 0" bordered>
                <q-expansion-item
                  v-for="(task, index) in formData.content.data.TASK.content"
                  :key="index"
                  group="task-items"
                  header-class="text-primary"
                  expand-icon-class="text-primary"
                  :label="task.title || `Задание ${index + 1}`"
                >
                  <div class="row justify-between items-center q-mb-sm">
                    <div class="text-subtitle1">Задание {{ index + 1 }}</div>
                    <q-btn
                      flat
                      round
                      dense
                      color="negative"
                      icon="delete"
                      @click="removeTask(index)"
                    />
                  </div>
                  <q-input
                    v-model="task.title"
                    label="Название задания"
                    outlined
                    bg-color="white"
                  />
                  <q-input
                    v-model="task.do"
                    label="Что делать"
                    type="textarea"
                    outlined
                    bg-color="white"
                    class="q-mt-md"
                  />
                  <q-input
                    v-model="task.result"
                    label="Ожидаемый результат"
                    type="textarea"
                    outlined
                    bg-color="white"
                    class="q-mt-md"
                  />
                </q-expansion-item>
              </q-list>
              <q-btn
                class="q-mt-md"
                label="Добавить задание"
                @click="addTask"
                size="sm"
              />
            </template>
          </template>

          <!-- Вложения -->
          <q-separator class="q-my-lg" />
          <div class="text-h6 q-mb-md">Вложения</div>
          <q-list v-if="formData.content.data.attachments?.length > 0" bordered>
            <q-expansion-item
              v-for="(attachment, index) in formData.content.data.attachments"
              :key="index"
              group="attachment-items"
              header-class="text-primary"
              expand-icon-class="text-primary"
              :label="attachment.title || `Вложение ${index + 1}`"
            >
              <div class="row justify-between items-center q-mb-sm">
                <div class="text-subtitle1">Вложение {{ index + 1 }}</div>
                <q-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  @click="removeAttachment(index)"
                />
              </div>
              <q-input
                v-model="attachment.title"
                label="Название вложения"
                outlined
                bg-color="white"
              />
              <FileUploader
                v-model="attachment.file"
                label="Файл"
                accept="*/*"
                :rules="[val => !!val || 'Обязательное поле']"
                icon="attach_file"
                class="q-mt-md"
              />
            </q-expansion-item>
          </q-list>
          <q-btn
            class="q-mt-md"
            label="Добавить вложение"
            @click="addAttachment"
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
              @click="$router.push('/exercises')"
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

    <!-- Кнопка предпросмотра -->
    <q-page-sticky position="right" :offset="[0, 0]">
         <q-btn
          fab-mini
          icon="visibility"
          label="предпросмотр"
          color="accent"
          @click="isPreviewPanelOpen = !isPreviewPanelOpen"
          class="rotate-90 preview-sticky-btn"
        >
           <q-tooltip anchor="center left" self="center right">Предпросмотр</q-tooltip>
         </q-btn>
    </q-page-sticky>

    <!-- Панель предпросмотра -->
     <div class="preview-panel bg-white shadow-5" :class="{ 'is-open': isPreviewPanelOpen }">
       <!-- Кнопка скрытия панели -->
       <q-btn
          flat
          round
          dense
          icon="chevron_right"
          color="grey-8"
          @click="isPreviewPanelOpen = false"
          class="hide-preview-button"
          v-if="isPreviewPanelOpen"
        >
         <q-tooltip anchor="center right" self="center left">Скрыть</q-tooltip>
       </q-btn>

       <div class="preview-panel-header row items-center justify-between q-pa-sm bg-primary text-white">
         <div class="text-subtitle1">Предпросмотр упражнения</div>
         <q-btn flat round dense icon="close" @click="isPreviewPanelOpen = false" />
       </div>
       <div class="preview-panel-content q-pa-md scroll">
         <div class="iphone-frame shadow-4">
           <div class="iphone-notch"></div>
           <div class="iphone-screen">
             <!-- 1 блок: mainvideo || mainPhoto -->
             <div v-if="mainMediaPreviewUrl" class="preview-main-media q-mb-md">
               <q-img
                 v-if="isMainMediaImage"
                 :src="mainMediaPreviewUrl"
                 spinner-color="primary"
                 style="width: 100%; border-radius: 0;"
               />
               <video
                 v-if="isMainMediaVideo"
                 :src="mainMediaPreviewUrl"
                 controls
                 style="width: 100%; display: block; border-radius: 0;"
               />
             </div>
             <div v-else class="text-grey text-center q-pa-md">
               (Нет основного фото/видео)
             </div>

             <div class="iphone-content-padding">
               <!-- 2 блок: длительность упражнения -->
               <div class="row items-center q-mb-md q-px-sm text-grey-8">
                 <q-icon name="schedule" class="q-mr-sm" size="xs" />
                 <span>{{ formData.timeCount || 0 }} мин</span>
               </div>

               <!-- 3 блок: описания -->
               <div v-if="formData.content.data.description?.length > 0" class="preview-descriptions q-mb-md">
                 <div
                    v-for="(desc, index) in formData.content.data.description"
                    :key="index"
                    class="preview-description-block bg-white q-pa-sm rounded-borders shadow-1"
                  >
                   <div v-html="desc"></div>
                 </div>
               </div>

               <!-- 4 блок: видео контент -->
               <div v-if="formData.typeId === 1" class="q-mb-md q-px-sm ">
                  <div class="text-subtitle2 q-mb-sm">Видео контент</div>
                  <div v-if="!videoContentPreviewUrl" class="text-center q-pa-md">
                    <q-icon name="play_circle_outline" size="48px" color="primary" class="q-mb-sm" />
                    <div class="text-caption q-mb-sm">Видео не загружено</div>
                    <q-btn
                      flat
                      color="primary"
                      label="Загрузить видео"
                      @click="loadVideoContent"
                      size="sm"
                    />
                  </div>
                  <video
                      v-else
                      :src="videoContentPreviewUrl"
                      controls
                      preload="none"
                      style="width: 100%; border-radius: 4px;"
                  />
               </div>

                <!-- 5 блок: аудио контент -->
               <div v-if="formData.typeId === 2" class="q-mb-md q-px-sm ">
                 <div class="text-subtitle2 q-mb-sm">Аудио контент</div>
                 <div v-if="!formData.content.data.AUDIO?.content?.length" class="text-center q-pa-md">
                   <q-icon name="audiotrack" size="48px" color="primary" class="q-mb-sm" />
                   <div class="text-caption q-mb-sm">Аудио не загружено</div>
                 </div>
                 <q-list v-else dense padding>
                   <q-item
                      v-for="(audio, index) in formData.content.data.AUDIO.content"
                      :key="index"
                      class="q-mb-sm rounded-borders"
                      style="background: rgba(0,0,0, 0.02);"
                   >
                      <q-item-section avatar top>
                        <q-icon name="audiotrack" color="primary" />
                      </q-item-section>
                      <q-item-section>
                         <q-item-label lines="1">{{ audio.title || 'Аудио трек' }}</q-item-label>
                         <q-item-label caption lines="2">{{ audio.description }}</q-item-label>
                         <div v-if="!audioPreviewUrls[index]" class="text-center q-pa-sm">
                           <q-btn
                             flat
                             color="primary"
                             label="Загрузить аудио"
                             @click="loadAudioContent(index)"
                             size="sm"
                           />
                         </div>
                         <audio
                            v-else
                            :src="audioPreviewUrls[index]"
                            controls
                            preload="none"
                            class="q-mt-sm"
                            style="width: 100%; height: 40px;"
                          />
                       </q-item-section>
                   </q-item>
                 </q-list>
               </div>

               <!-- 6 блок: упражнение (задание) -->
                <div v-if="formData.typeId === 4" class="q-mb-md q-px-sm ">
                  <div class="text-subtitle2 q-mb-sm">Задания</div>
                   <q-list v-if="formData.content.data.TASK?.content?.length > 0" class="q-pa-none">
                       <q-expansion-item
                         v-for="(task, index) in formData.content.data.TASK.content"
                         :key="index"
                         :label="task.title || `Задание ${index + 1}`"
                         group="preview-task-group"
                       >
                        <div class="q-pa-sm">
                            <!-- Блок "Что делать" -->
                            <div class="bg-white q-pa-md rounded-borders q-mb-sm task-detail-block">
                              <div class="row items-start no-wrap">
                                <q-icon name="assignment" color="primary" size="sm" class="q-mr-md" />
                                <div>
                                  <div class="text-weight-bold">Что делать</div>
                                  <div>{{ task.do }}</div>
                                </div>
                              </div>
                            </div>

                            <!-- Блок "Результат" -->
                             <div class="bg-white q-pa-md rounded-borders task-detail-block" v-if="task.result">
                              <div class="row items-start no-wrap">
                                  <q-icon name="check_circle_outline" color="positive" size="sm" class="q-mr-md" />
                                  <div>
                                    <div class="text-weight-bold">Результат</div>
                                    <div>{{ task.result }}</div>
                                </div>
                              </div>
                            </div>
                         </div>
                       </q-expansion-item>
                   </q-list>
                   <div v-else class="text-grey text-center q-pa-md">(Нет заданий)</div>
               </div>

                <!-- 7 блок: вложения -->
                <div v-if="formData.content.data.attachments?.length > 0" class="q-mb-md q-px-sm ">
                  <div class="text-subtitle2 q-mb-sm">Вложения</div>
                   <q-list dense separator>
                     <q-item v-for="(attach, index) in formData.content.data.attachments" :key="index">
                       <q-item-section avatar>
                         <q-icon name="attach_file" color="grey-7" />
                       </q-item-section>
                       <q-item-section>
                          <q-item-label lines="1">{{ attach.title || getFileName(attach.file) }}</q-item-label>
                          <!-- Можно добавить ссылку на скачивание, если getFileUrlPreview работает для всех типов -->
                          <!-- <q-item-label caption :href="await getFileUrlPreview(attach.file)" target="_blank">Скачать</q-item-label> -->
                        </q-item-section>
                     </q-item>
                   </q-list>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>

     <IconSelector
       v-model="showIconSelector"
       :initial-icon="formData.icon && formData.icon.id ? { ...formData.icon, type: '', uuidName: '', createdAt: '', updatedAt: '', createdById: 0, deletedAt: null } : null"
       @select="onIconSelect"
     />

     <!-- Модальное окно выбора категории -->
     <CategorySelector
       v-model="showCategorySelector"
       :initial-category="selectedCategory"
       @select="onCategorySelect"
     />

     <!-- Модальное окно выбора формата -->
     <FormatSelector
       v-model="showFormatSelector"
       :initial-format="selectedFormat"
       :category-id="formData.categoryId"
       @select="onFormatSelect"
     />

  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, getCurrentInstance, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useExerciseStore } from 'src/stores/exercise';
import { Exercise } from 'src/types/exercise';
import { useQuasar } from 'quasar';
import FileUploader from './FileUploader.vue';
import MarkdownEditor from './MarkdownEditor.vue';
import IconSelector from './IconSelector.vue';
import CategorySelector from './CategorySelector.vue';
import FormatSelector from './FormatSelector.vue';
import { api } from 'src/boot/axios';

export default defineComponent({
  name: 'ExerciseForm',

  components: {
    FileUploader,
    MarkdownEditor,
    IconSelector,
    CategorySelector,
    FormatSelector
  },

  setup() {
    const instance = getCurrentInstance();
    const $q = instance?.proxy?.$q;
    const router = useRouter();
    const route = useRoute();
    const exerciseStore = useExerciseStore();
    const loading = ref(false);
    const loadingTypes = ref(false);
    const loadingCategories = ref(false);
    const loadingFormats = ref(false);
    const isEdit = ref(false);
    const isPreviewPanelOpen = ref(false);
    const showIconSelector = ref(false);
    const showCategorySelector = ref(false);
    const showFormatSelector = ref(false);

    // --- Логика предпросмотра ---
    const mainMediaPreviewUrl = ref('');
    const isMainMediaImage = ref(false);
    const isMainMediaVideo = ref(false);
    const videoContentPreviewUrl = ref('');
    const audioPreviewUrls = ref<string[]>([]); // Массив URL для аудио
    // --- Конец логики предпросмотра ---

    const exerciseTypes = ref<{ label: string; value: number }[]>([]);
    const categories = ref<{ id: number; name: string; emoji: string }[]>([]);
    const formats = ref<{ id: number; name: string; categoryId: number }[]>([]);

    const formData = ref<Exercise>({
      title: '',
      description: '',
      timeCount: 0,
      mainPhoto: null,
      mainVideo: null,
      mainAudio: null,
      typeId: null,
      categoryId: null,
      formatId: null,
      filters: [],
      isShared: false,
      isMarathon: false,
      icon: null,
      content: {
        data: {
          description: [],
          attachments: [],
          AUDIO: {
            content: null
          },
          VIDEO: {
            content: null,
            description: '',
            file: null
          },
          AFFIRMATION: {
            content: null,
            description: ''
          },
          TASK: {
            content: null,
            description: ''
          }
        }
      }
    });

    // --- Вспомогательные функции для предпросмотра ---
    const getFileUrlPreview = async (fileData: any): Promise<string> => {
      if (!fileData) return '';
      // Если это локальный файл (еще не загружен, но выбран)
      if (fileData instanceof File) {
        return URL.createObjectURL(fileData);
      }
      // Если это файл с API (уже загружен)
      if (fileData.id && fileData.path) {
        try {
          const baseUrl = (process.env.API_URL || 'https://aivy.mobgroup.kz').replace('/api', '');
          const fileUrl = `${baseUrl}${fileData.path}`;

          const response = await fetch(fileUrl, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            credentials: 'omit' // ⚠️ важно
          });

          if (!response.ok) {
            throw new Error(`Ошибка загрузки файла: ${response.status}`);
          }

          const blob = await response.blob();
          return URL.createObjectURL(blob);
        } catch (err) {
          console.error('Fetch file error for preview:', err);
          $q?.notify({ type: 'negative', message: 'Ошибка загрузки файла для предпросмотра' });
          return '';
        }
      }
      return ''; // Неизвестный формат
    };

    const getFileName = (fileData: any): string => {
       if (!fileData) return '';
       if (fileData instanceof File) return fileData.name;
       if (typeof fileData.name === 'string') return fileData.name;
       if (typeof fileData.path === 'string') {
         const parts = fileData.path.split('/');
         return parts[parts.length - 1] || `Файл #${fileData.id}`;
       }
       return `Файл #${fileData.id}`;
    }

    // Отслеживание изменений для обновления URL предпросмотра
    watch(() => formData.value.mainPhoto, async (newVal) => {
        if (newVal) {
            mainMediaPreviewUrl.value = await getFileUrlPreview(newVal);
            isMainMediaImage.value = true;
            isMainMediaVideo.value = false;
        } else if (!formData.value.mainVideo) { // Очищаем, только если нет видео
             mainMediaPreviewUrl.value = '';
             isMainMediaImage.value = false;
        }
    }, { deep: true });

     watch(() => formData.value.mainVideo, async (newVal) => {
        if (newVal) {
            mainMediaPreviewUrl.value = await getFileUrlPreview(newVal);
            isMainMediaImage.value = false;
            isMainMediaVideo.value = true;
        } else if (!formData.value.mainPhoto) { // Очищаем, только если нет фото
             mainMediaPreviewUrl.value = '';
             isMainMediaVideo.value = false;
        }
    }, { deep: true });

     // Убираем автоматическую загрузку видео и аудио
     // Они будут загружены по запросу пользователя

    // Вызов при монтировании, чтобы загрузить URL для существующих данных
     const loadInitialPreviewUrls = async () => {
        if (formData.value.mainVideo) {
             mainMediaPreviewUrl.value = await getFileUrlPreview(formData.value.mainVideo);
             isMainMediaVideo.value = true;
        } else if (formData.value.mainPhoto) {
             mainMediaPreviewUrl.value = await getFileUrlPreview(formData.value.mainPhoto);
             isMainMediaImage.value = true;
        }

        // Не загружаем видео и аудио контент автоматически
        // Они будут загружены по запросу пользователя
     };

     // Функция для загрузки видео контента по запросу
     const loadVideoContent = async () => {
        if (formData.value.typeId === 1 && formData.value.content?.data?.VIDEO?.file) {
            try {
                videoContentPreviewUrl.value = await getFileUrlPreview(formData.value.content.data.VIDEO.file);
            } catch (err) {
                console.error('Error loading video content:', err);
            }
        }
     };

     // Функция для загрузки аудио контента по запросу
     const loadAudioContent = async (index: number) => {
        if (formData.value.typeId === 2 && formData.value.content?.data?.AUDIO?.content?.[index]?.file) {
            try {
                const url = await getFileUrlPreview(formData.value.content.data.AUDIO.content[index].file);
                audioPreviewUrls.value[index] = url;
            } catch (err) {
                console.error('Error loading audio content:', err);
            }
        }
     };

    // --- Конец вспомогательных функций для предпросмотра ---

    const fetchExerciseTypes = async () => {
      loadingTypes.value = true;
      try {
        const response = await api.get<{ id: number; name: string }[]>('/api/exercise/types');
        exerciseTypes.value = response.data.map(type => ({
          label: type.name,
          value: type.id
        }));
      } catch (error) {
        console.error('Error fetching exercise types:', error);
        $q?.notify({
          type: 'negative',
          message: 'Ошибка при загрузке типов упражнений'
        });
      } finally {
        loadingTypes.value = false;
      }
    };

    const fetchCategories = async () => {
      loadingCategories.value = true;
      try {
        const response = await api.get('/api/exercise/categories');
        categories.value = response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
        $q?.notify({
          type: 'negative',
          message: 'Ошибка при загрузке категорий'
        });
      } finally {
        loadingCategories.value = false;
      }
    };

    const fetchFormats = async () => {
      loadingFormats.value = true;
      try {
        const response = await api.get('/api/exercise/formats');
        formats.value = response.data.data;
      } catch (error) {
        console.error('Error fetching formats:', error);
        $q?.notify({
          type: 'negative',
          message: 'Ошибка при загрузке форматов'
        });
      } finally {
        loadingFormats.value = false;
      }
    };

    const filteredFormats = computed(() => {
      if (!formData.value.categoryId) return formats.value;
      return formats.value.filter(format => format.categoryId === formData.value.categoryId);
    });

    const selectedCategory = computed(() => {
      if (!formData.value.categoryId) return null;
      return categories.value.find(c => c.id === formData.value.categoryId) || null;
    });

    const selectedFormat = computed(() => {
      if (!formData.value.formatId) return null;
      return formats.value.find(f => f.id === formData.value.formatId) || null;
    });

    watch(() => formData.value.categoryId, (newCategoryId) => {
      if (formData.value.formatId) {
        const currentFormat = formats.value.find(f => f.id === formData.value.formatId);
        if (currentFormat && currentFormat.categoryId !== newCategoryId) {
          formData.value.formatId = null;
        }
      }
    });

    onMounted(async () => {
      loading.value = true;
      try {
        await Promise.all([
          fetchExerciseTypes(),
          fetchCategories(),
          fetchFormats()
        ]);
        const id = route.params.id;
        if (id) {
          isEdit.value = true;
          const response = await api.get(`/api/exercise/${id}`);
          const exercise = response.data;
          formData.value = {
            id: exercise.id,
            title: exercise.title,
            description: exercise.description || '',
            timeCount: exercise.timeCount,
            mainPhoto: exercise.mainPhoto,
            mainVideo: exercise.mainVideo,
            mainAudio: exercise.mainAudio,
            typeId: exercise.typeId,
            categoryId: exercise.categoryId,
            formatId: exercise.formatId,
            filters: exercise.filters || [],
            isShared: exercise.isShared || false,
            isMarathon: exercise.isMarathon || false,
            icon: exercise.icon,
            // Сохраняем полную информацию о формате
            selectedFormat: exercise.format,
            content: {
              data: {
                description: exercise.content?.data?.description || [],
                attachments: exercise.content?.data?.attachments || [],
                AUDIO: {
                  content: exercise.content?.data?.AUDIO?.content?.length ? exercise.content.data.AUDIO.content : null
                },
                VIDEO: {
                  content: exercise.content?.data?.VIDEO?.content?.length ? exercise.content.data.VIDEO.content : null
                },
                AFFIRMATION: {
                  content: exercise.content?.data?.AFFIRMATION?.content?.length ? exercise.content.data.AFFIRMATION.content : null
                },
                TASK: {
                  content: exercise.content?.data?.TASK?.content?.length ? exercise.content.data.TASK.content : null
                }
              }
            }
          };
          await loadInitialPreviewUrls();
        } else {
           // Можно сбросить formData здесь, если нужно
        }
      } catch (error) {
        console.error('Error loading exercise:', error);
        $q?.notify({
          type: 'negative',
          message: 'Ошибка при загрузке упражнения'
        });
      } finally {
        loading.value = false;
      }
    });

    function addAudioContent() {
      if (!formData.value.content.data.AUDIO.content) {
        formData.value.content.data.AUDIO.content = [];
      }
      formData.value.content.data.AUDIO.content.push({
        title: '',
        description: '',
        timeCount: 0,
        file: null
      });
    }

    function removeAudioContent(index: number) {
      formData.value.content.data.AUDIO.content.splice(index, 1);
    }

    function addAffirmation() {
      if (!formData.value.content.data.AFFIRMATION.content) {
        formData.value.content.data.AFFIRMATION.content = [];
      }
      formData.value.content.data.AFFIRMATION.content.push({
        text: ''
      });
    }

    function removeAffirmation(index: number) {
      formData.value.content.data.AFFIRMATION.content.splice(index, 1);
    }

    function addTask() {
      if (!formData.value.content.data.TASK.content) {
        formData.value.content.data.TASK.content = [];
      }
      formData.value.content.data.TASK.content.push({
        title: '',
        do: '',
        result: ''
      });
    }

    function removeTask(index: number) {
      formData.value.content.data.TASK.content.splice(index, 1);
    }

    function addDescription() {
      if (!formData.value.content.data.description) {
        formData.value.content.data.description = [];
      }
      formData.value.content.data.description.push('');
    }

    function removeDescription(index: number) {
      formData.value.content.data.description.splice(index, 1);
    }

    function addAttachment() {
      if (!formData.value.content.data.attachments) {
        formData.value.content.data.attachments = [];
      }
      formData.value.content.data.attachments.push({
        title: '',
        file: null
      });
    }

    function removeAttachment(index: number) {
      formData.value.content.data.attachments.splice(index, 1);
    }

    const onSubmit = async () => {
      loading.value = true;
      try {
        const {
          mainPhoto,
          mainVideo,
          mainAudio,
          ...rest
        } = formData.value;

        const data = {
          ...rest,
          mainPhotoId: mainPhoto?.id ?? null,
          mainVideoId: mainVideo?.id ?? null,
          mainAudioId: mainAudio?.id ?? null,
          categoryId: formData.value.categoryId,
          formatId: formData.value.formatId
        };

        // Удаляем пустые контент-блоки, если они не нужны
        if (!data.content.data.AUDIO?.content?.length) delete data.content.data.AUDIO;
        if (!data.content.data.VIDEO?.file) delete data.content.data.VIDEO;
        if (!data.content.data.AFFIRMATION?.content?.length) delete data.content.data.AFFIRMATION;
        if (!data.content.data.TASK?.content?.length) delete data.content.data.TASK;
        if (!data.content.data.attachments?.length) delete data.content.data.attachments;
        if (!data.content.data.description?.length) delete data.content.data.description;

        if (isEdit.value) {
          await api.patch(`/api/exercise/${route.params.id}`, data);
          $q?.notify({
            type: 'positive',
            message: 'Упражнение успешно обновлено'
          });
        } else {
          await api.post('/api/exercise', data);
          $q?.notify({
            type: 'positive',
            message: 'Упражнение успешно создано'
          });
        }
        router.push('/exercises');
      } catch (error) {
        console.error('Error saving exercise:', error);
        $q?.notify({
          type: 'negative',
          message: 'Ошибка при сохранении упражнения'
        });
      } finally {
        loading.value = false;
      }
    };

    const getFullImagePath = (path: string) => {
      if (!path) return '';
      if (path.startsWith('http')) return path;
      const baseUrl = (process.env.API_URL || 'https://aivy.mobgroup.kz').replace('/api', '');
      return `${baseUrl}${path}`;
    };

    const onIconSelect = (icon: { id: number; name: string; path: string }) => {
      formData.value.icon = icon;
    };

    const onCategorySelect = (category: { id: number; name: string }) => {
      formData.value.categoryId = category.id;
    };

    const onFormatSelect = (format: { id: number; name: string }) => {
      formData.value.formatId = format.id;
      // Обновляем selectedFormat при выборе нового формата
      formData.value.selectedFormat = format;
    };

    const selectedCategoryName = computed(() => {
      if (!formData.value.categoryId) return '';
      return categories.value.find(c => c.id === formData.value.categoryId)?.name || '';
    });

    const selectedFormatName = computed(() => {
      // Если у нас есть выбранный формат из API, используем его
      if (formData.value.selectedFormat) {
        return formData.value.selectedFormat.name;
      }
      
      // Иначе ищем в массиве форматов
      if (!formData.value.formatId) return '';
      
      const formatsArray = Array.from(formats.value || []);
      const foundFormat = formatsArray.find(f => f.id === formData.value.formatId);
      

      
      return foundFormat?.name || '';
    });

    return {
      formData,
      exerciseTypes,
      categories,
      formats,
      filteredFormats,
      loading,
      loadingTypes,
      loadingCategories,
      loadingFormats,
      isEdit,
      showIconSelector,
      onSubmit,
      addDescription,
      removeDescription,
      addAttachment,
      removeAttachment,
      addAudioContent,
      removeAudioContent,
      addAffirmation,
      removeAffirmation,
      addTask,
      removeTask,
      isPreviewPanelOpen,
      onIconSelect,
      getFullImagePath,
      // --- Переменные для предпросмотра ---
      mainMediaPreviewUrl,
      isMainMediaImage,
      isMainMediaVideo,
      videoContentPreviewUrl,
      audioPreviewUrls,
      getFileName, // Передаем хелпер имени файла
      // --- Конец переменных для предпросмотра ---
      loadVideoContent,
      loadAudioContent,
      showCategorySelector,
      showFormatSelector,
      onCategorySelect,
      onFormatSelect,
      selectedCategory,
      selectedFormat,
      selectedCategoryName,
      selectedFormatName,
      selectedFormat: formData.value.selectedFormat
    };
  }
});
</script>

<style lang="scss" scoped>
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
    background: linear-gradient(135deg, $aivy-turquoise-5 0%, $aivy-indigo-3 100%);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
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
    background: linear-gradient(135deg, $aivy-turquoise-5 0%, $aivy-indigo-3 100%);
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
  background: linear-gradient(135deg, $aivy-turquoise-5 0%, $aivy-indigo-3 100%);
  height: 2px;
  margin: 24px 0;
}

:deep(.q-separator--horizontal) {
  background: linear-gradient(135deg, $aivy-turquoise-5 0%, $aivy-indigo-3 100%);
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

.preview-main-media {
  // Стили для основного блока фото/видео
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
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
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

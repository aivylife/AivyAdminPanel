<template>
  <div class="file-uploader">
    <div v-if="modelValue" class="row uploaded-file">
      <div class="file-info">
        <q-icon v-if="!isImage && !isVideo && !isAudio" :name="icon" color="primary" size="24px" />
        <div v-if="isImage" class="preview-container">
          <img :src="previewUrl" class="preview-image" width="100%" height="100%"/>
        </div>
        <div v-if="isVideo" class="preview-container">
          <!-- Для видео показываем заглушку с кнопкой загрузки -->
          <div v-if="!isVideoLoaded" class="media-placeholder">
            <q-icon name="play_circle_outline" size="48px" color="primary" />
            <div class="text-caption q-mt-sm">Нажмите для загрузки</div>
            <q-btn
              flat
              color="primary"
              label="Загрузить"
              @click="loadVideo"
              class="q-mt-sm"
            />
          </div>
          <video 
            v-else
            :src="previewUrl" 
            class="preview-video" 
            controls
            preload="none"
          ></video>
        </div>
        <div v-if="isAudio" class="preview-container">
          <!-- Для аудио показываем заглушку с кнопкой загрузки -->
          <div v-if="!isAudioLoaded" class="media-placeholder">
            <q-icon name="audiotrack" size="48px" color="primary" />
            <div class="text-caption q-mt-sm">Нажмите для загрузки</div>
            <q-btn
              flat
              color="primary"
              label="Загрузить"
              @click="loadAudio"
              class="q-mt-sm"
            />
          </div>
          <audio 
            v-else
            :src="previewUrl" 
            controls
            preload="none"
          ></audio>
        </div>
      </div>
      
      <div class="file-actions">
        <q-btn
          flat
          round
          dense
          icon="delete"
          color="negative"
          @click="clearFile"
          class="q-mr-sm"
        />
        <q-btn
          flat
          round
          dense
          icon="add"
          color="primary"
          @click="showFileInput = true"
        />
      </div>
      <div class="row file-name q-py-md"><div>{{ fileName }}</div></div>
    </div>

    <q-file
      v-if="!modelValue || showFileInput"
      v-model="file"
      :label="label"
      :accept="accept"
      :rules="rules"
      outlined
      @update:model-value="handleFileChange"
      class="q-mb-sm"
      borderless
      style="background: rgba(255, 255, 255, 0.5)"
    >
      <template v-slot:prepend>
        <q-icon :name="icon" color="primary" />
      </template>
    </q-file>

    <!-- Прогресс загрузки -->
    <div v-if="isUploading" class="q-mt-sm">
      <div class="upload-info q-mb-sm">
        <div class="text-caption text-grey-8">Загрузка файла...</div>
        <div class="text-caption text-grey-8">{{ formatFileSize(uploadedBytes) }} / {{ formatFileSize(totalBytes) }}</div>
      </div>
      <q-linear-progress
        :value="uploadProgress / 100"
        color="primary"
        class="q-mt-sm"
        rounded
      />
      <div class="text-caption text-center text-grey-8">{{ uploadProgress.toFixed(1) }}%</div>
    </div>

    <div v-if="error" class="text-negative q-mt-sm text-center">
      {{ error }}
    </div>

    <div v-if="!file && !modelValue" class="text-center q-mt-sm text-grey-7">
      <q-icon :name="icon" size="48px" color="grey-5" class="q-mb-sm" />
      <div>Перетащите файл сюда или нажмите для выбора</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, PropType } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { ValidationRule } from 'quasar';

export default defineComponent({
  name: 'FileUploader',

  props: {
    label: {
      type: String,
      required: true
    },
    accept: {
      type: String,
      default: '*'
    },
    rules: {
      type: Array as () => ValidationRule[],
      default: () => []
    },
    icon: {
      type: String,
      default: 'attach_file'
    },
    modelValue: {
      type: [Object, File, null] as PropType<File | { name: string; path?: string; id?: number } | null>,
      default: null
    },
    initialFile: {
      type: [Object, null] as PropType<{ name: string; path?: string; id?: number } | null>,
      default: null
    }
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const $q = useQuasar();
    const file = ref<File | null>(null);
    const showFileInput = ref(false);
    const uploadProgress = ref(0);
    const uploadedBytes = ref(0);
    const totalBytes = ref(0);
    const isUploading = ref(false);
    const error = ref('');
    const previewUrl = ref('');
    const isVideoLoaded = ref(false);
    const isAudioLoaded = ref(false);

    const isImage = computed(() => {
      if (props.modelValue instanceof File) {
        return props.modelValue.type.startsWith('image/');
      }
      return props.modelValue?.path?.endsWith('.jpg') || 
             props.modelValue?.path?.endsWith('.jpeg') || 
             props.modelValue?.path?.endsWith('.png') || 
             props.modelValue?.path?.endsWith('.gif');
    });

    const isVideo = computed(() => {
      if (props.modelValue instanceof File) {
        return props.modelValue.type.startsWith('video/');
      }
      return props.modelValue?.path?.endsWith('.mp4') || 
             props.modelValue?.path?.endsWith('.webm') || 
             props.modelValue?.path?.endsWith('.ogg');
    });

    const isAudio = computed(() => {
      if (props.modelValue instanceof File) {
        return props.modelValue.type.startsWith('audio/');
      }
      return props.modelValue?.path?.endsWith('.mp3') || 
             props.modelValue?.path?.endsWith('.wav') || 
             props.modelValue?.path?.endsWith('.ogg');
    });

    const fileName = computed(() => {
      if (!props.modelValue) return '';
      if (props.modelValue instanceof File) {
        return props.modelValue.name;
      }
      return props.modelValue.name || '';
    });

    const getFileType = (file: File) => {
      if (file.type.startsWith('image/')) return 'image';
      if (file.type.startsWith('audio/')) return 'audio';
      if (file.type.startsWith('video/')) return 'video';
      return 'file';
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileUrl = async (file: File | { id?: number; path?: string } | string | null): Promise<string> => {
      try {
        if (!file) return '';
        
        // Если это локальный файл (еще не загружен, но выбран)
        if (file instanceof File) {
          const url = URL.createObjectURL(file);
          return url ? url : '';
        }
        
        // Если это файл с API (уже загружен)
        if (typeof file === 'object' && file.id && file.path) {
          return `https://aivy.mobgroup.kz${file.path}`;
        }
        
        // Если передан только путь
        if (typeof file === 'string') {
          return `https://aivy.mobgroup.kz${file}`;
        }
        
        return ''; // Неизвестный формат
      } catch (err) {
        console.error('Fetch file error:', err);
        return '';
      }
    };

    const uploadFile = async (fileToUpload: File): Promise<any> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        
        formData.append('file', fileToUpload);
        formData.append('type', getFileType(fileToUpload));

        // Отслеживаем прогресс загрузки
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            totalBytes.value = event.total;
            uploadedBytes.value = event.loaded;
            uploadProgress.value = (event.loaded / event.total) * 100;
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200 || xhr.status === 201) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (err) {
              reject(new Error('Ошибка парсинга ответа сервера'));
            }
          } else {
            reject(new Error(`Ошибка загрузки: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Ошибка сети при загрузке файла'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Загрузка файла была отменена'));
        });

        xhr.open('POST', `https://aivy.mobgroup.kz/api-file/file/upload/${getFileType(fileToUpload)}`);
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('accessToken')}`);
        xhr.send(formData);
      });
    };

    const handleFileChange = async (newFile: File) => {
      file.value = newFile;
      if (newFile) {
        try {
          isUploading.value = true;
          uploadProgress.value = 0;
          uploadedBytes.value = 0;
          totalBytes.value = newFile.size;
          error.value = '';
          
          // Загружаем файл на сервер
          const uploadedData = await uploadFile(newFile);
          
          // Обновляем предпросмотр только для изображений
          if (isImage.value) {
            previewUrl.value = URL.createObjectURL(newFile);
          }
          
          // Отправляем данные о загруженном файле в родительский компонент
          emit('update:modelValue', uploadedData);
        } catch (err) {
          console.error('Error uploading file:', err);
          error.value = 'Ошибка при загрузке файла';
          emit('update:modelValue', null);
        } finally {
          isUploading.value = false;
        }
      } else {
        emit('update:modelValue', null);
      }
    };

    const loadVideo = async () => {
      if (props.modelValue && !isVideoLoaded.value) {
        try {
          const url = await getFileUrl(props.modelValue);
          previewUrl.value = url;
          isVideoLoaded.value = true;
        } catch (err) {
          console.error('Error loading video:', err);
          $q.notify({ type: 'negative', message: 'Ошибка при загрузке видео' });
        }
      }
    };

    const loadAudio = async () => {
      if (props.modelValue && !isAudioLoaded.value) {
        try {
          const url = await getFileUrl(props.modelValue);
          previewUrl.value = url;
          isAudioLoaded.value = true;
        } catch (err) {
          console.error('Error loading audio:', err);
          $q.notify({ type: 'negative', message: 'Ошибка при загрузке аудио' });
        }
      }
    };

    const clearFile = () => {
      file.value = null;
      showFileInput.value = false;
      previewUrl.value = '';
      isVideoLoaded.value = false;
      isAudioLoaded.value = false;
      uploadProgress.value = 0;
      uploadedBytes.value = 0;
      totalBytes.value = 0;
      isUploading.value = false;
      error.value = '';
      emit('update:modelValue', null);
    };

    // Инициализация существующего файла
    watch(() => props.initialFile, (newFile) => {
      if (newFile && !file.value) {
        // Для изображений сразу загружаем превью
        if (isImage.value) {
          previewUrl.value = newFile.path || '';
        }
        // Для видео и аудио не загружаем автоматически
      }
    }, { immediate: true });

    // Следим за изменениями modelValue
    watch(() => props.modelValue, async (newFile) => {
      if (newFile) {
        // Для изображений сразу загружаем превью
        if (isImage.value) {
          previewUrl.value = await getFileUrl(newFile);
        }
        // Для видео и аудио сбрасываем состояние загрузки
        if (isVideo.value) {
          isVideoLoaded.value = false;
        }
        if (isAudio.value) {
          isAudioLoaded.value = false;
        }
      } else {
        previewUrl.value = '';
        isVideoLoaded.value = false;
        isAudioLoaded.value = false;
      }
    }, { immediate: true });

    return {
      file,
      showFileInput,
      uploadProgress,
      uploadedBytes,
      totalBytes,
      isUploading,
      error,
      previewUrl,
      isImage,
      isVideo,
      isAudio,
      isVideoLoaded,
      isAudioLoaded,
      fileName,
      handleFileChange,
      clearFile,
      loadVideo,
      loadAudio,
      formatFileSize,
      rules: computed(() => props.rules)
    };
  }
});
</script>

<style lang="scss" scoped>
.file-uploader {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .q-file {
    width: 100%;
  }

  .uploaded-file {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    margin-bottom: 16px;

    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .file-name {
        font-size: 16px;
        color: #333;
      }

      .preview-container {
        width: 350px;
        height: 200px;
        border-radius: 8px;
        overflow: hidden;
        background: #f5f5f5;

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .media-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #f8f9fa;
          border: 2px dashed #dee2e6;
          border-radius: 8px;
        }
      }
    }

    .file-actions {
      display: flex;
      gap: 8px;
    }
  }

  .upload-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>

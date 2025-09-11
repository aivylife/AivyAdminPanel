<template>
  <div class="rich-text-editor q-mb-lg">
    <div v-if="label" class="text-subtitle2 q-mb-lg">{{ label }}</div>
    <QuillEditor
      v-model:content="content"
      contentType="html"
      :options="editorOptions"
      @update:content="handleInput"
      class="editor-input"
      style="min-height: 200px; max-height: 400px;"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

const props = defineProps<{
  modelValue: string;
  label?: string;
  rules?: any[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const content = ref(props.modelValue);

// Добавляем watch для обновления контента при изменении modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue;
  }
}, { immediate: true });

const editorOptions = {
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ]
  },
  placeholder: 'Введите текст...',
  theme: 'snow'
};

function handleInput(value: string) {
  content.value = value;
  emit('update:modelValue', value);
}

onMounted(() => {
  // Добавляем глобальные стили для редактора
  const style = document.createElement('style');
  style.textContent = `
    .rich-text-editor .editor-input .ql-container {
      height: 200px !important;
    }
    .rich-text-editor .editor-input .ql-editor {
      min-height: 200px !important;
      max-height: 200px !important;
      overflow-y: auto !important;
    }
  `;
  document.head.appendChild(style);
});
</script>

<style lang="scss" scoped>
.rich-text-editor {
  .editor-input {
    :deep(.ql-container) {
      height: 200px !important;
    }

    :deep(.ql-editor) {
      min-height: 200px !important;
      max-height: 400px !important;
      overflow-y: auto !important;
    }
  }
}
</style> 
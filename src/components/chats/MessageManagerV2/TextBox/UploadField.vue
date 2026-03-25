<template>
  <input
    ref="uploadField"
    class="text-box__upload-field"
    type="file"
    multiple
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';

import { useMessageManager } from '@/store/modules/chats/messageManager';

defineOptions({
  name: 'MessageManagerTextBoxUploadField',
});

const messageManager = useMessageManager();
const { mediaUploadFiles } = storeToRefs(messageManager);

const LIMIT_UPLOAD_FILES = 5;

const inputRef = useTemplateRef<HTMLInputElement>('uploadField');

const clickInput = () => {
  inputRef.value?.click();
};

const handleChange = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  const currentFilesCount = mediaUploadFiles.value.length;
  if (currentFilesCount + files?.length > LIMIT_UPLOAD_FILES) {
    // TODO: add alert limit upload files
    return;
  }
  mediaUploadFiles.value = [...mediaUploadFiles.value, ...files];
};

defineExpose({
  clickInput,
});
</script>

<style scoped lang="scss">
.text-box {
  &__upload-field {
    display: none;
  }
}
</style>

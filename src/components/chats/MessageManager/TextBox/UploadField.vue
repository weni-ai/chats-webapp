<template>
  <input
    ref="uploadField"
    class="text-box__upload-field"
    type="file"
    multiple
    data-testid="upload-field-input"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue';

import { useMessageManager } from '@/store/modules/chats/messageManager';

defineOptions({
  name: 'MessageManagerTextBoxUploadField',
});

const messageManager = useMessageManager();
const { addMediaUploadFiles } = messageManager;

const inputRef = useTemplateRef<HTMLInputElement>('uploadField');

const clickInput = () => {
  inputRef.value?.click();
};

const handleChange = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  addMediaUploadFiles(files);
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

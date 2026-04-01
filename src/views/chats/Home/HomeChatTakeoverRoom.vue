<template>
  <UnnnicDialog v-model:open="open">
    <UnnnicDialogContent size="medium">
      <UnnnicDialogHeader type="attention">
        <UnnnicDialogTitle>
          {{ $t('chats.your_chat_assumed', { contact: contactName }) }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="home-chat-takeover-room__content">
        <p class="home-chat-takeover-room__description">
          {{
            $t('chats.your_chat_assumed_description', { contact: contactName })
          }}
        </p>
      </section>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: boolean;
  contactName: string;
}

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const props = defineProps<Props>();

const open = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    if (!value) {
      emit('close');
    }
    emit('update:modelValue', value);
  },
});
</script>

<style lang="scss" scoped>
.home-chat-takeover-room {
  &__content {
    display: flex;
    padding: $unnnic-space-6;
  }
}
</style>

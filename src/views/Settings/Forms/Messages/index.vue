<template>
  <section class="messages-form">
    <section
      v-if="props.multiple"
      class="messages-form__title-container"
    >
      <h2 class="messages-form__title">
        {{ $t('config_chats.quick_messages.title.label') }}
      </h2>
      <UnnnicToolTip
        enabled
        :text="$t('config_chats.quick_messages.title.tooltip')"
      >
        <UnnnicIcon
          icon="ri:question-line"
          scheme="fg-base"
          size="sm"
        />
      </UnnnicToolTip>
    </section>
    <section
      v-for="(messageForm, index) in messagesForms"
      :key="index"
      class="messages-form__form-container"
    >
      <section
        v-if="index > 0"
        class="messages-form__form-header"
      >
        <h2 class="messages-form__form-title">
          {{ $t('config_chats.quick_messages.new') }}
        </h2>
        <UnnnicToolTip
          enabled
          :text="$t('config_chats.quick_messages.delete_this_quick_message')"
        >
          <UnnnicIcon
            icon="delete"
            scheme="fg-critical"
            clickable
            size="ant"
            @click="removeMessage(index)"
          />
        </UnnnicToolTip>
      </section>
      <section class="messages-form__form">
        <MessageInputsForm
          :modelValue="messageForm"
          @update:model-value="messagesForms[index] = $event"
        />
        <hr
          v-if="multiple"
          class="divider"
        />
      </section>
    </section>
    <UnnnicButton
      v-if="multiple"
      :text="$t('config_chats.quick_messages.add')"
      iconLeft="add"
      type="secondary"
      @click="addMessageForm()"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import MessageInputsForm from './MessageInputsForm.vue';

defineOptions({
  name: 'MessagesForm',
});

interface Props {
  multiple?: boolean;
  modelValue: {
    shortcut: string;
    text: string;
  }[];
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: { shortcut: string; text: string }[]];
}>();

const messagesForms = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const addMessageForm = () => {
  messagesForms.value.push({
    shortcut: '',
    text: '',
  });
};

const removeMessage = (index: number) => {
  messagesForms.value.splice(index, 1);
};
</script>

<style lang="scss" scoped>
.messages-form {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
  &__title-container {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
  }
  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
  }
  &__form {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
  }
  &__form-container {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
  }
  &__form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  &__form-title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
  }
}
.divider {
  border: 1px solid $unnnic-color-border-soft;
}
</style>

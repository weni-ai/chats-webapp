<!-- This component was migrated from unnnic. -->
<template>
  <section class="unnnic-chats-message__text__container">
    <p
      class="unnnic-chats-message__text"
      v-html="formattedText"
    />
    <p
      v-if="isAutomatic"
      class="unnnic-chats-message__text--automatic"
    >
      {{ automaticMessageLabel }}
    </p>
  </section>
</template>

<script>
import { formatMessageText } from '@/utils/string';

export default {
  name: 'ChatsMessageText',

  props: {
    text: {
      type: String,
      required: true,
    },
    isAutomatic: {
      type: Boolean,
      default: false,
    },
    automaticType: {
      type: String,
      default: 'automatic_open',
    },
  },
  computed: {
    automaticMessageLabel() {
      const labelsByType = {
        automatic_open: this.$t('automatic_message.automatic_opening_message'),
        inactive_warning: this.$t('automatic_message.inactive_warning_message'),
        inactive_close: this.$t('automatic_message.inactive_close_message'),
      };
      return labelsByType[this.automaticType];
    },
    formattedText() {
      return formatMessageText(this.text);
    },
  },
};
</script>

<style lang="scss" scoped>
.unnnic-chats-message__text {
  &__container {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;
    padding: $unnnic-spacing-nano 0;
    font-size: $unnnic-font-size-body-gt;
    color: $unnnic-color-fg-emphasized;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-medium;
    word-break: break-word;
  }
  &--automatic {
    font-size: $unnnic-font-size-body-md;
    line-height: $unnnic-line-height-caption-1;
    color: $unnnic-color-fg-info;
  }
}
</style>

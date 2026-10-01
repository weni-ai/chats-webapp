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
    bulkMessageSender: {
      type: String,
      default: '',
    },
  },
  computed: {
    automaticMessageLabel() {
      const senderIsEmail = this.bulkMessageSender.includes('@');
      const treatedSender = senderIsEmail
        ? this.bulkMessageSender.split('@')[0]
        : this.bulkMessageSender;
      const labelsByType = {
        automatic_open: this.$t('automatic_message.automatic_opening_message'),
        inactive_warning: this.$t('automatic_message.inactive_warning_message'),
        inactive_close: this.$t('automatic_message.inactive_close_message'),
        bulk_message: this.$t('automatic_message.bulk_message', {
          sender: treatedSender,
        }),
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
  // Color must live on the `<p>` itself. Inherited color from the container
  // loses to any later `p { color: #3D3D3D }` (light fg-base hex) injected by
  // another federated module (e.g. channels/integrations). That is rgb(61,61,61)
  // — the unreadable dark-on-dark text — while `--unnnic-color-fg-emphasized`
  // on the same node stays `#fff`.
  margin: 0;
  color: $unnnic-color-fg-emphasized;

  :deep(*) {
    color: inherit;
  }

  &__container {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    padding: $unnnic-space-1 0;
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

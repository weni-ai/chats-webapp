<template>
  <section class="list-sector-quick-messages">
    <p v-if="sector" class="title">{{ $t('quick_messages.title_by_sector', { sector }) }}</p>
    <p v-if="quickMessagesShared.length === 0" class="without-messages">
      {{ $t('quick_messages.without_messages.start') }}
      <button @click="$emit('create-quick-message')">
        {{ $t('quick_messages.without_messages.middle') }}
      </button>
      {{ $t('quick_messages.without_messages.end') }}
    </p>

    <quick-message-card
      v-for="message in quickMessagesShared"
      :key="message.uuid"
      :quickMessage="message"
      clickable
      @select="$emit('edit-quick-message', message)"
      @edit="$emit('edit-quick-message', message)"
      @delete="$emit('delete-quick-message', message.uuid)"
    />
  </section>
</template>

<script>
import QuickMessageCard from '@/components/chats/QuickMessages/QuickMessageCard';

export default {
  name: 'ListSectorQuickMessages',

  components: {
    QuickMessageCard,
  },

  props: {
    quickMessagesShared: {
      type: Array,
      default: () => [],
    },
    sector: {
      type: String,
      default: '',
    },
  },
};
</script>

<style lang="scss" scoped>
.list-sector-quick-messages {
  .title {
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    line-height: 1.5rem;

    margin-bottom: 1rem;
  }

  .without-messages {
    font-size: $unnnic-font-size-body-gt;
    color: $unnnic-color-neutral-dark;

    button {
      background: none;
      border: none;
      padding: 0;

      text-decoration: underline;
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;

      cursor: pointer;
    }
  }

  .quick-message-card {
    &:not(:first-child) {
      margin-top: $unnnic-spacing-stack-sm;
    }
    :deep(.unnnic-chat-text) {
      max-width: initial;
    }
  }
}
</style>

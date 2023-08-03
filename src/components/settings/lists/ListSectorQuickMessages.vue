<template>
  <section class="list-sector-quick-messages">
    <p v-if="sector" class="title">{{ $t('quick_messages.title_by_sector', { sector }) }}</p>

    <quick-message-card
      v-for="message in quickMessagesShared"
      :key="message.uuid"
      :quickMessage="message"
      clickable
      @select.stop
      @edit.stop
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

  .quick-message-card {
    :deep(.unnnic-chat-text) {
      max-width: initial;
    }
  }
}
</style>

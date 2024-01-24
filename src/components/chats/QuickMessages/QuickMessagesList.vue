<template>
  <section class="quick-messages-list">
    <unnnic-collapse
      class="quick-messages-list__personals"
      :title="$t('quick_messages.personal')"
      active
    >
      <quick-message-card
        v-for="quickMessage in quickMessages"
        :key="quickMessage.uuid"
        :quickMessage="quickMessage"
        :withActions="!isMobile"
        clickable
        @select="emitSelectQuickMessage"
        @edit="emitEditQuickMessage"
        @delete="emitDeleteQuickMessage"
      />
    </unnnic-collapse>
    <unnnic-collapse
      v-if="quickMessagesShared.length > 0"
      class="quick-messages-list__shareds"
      :title="$t('quick_messages.shared')"
      active
    >
      <quick-message-card
        v-for="quickMessage in quickMessagesShared"
        :key="quickMessage.uuid"
        :quickMessage="quickMessage"
        :withActions="false"
        clickable
        @select="emitSelectQuickMessage"
      />
    </unnnic-collapse>
  </section>
</template>

<script>
import isMobile from 'is-mobile';
import { mapState } from 'vuex';

import QuickMessageCard from './QuickMessageCard';

export default {
  name: 'QuickMessagesList',

  components: {
    QuickMessageCard,
  },

  data() {
    return {
      isMobile: isMobile(),
    };
  },

  computed: {
    ...mapState({
      quickMessages: (state) => state.chats.quickMessages.quickMessages,
      quickMessagesShared: (state) => state.chats.quickMessagesShared.quickMessagesShared,
    }),
  },

  methods: {
    emitSelectQuickMessage(quickMessage) {
      this.$emit('select-quick-message', quickMessage);
    },
    emitEditQuickMessage(quickMessage) {
      this.$emit('edit-quick-message', quickMessage);
    },
    emitDeleteQuickMessage(quickMessage) {
      this.$emit('delete-quick-message', quickMessage);
    },
  },
};
</script>

<style lang="scss" scoped>
.quick-messages-list {
  height: 100%;
  width: 100%;
  overflow: hidden auto;

  // insert space between content and scrollbar
  margin-right: -$unnnic-spacing-xs;
  padding-right: $unnnic-spacing-xs;
}
</style>

<template>
  <section class="quick-messages-list">
    <p
      v-if="withoutQuickMessages"
      class="quick-messages-list__without"
    >
      {{ $t('quick_messages.without_messages') }}
    </p>

    <UnnnicCollapse
      v-else
      v-model="openQuickMessages"
      class="quick-messages-list__personals"
      :title="$t('quick_messages.personal')"
    >
      <QuickMessageCard
        v-for="quickMessage in quickMessages"
        :key="quickMessage.uuid"
        :quickMessage="quickMessage"
        :withActions="withHandlers"
        clickable
        @select="emitSelectQuickMessage"
        @edit="emitEditQuickMessage"
        @delete="emitDeleteQuickMessage"
      />
    </UnnnicCollapse>
    <UnnnicCollapse
      v-if="quickMessagesShared.length > 0"
      v-model="openQuickMessagesShared"
      class="quick-messages-list__shareds"
      :title="$t('quick_messages.shared')"
    >
      <QuickMessageCard
        v-for="quickMessage in quickMessagesShared"
        :key="quickMessage.uuid"
        :quickMessage="quickMessage"
        :withActions="false"
        clickable
        @select="emitSelectQuickMessage"
      />
    </UnnnicCollapse>
  </section>
</template>

<script>
import { mapState } from 'pinia';

import QuickMessageCard from './QuickMessageCard.vue';

import { useQuickMessages } from '@/store/modules/chats/quickMessages';
import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';

export default {
  name: 'QuickMessagesList',

  components: {
    QuickMessageCard,
  },

  props: {
    withHandlers: {
      type: Boolean,
      default: true,
    },
    isEmpty: {
      type: Boolean,
    },
  },
  emits: [
    'update:isEmpty',
    'select-quick-message',
    'edit-quick-message',
    'delete-quick-message',
  ],

  data() {
    return {
      openQuickMessages: true,
      openQuickMessagesShared: true,
    };
  },

  computed: {
    ...mapState(useQuickMessages, ['quickMessages']),
    ...mapState(useQuickMessageShared, ['quickMessagesShared']),

    withoutQuickMessages() {
      return (
        this.quickMessages.length === 0 && this.quickMessagesShared.length === 0
      );
    },
  },
  watch: {
    withoutQuickMessages: {
      immediate: true,
      handler(newWithoutQuickMessages) {
        this.$emit('update:isEmpty', newWithoutQuickMessages);
      },
    },
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

  margin-right: -$unnnic-spacing-xs;
  padding-right: $unnnic-spacing-xs;

  &__without {
    font-size: $unnnic-font-size-body-md;
    color: $unnnic-color-neutral-cloudy;
  }
}
</style>

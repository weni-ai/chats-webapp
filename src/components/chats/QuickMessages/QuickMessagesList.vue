<template>
  <section class="quick-messages-list">
    <header class="quick-messages-list__header">
      <p class="quick-messages-list__header-title">{{ title }}</p>
      <UnnnicButton
        v-if="showNewButton"
        iconLeft="add"
        type="secondary"
        size="small"
        :text="$t('message')"
        @click="$emit('open-new-quick-message')"
      />
    </header>
    <Transition name="expand-with-fade">
      <section
        v-show="openQuickMessages"
        class="quick-messages-list__cards"
      >
        <p
          v-if="withoutQuickMessages"
          class="quick-messages-list__without-messages-text"
          v-html="withoutMessagesText"
        />
        <QuickMessageCard
          v-for="(quickMessage, index) in quickMessages"
          v-else
          :key="quickMessage.uuid"
          :quickMessage="quickMessage"
          :withActions="withHandlers"
          :showTooltip="quickMessage.text.length > 70"
          :tooltipSide="index > 2 ? 'top' : 'left'"
          clickable
          @select="emitSelectQuickMessage"
          @edit="emitEditQuickMessage"
          @delete="emitDeleteQuickMessage"
        />
      </section>
    </Transition>
    <section
      v-if="showExpand && !withoutQuickMessages"
      class="quick-messages-list__slide"
    >
      <UnnnicIcon
        :icon="openQuickMessages ? 'expand_less' : 'expand_more'"
        clickable
        @click="openQuickMessages = !openQuickMessages"
      />
    </section>
  </section>
</template>

<script>
import QuickMessageCard from './QuickMessageCard.vue';

export default {
  name: 'QuickMessagesList',

  components: {
    QuickMessageCard,
  },

  props: {
    withHandlers: {
      type: Boolean,
      default: false,
    },
    isEmpty: {
      type: Boolean,
    },
    title: {
      type: String,
      default: '',
    },
    showNewButton: {
      type: Boolean,
      default: false,
    },
    quickMessages: {
      type: Array,
      required: true,
    },
    showExpand: {
      type: Boolean,
      default: false,
    },
    withoutMessagesText: {
      type: String,
      default: '',
    },
  },
  emits: [
    'update:isEmpty',
    'select-quick-message',
    'edit-quick-message',
    'delete-quick-message',
    'open-new-quick-message',
  ],

  data() {
    return {
      openQuickMessages: true,
    };
  },

  computed: {
    withoutQuickMessages() {
      return this.quickMessages?.length === 0;
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
@import '@/styles/animations';

.quick-messages-list {
  padding: $unnnic-space-2;
  border-top: 1px solid $unnnic-color-border-soft;
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: $unnnic-space-2 0;

    &-title {
      font: $unnnic-font-display-4;
      color: $unnnic-color-fg-emphasized;
    }
  }
  &__cards {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    padding: $unnnic-space-2 0;
  }
  &__slide {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &__without-messages-text {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
  }
}
</style>

<template>
  <section
    @click="$emit('select', quickMessage)"
    @keypress.enter="$emit('select', quickMessage)"
    class="quick-message-card__container"
    :class="{ clickable }"
  >
    <unnnic-chat-text
      :title="quickMessage.title"
      titleColor="aux-purple-500"
      :info="quickMessageCardInfo"
      size="small"
      class="quick-message-card"
    >
      <template slot="actions" v-if="withActions">
        <unnnic-dropdown>
          <template #trigger>
            <unnnic-tool-tip
              v-if="!isMobile"
              enabled
              :text="$t('quick_messages.delete_or_edit')"
              side="left"
            >
              <unnnic-icon-svg icon="more_vert" size="sm" scheme="neutral-darkest" />
            </unnnic-tool-tip>
            <unnnic-icon-svg v-else icon="more_vert" size="sm" scheme="neutral-darkest" />
          </template>

          <unnnic-dropdown-item @click="$emit('edit', quickMessage)">
            <div class="dropdown-item-content">
              <unnnic-icon-svg class="icon" icon="edit_square" size="sm" />
              <span> {{ $t('edit') }} </span>
            </div>
          </unnnic-dropdown-item>

          <unnnic-dropdown-item @click="$emit('delete', quickMessage)">
            <div class="dropdown-item-content">
              <unnnic-icon-svg class="icon" icon="delete" size="sm" />
              <span> {{ $t('exclude') }} </span>
            </div>
          </unnnic-dropdown-item>
        </unnnic-dropdown>
      </template>

      <template slot="description">
        {{ quickMessage.text }}
      </template>
    </unnnic-chat-text>
  </section>
</template>

<script>
import isMobile from 'is-mobile';

export default {
  name: 'QuickMessageCard',

  props: {
    quickMessage: {
      type: Object,
      required: true,
    },
    clickable: {
      type: Boolean,
      default: false,
    },
    withActions: {
      type: Boolean,
      default: true,
    },
  },

  data() {
    return {
      isMobile: isMobile(),
    };
  },

  computed: {
    quickMessageCardInfo() {
      const { isMobile, quickMessage } = this;
      if (isMobile) {
        return '';
      }

      return this.$t('quick_messages.shortcut_tooltip', {
        shortcut: quickMessage.shortcut || quickMessage.title.toLowerCase(),
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.quick-message-card__container {
  &:not(:last-of-type) {
    margin-bottom: $unnnic-spacing-xs;
  }
}
.quick-message-card {
  :deep(.unnnic-chat-text) {
    line-break: anywhere;
  }

  .dropdown-item-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    white-space: nowrap;
  }
}
</style>

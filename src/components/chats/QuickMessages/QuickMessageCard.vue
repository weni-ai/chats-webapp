<template>
  <section
    class="quick-message-card__container"
    :class="{ clickable }"
    data-testid="quick-message-card-container"
    @click="$emit('select', quickMessage)"
    @keypress.enter="$emit('select', quickMessage)"
  >
    <UnnnicChatText
      :title="quickMessage.title"
      titleColor="aux-purple-500"
      :info="quickMessageCardInfo"
      size="small"
      class="quick-message-card"
      data-testid="quick-message-card"
    >
      <template
        v-if="withActions"
        #actions
      >
        <UnnnicDropdown>
          <template #trigger>
            <UnnnicToolTip
              v-if="!isMobile"
              enabled
              :text="$t('quick_messages.delete_or_edit')"
              side="left"
            >
              <UnnnicIconSvg
                icon="more_vert"
                size="sm"
                scheme="neutral-darkest"
                data-testid="dropdown-trigger-icon"
              />
            </UnnnicToolTip>
            <UnnnicIconSvg
              v-else
              icon="more_vert"
              size="sm"
              scheme="neutral-darkest"
            />
          </template>

          <UnnnicDropdownItem
            data-testid="dropdown-edit"
            @click="$emit('edit', quickMessage)"
          >
            <div class="dropdown-item-content">
              <UnnnicIconSvg
                class="icon"
                icon="edit_square"
                size="sm"
              />
              <span> {{ $t('edit') }} </span>
            </div>
          </UnnnicDropdownItem>

          <UnnnicDropdownItem
            data-testid="dropdown-delete"
            @click="$emit('delete', quickMessage)"
          >
            <div class="dropdown-item-content">
              <UnnnicIconSvg
                class="icon"
                icon="delete"
                size="sm"
              />
              <span> {{ $t('exclude') }} </span>
            </div>
          </UnnnicDropdownItem>
        </UnnnicDropdown>
      </template>

      <template #description>
        {{ quickMessage.text }}
      </template>
    </UnnnicChatText>
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
  emits: ['select', 'edit', 'delete'],

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

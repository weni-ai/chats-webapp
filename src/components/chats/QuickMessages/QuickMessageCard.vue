<template>
  <section
    class="quick-message-card__container"
    :class="{ clickable }"
    data-testid="quick-message-card-container"
    @click="$emit('select', quickMessage)"
    @keypress.enter="$emit('select', quickMessage)"
  >
    <UnnnicChatText
      :title="`/${quickMessage.shortcut}`"
      titleColor="aux-blue-500"
      size="small"
      class="quick-message-card"
      data-testid="quick-message-card"
    >
      <template
        v-if="withActions"
        #actions
      >
        <UnnnicPopover>
          <UnnnicPopoverTrigger>
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
          </UnnnicPopoverTrigger>
          <UnnnicPopoverContent>
            <div class="dropdown-item-content">
              <div
                data-testid="dropdown-edit"
                @click="$emit('edit', quickMessage)"
              >
                <div class="dropdown-item">
                  <UnnnicIconSvg
                    class="icon"
                    icon="edit_square"
                    size="avatar-nano"
                  />
                  <span> {{ $t('edit') }} </span>
                </div>
              </div>
              <div
                data-testid="dropdown-delete"
                @click="$emit('delete', quickMessage)"
              >
                <div class="dropdown-item delete">
                  <UnnnicIconSvg
                    class="icon"
                    icon="delete"
                    scheme="fg-critical"
                    size="avatar-nano"
                  />
                  <span> {{ $t('exclude') }} </span>
                </div>
              </div>
            </div>
          </UnnnicPopoverContent>
        </UnnnicPopover>
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
};
</script>

<style lang="scss" scoped>
.quick-message-card__container {
  &:not(:last-of-type) {
    margin-bottom: $unnnic-spacing-xs;
  }
}

:deep(div.unnnic-chat-text.small) {
  padding: $unnnic-space-2;
  line-break: anywhere;

  .header {
    margin-bottom: $unnnic-space-1;
    .title {
      font: $unnnic-font-caption-2;
    }
  }

  .description {
    font: $unnnic-font-caption-2;
  }
}

.dropdown-item-content {
  display: flex;
  justify-content: center;
  flex-direction: column;
  gap: $unnnic-space-2;

  white-space: nowrap;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: $unnnic-space-2;
  font: $unnnic-font-emphasis;
  color: $unnnic-color-fg-emphasized;

  &.delete {
    color: $unnnic-color-fg-critical;
  }
}
</style>

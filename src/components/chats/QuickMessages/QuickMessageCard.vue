<template>
  <UnnnicToolTip
    :text="quickMessage.text"
    :enabled="showTooltip"
    :side="tooltipSide"
    maxWidth="400px"
  >
    <section
      class="quick-message-card__container"
      :class="{ clickable }"
      data-testid="quick-message-card-container"
      @click="$emit('select', quickMessage)"
      @keypress.enter="$emit('select', quickMessage)"
    >
      <section class="quick-message-card__header">
        <p
          class="quick-message-card__header-title"
          data-testid="quick-message-card-header-title"
        >
          {{ `/${quickMessage.shortcut}` }}
        </p>
        <div
          class="quick-message-card__actions"
          @click.stop
        >
          <UnnnicPopover
            :open="openPopover"
            @update:open="openPopover = $event"
          >
            <UnnnicPopoverTrigger
              class="clickable"
              data-testid="dropdown-trigger-icon"
            >
              <UnnnicIconSvg
                icon="more_vert"
                size="sm"
                scheme="fg-base"
              />
            </UnnnicPopoverTrigger>
            <UnnnicPopoverContent size="small">
              <div class="quick-message-card__popover-options">
                <UnnnicPopoverOption
                  data-testid="dropdown-send-in-bulk"
                  :label="$t('quick_messages.send_in_bulk')"
                  icon="forward"
                  @click="emitSendInBulk"
                />
                <UnnnicPopoverOption
                  v-if="!isSharedQuickMessage"
                  data-testid="dropdown-edit"
                  :label="$t('edit')"
                  icon="edit_square"
                  @click="emitEdit"
                />
                <UnnnicPopoverOption
                  v-if="!isSharedQuickMessage"
                  data-testid="dropdown-delete"
                  :label="$t('delete')"
                  icon="delete"
                  scheme="fg-critical"
                  @click="emitDelete"
                />
              </div>
            </UnnnicPopoverContent>
          </UnnnicPopover>
        </div>
      </section>
      <section class="quick-message-card__content">
        <p
          class="quick-message-card__content-text"
          data-testid="quick-message-card-content-text"
        >
          {{ quickMessage.text }}
        </p>
      </section>
    </section>
  </UnnnicToolTip>
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
    showTooltip: {
      type: Boolean,
      default: false,
    },
    tooltipSide: {
      type: String,
      default: 'left',
    },
  },

  emits: ['select', 'edit', 'delete', 'send-in-bulk'],

  data() {
    return {
      isMobile: isMobile(),
      openPopover: false,
    };
  },
  computed: {
    isSharedQuickMessage() {
      return !!this.quickMessage.sector;
    },
  },
  methods: {
    emitSendInBulk() {
      this.openPopover = false;
      this.$emit('send-in-bulk', this.quickMessage);
    },
    emitEdit() {
      this.openPopover = false;
      this.$emit('edit', this.quickMessage);
    },
    emitDelete() {
      this.openPopover = false;
      this.$emit('delete', this.quickMessage);
    },
  },
};
</script>

<style lang="scss" scoped>
.clickable {
  cursor: pointer;
}

:deep(.unnnic-tooltip) {
  display: flex;
  width: 100%;
}

.quick-message-card {
  &__container {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: $unnnic-space-2;
    border-radius: $unnnic-radius-2;
    border: 1px solid $unnnic-color-border-soft;
    gap: $unnnic-space-1;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    &-title {
      font: $unnnic-font-caption-2;
      color: $unnnic-color-fg-info;
    }
  }
  &__content {
    &-text {
      font: $unnnic-font-caption-2;
      color: $unnnic-color-fg-base;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__popover-options {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
  }
}
</style>

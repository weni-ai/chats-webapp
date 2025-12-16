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
        <UnnnicPopover
          v-if="withActions"
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
              scheme="neutral-darkest"
              @click="togglePopover"
            />
          </UnnnicPopoverTrigger>
          <UnnnicPopoverContent>
            <div class="dropdown-item-content">
              <div
                data-testid="dropdown-edit"
                @click="emitEdit"
              >
                <div class="dropdown-item clickable">
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
                @click="emitDelete"
              >
                <div class="dropdown-item delete clickable">
                  <UnnnicIconSvg
                    class="icon"
                    icon="delete"
                    scheme="fg-critical"
                    size="avatar-nano"
                  />
                  <span> {{ $t('delete') }} </span>
                </div>
              </div>
            </div>
          </UnnnicPopoverContent>
        </UnnnicPopover>
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
    withActions: {
      type: Boolean,
      default: true,
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
  emits: ['select', 'edit', 'delete'],

  data() {
    return {
      isMobile: isMobile(),
      openPopover: false,
    };
  },
  methods: {
    togglePopover() {
      this.openPopover = !this.openPopover;
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

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
      :info="
        $t('quick_messages.shortcut_tooltip', {
          shortcut: quickMessage.shortcut || quickMessage.title.toLowerCase(),
        })
      "
      size="small"
      class="quick-message-card"
    >
      <template slot="actions" v-if="withActions">
        <unnnic-dropdown>
          <template #trigger>
            <unnnic-tool-tip enabled :text="$t('quick_messages.delete_or_edit')" side="left">
              <div class="quick-message-actions">
                <unnnic-icon-svg icon="more_vert" size="sm" scheme="neutral-darkest" />
              </div>
            </unnnic-tool-tip>
          </template>

          <unnnic-dropdown-item @click="$emit('edit')">
            <div class="dropdown-item-content">
              <unnnic-icon-svg class="icon" icon="edit_square" size="sm" />
              <span> {{ $t('edit') }} </span>
            </div>
          </unnnic-dropdown-item>

          <unnnic-dropdown-item @click="$emit('delete')">
            <div class="dropdown-item-content">
              <unnnic-icon-svg class="icon" icon="delete" size="sm" />
              <span> {{ $t('delete') }} </span>
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

  .quick-message-actions {
    display: flex;
    align-items: center;
  }

  .dropdown-item-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    white-space: nowrap;
  }
}
</style>

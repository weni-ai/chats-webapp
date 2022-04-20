<template>
  <section
    @click="$emit('select', quickMessage)"
    @keypress.enter="$emit('select', quickMessage)"
    class="quick-message-card"
    :class="{ clickable }"
  >
    <unnnic-chat-text
      :title="quickMessage.title"
      title-color="aux-purple"
      :info="`Digite #${quickMessage.shortcut || quickMessage.title.toLowerCase()} para usar`"
      size="small"
    >
      <template slot="actions">
        <unnnic-dropdown>
          <template #trigger>
            <unnnic-tool-tip enabled text="Remover ou editar" side="left">
              <div class="quick-message-actions">
                <unnnic-icon-svg icon="navigation-menu-vertical-1" size="sm" scheme="aux-purple" />
              </div>
            </unnnic-tool-tip>
          </template>

          <unnnic-dropdown-item @click="$emit('edit')">
            <div class="dropdown-item-content">
              <unnnic-icon-svg class="icon" icon="app-window-edit-1" />
              <span> Editar </span>
            </div>
          </unnnic-dropdown-item>

          <unnnic-dropdown-item @click="$emit('delete')">
            <div class="dropdown-item-content">
              <unnnic-icon-svg class="icon" icon="delete-1-1" />
              <span> Excluir </span>
            </div>
          </unnnic-dropdown-item>
        </unnnic-dropdown>
      </template>

      <template slot="description">
        {{ quickMessage.message }}
      </template>
    </unnnic-chat-text>
  </section>
</template>

<script>
export default {
  name: 'QuickMessageCard',

  props: {
    clickable: {
      type: Boolean,
      default: false,
    },
    quickMessage: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.quick-message-card {
  .quick-message-actions {
    display: flex;
    align-items: center;
  }

  .dropdown-item-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}
.clickable {
  cursor: pointer;
}
</style>

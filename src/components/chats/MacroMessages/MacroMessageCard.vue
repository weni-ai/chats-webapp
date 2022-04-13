<template>
  <section class="macro-message" @click="$emit('select')" @keypress.enter="$emit('select')">
    <header>
      <span>{{ title }}</span>
      <span>
        <unnnic-tool-tip enabled :text="`Digite #${title.toLowerCase()} para usar`" side="right">
          <unnnic-icon-svg icon="information-circle-4" size="sm" scheme="neutral-clean" />
        </unnnic-tool-tip>
      </span>
      <span class="options-menu">
        <unnnic-dropdown>
          <template #trigger>
            <unnnic-icon-svg icon="navigation-menu-vertical-1" size="sm" />
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
      </span>
    </header>

    <p>{{ message }}</p>
  </section>
</template>

<script>
export default {
  name: 'MacroMessageCard',

  props: {
    title: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      required: true,
    },
  },

  data: () => ({
    isOpenOptionsMenu: false,
  }),
};
</script>

<style lang="scss" scoped>
.macro-message {
  padding: 0.5rem 1rem;
  border: solid 1px $unnnic-color-neutral-dark;
  border-radius: $unnnic-border-radius-md;
  cursor: pointer;

  header {
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    span {
      font-size: 0.875rem;
      line-height: 1.375rem;
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
    }

    .options-menu {
      margin-left: auto;
    }

    .dropdown-item-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }

  p {
    font-size: 0.75rem;
    line-height: 1.25rem;
    color: $unnnic-color-neutral-dark;
  }
}
</style>

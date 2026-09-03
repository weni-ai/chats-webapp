<template>
  <section
    class="desk-copilot-empty-state"
    data-testid="desk-copilot-empty-state"
  >
    <h2
      class="desk-copilot-empty-state__title"
      data-testid="desk-copilot-empty-state-title"
    >
      {{ $t('config_chats.desk_copilot.empty_state.title') }}
    </h2>
    <p
      class="desk-copilot-empty-state__description"
      data-testid="desk-copilot-empty-state-description"
    >
      {{ $t('config_chats.desk_copilot.empty_state.description') }}
    </p>
    <section class="desk-copilot-empty-state__actions">
      <UnnnicButton
        type="primary"
        size="small"
        :text="$t('config_chats.desk_copilot.empty_state.select_button')"
        data-testid="desk-copilot-select-button"
        @click="emit('open-select-modal')"
      />
      <UnnnicToolTip
        :enabled="isCreateDisabled"
        :text="
          $t('config_chats.desk_copilot.empty_state.create_disabled_tooltip')
        "
        side="bottom"
      >
        <UnnnicButton
          type="secondary"
          size="small"
          :text="$t('config_chats.desk_copilot.empty_state.create_button')"
          :disabled="isCreateDisabled"
          data-testid="desk-copilot-create-button"
          @click="handleCreateClick"
        />
      </UnnnicToolTip>
    </section>
  </section>
</template>

<script setup lang="ts">
defineOptions({
  name: 'DeskCopilotEmptyState',
});

const props = withDefaults(
  defineProps<{
    isCreateDisabled?: boolean;
  }>(),
  {
    isCreateDisabled: false,
  },
);

const emit = defineEmits<{
  'open-create-modal': [];
  'open-select-modal': [];
}>();

function handleCreateClick() {
  if (props.isCreateDisabled) {
    return;
  }

  emit('open-create-modal');
}
</script>

<style lang="scss" scoped>
.desk-copilot-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $unnnic-space-3;
  width: 100%;
  flex: 1;
  min-height: 0;

  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
    text-align: center;
    margin: 0;
  }

  &__description {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
    text-align: center;
    max-width: 374px;
    margin: 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $unnnic-space-3;
  }
}
</style>

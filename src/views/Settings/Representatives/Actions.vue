<template>
  <section class="settings-representatives-actions">
    <section class="settings-representatives-actions__select-all-container">
      <UnnnicCheckbox
        :modelValue="props.selectAll"
        :label="$t('config_chats.representatives.select_all')"
        @update:model-value="emit('update:selectAll', $event)"
      />
      <p
        v-if="props.selectedCount > 0"
        class="settings-representatives-actions__select-count"
      >
        {{
          $t('config_chats.representatives.select_count', {
            count: props.selectedCount,
          })
        }}
      </p>
    </section>
    <section class="settings-representatives-actions__actions-buttons">
      <UnnnicToolTip
        :text="
          $t('config_chats.representatives.actions.queue-management_tooltip')
        "
        enabled
      >
        <UnnnicButton
          iconCenter="swap_vert"
          type="secondary"
          @click="emit('open-queue-management')"
        />
      </UnnnicToolTip>
      <UnnnicToolTip
        :text="
          $t(
            'config_chats.representatives.actions.chats-limit-management_tooltip',
          )
        "
        enabled
      >
        <UnnnicButton
          iconCenter="forum"
          type="secondary"
          @click="emit('open-chats-limit-management')"
        />
      </UnnnicToolTip>
    </section>
  </section>
</template>

<script setup lang="ts">
defineOptions({
  name: 'SettingsRepresentativesActions',
});

interface Props {
  selectedCount: number;
  selectAll: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:selectAll': [value: boolean];
  'open-queue-management': [void];
  'open-chats-limit-management': [void];
}>();
</script>

<style lang="scss" scoped>
.settings-representatives-actions {
  display: flex;
  justify-content: space-between;
  &__select-all-container {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
  }
  &__actions-buttons {
    display: flex;
    gap: $unnnic-space-2;
  }
}
</style>

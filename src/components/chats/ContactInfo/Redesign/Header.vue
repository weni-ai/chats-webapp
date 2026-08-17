<template>
  <header
    class="contact-info-redesign-header"
    data-testid="contact-info-redesign-header"
  >
    <UnnnicSegmentedControl
      class="contact-info-redesign-header__segmented"
      :modelValue="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <UnnnicSegmentedControlList>
        <UnnnicSegmentedControlTrigger
          value="desk_copilot"
          data-testid="segmented-desk-copilot"
        >
          {{ $t('contact_info.header.desk_copilot') }}
        </UnnnicSegmentedControlTrigger>
        <UnnnicSegmentedControlTrigger
          value="information"
          data-testid="segmented-information"
        >
          {{ $t('contact_info.header.information') }}
        </UnnnicSegmentedControlTrigger>
      </UnnnicSegmentedControlList>
    </UnnnicSegmentedControl>

    <section class="contact-info-redesign-header__actions">
      <UnnnicButton
        v-if="showRefresh"
        iconCenter="sync"
        type="tertiary"
        size="small"
        :disabled="isRefreshDisabled"
        data-testid="refresh-button"
        @click="emit('refresh')"
      />
      <UnnnicButton
        v-if="showClose"
        iconCenter="close"
        type="tertiary"
        size="small"
        data-testid="close-button"
        @click="emit('close')"
      />
    </section>
  </header>
</template>

<script setup lang="ts">
export type ContactInfoTab = 'desk_copilot' | 'information';

defineOptions({
  name: 'ContactInfoRedesignHeader',
});

withDefaults(
  defineProps<{
    modelValue?: ContactInfoTab;
    showRefresh?: boolean;
    showClose?: boolean;
    isRefreshDisabled?: boolean;
  }>(),
  {
    modelValue: 'desk_copilot',
    showRefresh: true,
    showClose: true,
    isRefreshDisabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: ContactInfoTab];
  refresh: [];
  close: [];
}>();
</script>

<style lang="scss" scoped>
.contact-info-redesign-header {
  display: flex;
  align-items: center;
  gap: $unnnic-space-2;
  padding: $unnnic-space-2;
  min-height: var(--chats-column-header-height, 57px);
  background-color: $unnnic-color-bg-base;

  &__segmented {
    flex: 1;
    min-width: 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
    flex-shrink: 0;
  }
}
</style>

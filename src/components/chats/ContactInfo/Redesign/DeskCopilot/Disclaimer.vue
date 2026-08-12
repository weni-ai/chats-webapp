<template>
  <section
    class="desk-copilot-disclaimer"
    data-testid="desk-copilot-disclaimer"
  >
    <section class="desk-copilot-disclaimer__content">
      <UnnnicIcon
        icon="info"
        size="sm"
        scheme="fg-info"
      />

      <section class="desk-copilot-disclaimer__text">
        <h3 class="desk-copilot-disclaimer__title">
          {{ $t('contact_info.desk_copilot.disclaimer.title') }}
        </h3>
        <p class="desk-copilot-disclaimer__description">
          {{ $t('contact_info.desk_copilot.disclaimer.description') }}
        </p>
        <ul class="desk-copilot-disclaimer__items">
          <li
            v-for="item in disclaimerItems"
            :key="item"
            class="desk-copilot-disclaimer__item"
          >
            <UnnnicIcon
              icon="check_small"
              size="xs"
              scheme="fg-emphasized"
            />
            <span>{{ $t(item) }}</span>
          </li>
        </ul>
      </section>
    </section>

    <UnnnicButton
      v-if="showEnableButton"
      type="tertiary"
      size="small"
      data-testid="desk-copilot-enable-button"
      @click="handleEnable"
    >
      {{ $t('contact_info.desk_copilot.disclaimer.enable_button') }}
    </UnnnicButton>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useProfile } from '@/store/modules/profile';
import { isUserAdmin } from '@/utils/permissions';
import { emitToHost } from '@/utils/hostBridge';

defineOptions({
  name: 'DeskCopilotDisclaimer',
});

const props = withDefaults(
  defineProps<{
    isHistory?: boolean;
    isViewMode?: boolean;
  }>(),
  {
    isHistory: false,
    isViewMode: false,
  },
);

const { me } = storeToRefs(useProfile());

const disclaimerItems = [
  'contact_info.desk_copilot.disclaimer.items.product_recommendations',
  'contact_info.desk_copilot.disclaimer.items.catalog_search',
  'contact_info.desk_copilot.disclaimer.items.sales_arguments',
  'contact_info.desk_copilot.disclaimer.items.next_best_actions',
] as const;

const showEnableButton = computed(
  () =>
    isUserAdmin(me.value?.project_permission_role) &&
    !props.isHistory &&
    !props.isViewMode,
);

function handleEnable() {
  // Placeholder path until Connect wires the Live Desk settings route
  emitToHost('redirect', { path: 'chats:settings/live-desk' });
}
</script>

<style lang="scss" scoped>
.desk-copilot-disclaimer {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: $unnnic-space-2;
  padding: $unnnic-space-4;
  background-color: $unnnic-color-bg-info;
  border: 1px solid $unnnic-color-border-info;
  border-radius: $unnnic-radius-2;
  flex-shrink: 0;
  width: 100%;

  &__content {
    display: flex;
    align-items: flex-start;
    gap: $unnnic-space-2;
    width: 100%;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-1;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font: $unnnic-font-action;
    color: $unnnic-color-fg-emphasized;
  }

  &__description,
  &__item {
    font: $unnnic-font-caption-2;
    color: $unnnic-color-fg-emphasized;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-1;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: flex;
    align-items: flex-start;
    gap: $unnnic-space-1;
  }
}
</style>

<template>
  <UnnnicCheckboxGroup
    class="contacts-status"
    :class="{ 'contacts-status--error': !hasSelectedStatus }"
    :label="$t('mass_message.form.recipients.select_the_contacts_status')"
    :helper="statusHelper"
  >
    <section class="contacts-status__options">
      <UnnnicCheckbox
        data-testid="contacts-status-ongoing"
        :label="$t('mass_message.form.recipients.contacts_in_service')"
        :modelValue="props.status.includes('ongoing')"
        @update:model-value="toggleStatus('ongoing')"
      />
      <UnnnicCheckbox
        data-testid="contacts-status-waiting"
        :label="$t('mass_message.form.recipients.contacts_waiting_for_service')"
        :modelValue="props.status.includes('waiting')"
        @update:model-value="toggleStatus('waiting')"
      />
    </section>
  </UnnnicCheckboxGroup>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

defineOptions({
  name: 'ContactsStatus',
});

const props = defineProps<{
  status: string[];
}>();

const emit = defineEmits<{
  'update:status': [status: string[]];
}>();

const { t } = useI18n();

const hasSelectedStatus = computed(() => props.status.length > 0);

const statusHelper = computed(() =>
  hasSelectedStatus.value
    ? ''
    : t('mass_message.form.recipients.at_least_one_status_must_be_selected'),
);

const toggleStatus = (status: string) => {
  const newStatus = props.status.includes(status)
    ? props.status.filter((s) => s !== status)
    : [...props.status, status];

  emit('update:status', newStatus);
};
</script>

<style scoped lang="scss">
.contacts-status {
  &__options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    flex: 1;
    gap: $unnnic-space-6;
  }

  &--error {
    :deep(.unnnic-checkbox-group__helper) {
      color: $unnnic-color-fg-critical;
    }
  }
}
</style>

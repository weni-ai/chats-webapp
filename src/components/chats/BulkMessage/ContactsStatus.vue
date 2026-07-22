<template>
  <UnnnicCheckboxGroup
    :label="$t('mass_message.form.recipients.select_the_contacts_status')"
  >
    <section class="bulk-message-form__recipients-status">
      <UnnnicCheckbox
        :label="$t('mass_message.form.recipients.contacts_in_service')"
        :modelValue="props.status.includes('ongoing')"
        @update:model-value="toggleStatus('ongoing')"
      />
      <UnnnicCheckbox
        :label="$t('mass_message.form.recipients.contacts_waiting_for_service')"
        :modelValue="props.status.includes('waiting')"
        @update:model-value="toggleStatus('waiting')"
      />
    </section>
  </UnnnicCheckboxGroup>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ContactsStatus',
});

const props = defineProps<{
  status: string[];
}>();

const emit = defineEmits<{
  'update:status': [status: string[]];
}>();

const toggleStatus = (status: string) => {
  const newStatus = props.status.includes(status)
    ? props.status.filter((s) => s !== status)
    : [...props.status, status];

  emit('update:status', newStatus);
};
</script>

<style scoped lang="scss">
.bulk-message-form {
  &__recipients-status {
    display: grid;
    grid-template-columns: 1fr 1fr;
    flex: 1;
    gap: $unnnic-space-6;
  }
}
</style>

<template>
  <section
    v-if="contacts.length > 0"
    class="selected-contacts-section"
    data-testid="selected-contacts-section"
    @click="$emit('click')"
    @keypress.enter="$emit('click')"
  >
    <UnnnicTag
      v-for="contact in contacts"
      :key="contact.uuid"
      type="default"
      :text="contact.name"
      hasCloseIcon
      data-testid="contact-tag"
      @close="$emit('remove-contact', contact)"
    />
  </section>
</template>

<script>
export default {
  name: 'SelectedContactsSection',
  props: {
    contacts: {
      type: Array,
      required: true,
    },
  },
  emits: ['click', 'remove-contact'],
};
</script>

<style lang="scss" scoped>
.selected-contacts-section {
  display: flex;
  gap: $unnnic-spacing-xs;
  overflow: hidden auto;
  flex-wrap: wrap;
  max-height: $unnnic-space-20;

  scroll-snap-type: y proximity;

  :deep(.chip) {
    height: $unnnic-space-8;
    max-width: 100%;
    scroll-snap-align: start;

    .chip__text {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>

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
      scheme="background-snow"
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
  max-height: $unnnic-spacing-xgiant;

  scroll-snap-type: y proximity;

  :deep(.unnnic-tag) {
    background-color: $unnnic-color-background-snow;

    max-width: 100%;
    scroll-snap-align: start;

    .unnnic-tag__label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>

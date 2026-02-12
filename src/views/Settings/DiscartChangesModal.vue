<template>
  <UnnnicDialog
    v-model:open="open"
    data-testid="discart-changes-modal"
  >
    <UnnnicDialogContent size="small">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>{{ title }}</UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="discart-changes-modal__content">
        <p class="discart-changes-modal__text">{{ text }}</p>
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('back')"
          type="tertiary"
          @click="$emit('cancel')"
        />
        <UnnnicButton
          :text="$t('discart')"
          type="primary"
          @click="$emit('confirm')"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script>
export default {
  name: 'DiscartChangesModal',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  computed: {
    open: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.discart-changes-modal {
  &__content {
    padding: $unnnic-space-6;
  }
  &__text {
    text-align: left;
    font-size: $unnnic-font-size-body-gt;
    font-family: $unnnic-font-family-secondary;
    line-height: 2 * $unnnic-font-size-body-md;
    color: $unnnic-color-fg-base;
  }
}
</style>

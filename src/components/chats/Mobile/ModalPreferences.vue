<template>
  <unnnic-modal @close="$emit('close')" :text="$t('preferences.title')" class="modal-preferences">
  </unnnic-modal>
</template>

<script>
export default {
  name: 'ModalPreferences',
};
</script>

<style lang="scss" scoped>
.modal-preferences {
  :deep(.unnnic-modal-container) {
    .unnnic-modal-container-background-body {
      &-description {
        padding: 0;

        &-container {
          padding-bottom: 0;
        }
      }
    }
  }
}
</style>

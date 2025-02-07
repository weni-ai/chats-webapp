<template>
  <UnnnicButton
    class="custom-btn"
    :text="$t('config_chats.custom_breaks.title')"
    type="secondary"
    size="large"
    @click.prevent.stop="showModal = true"
  />
  <UnnnicModalDialog
    :modelValue="showModal"
    :title="$t('config_chats.custom_breaks.title')"
    :primaryButtonProps="{ text: $t('save'), loading: isLoadingCloseRoom }"
    :secondaryButtonProps="{ text: $t('cancel') }"
    size="md"
    data-testid="chat-classifier-modal"
    showCloseIcon
    class="custom-breaks-modal"
    @primary-button-click="saveStatus()"
    @secondary-button-click="closeModal()"
    @update:model-value="closeModal()"
  >
    <section class="custom-breaks-modal__content">
      <header>
        <p class="custom-breaks-modal__description">
          {{ $t('config_chats.custom_breaks.description') }}
        </p>
      </header>
      <section class="custom-breaks-modal__form">
        <UnnnicInput
          v-model="customBreakName"
          :label="$t('config_chats.custom_breaks.fields.name')"
          :placeholder="$t('config_chats.custom_breaks.fields.placeholder')"
          data-testid="new-status-name"
          class="custom-breaks-modal__input"
        />
        <UnnnicButton
          :text="$t('add')"
          type="secondary"
        />
      </section>
      <section class="custom-breaks-modal__error-content">
        <UnnnicIcon
          icon="alert-circle-1"
          :next="true"
          filled
          size="sm"
          scheme="feedback-red"
        />
        <p class="custom-breaks-modal__error-text">
          {{ $t('config_chats.custom_breaks.status_exceeded_limit') }}
        </p>
      </section>
      <section class="custom-breaks-modal__list">List of custom breaks</section>
    </section>
  </UnnnicModalDialog>
</template>

<script setup>
import { ref } from 'vue';

const showModal = ref(false);

const closeModal = () => {
  showModal.value = false;
};

const saveStatus = () => {
  console.log('Save status');
};
</script>

<style lang="scss" scoped>
.custom-btn {
  width: 100%;
}
.custom-breaks-modal {
  &__description {
    color: $unnnic-color-neutral-cloudy;
    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    font-style: normal;
    font-weight: $unnnic-font-weight-regular;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
    padding-bottom: $unnnic-spacing-sm;
  }

  &__form {
    display: flex;
    width: 100%;
    align-items: end;
    gap: $unnnic-spacing-sm;
  }

  &__input {
    width: 100%;
  }

  &__error-content {
    display: flex;
    padding: $unnnic-spacing-sm;
    align-items: center;
    gap: $unnnic-spacing-xs;
    align-self: stretch;
    border-radius: $unnnic-spacing-nano;
    border: 1px solid $unnnic-color-neutral-soft;
    background: $unnnic-color-background-carpet;
    margin-top: $unnnic-spacing-xs;
  }

  &__error-text {
    color: $unnnic-color-neutral-dark;

    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    font-style: normal;
    font-weight: $unnnic-font-weight-regular;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
  }

  &__list {
    padding-top: $unnnic-spacing-sm;
  }
}
</style>

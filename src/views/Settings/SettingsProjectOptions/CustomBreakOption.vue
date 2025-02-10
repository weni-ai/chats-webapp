<template>
  <UnnnicButton
    class="custom-btn"
    :text="$t('config_chats.custom_breaks.title')"
    type="secondary"
    size="large"
    @click.prevent.stop="openModal"
  />

  <UnnnicModalDialog
    :modelValue="showModal"
    :title="$t('config_chats.custom_breaks.title')"
    :primaryButtonProps="{
      text: $t('save'),
      loading: isLoadingCloseRoom,
      disabled: !canSave,
    }"
    :secondaryButtonProps="{ text: $t('cancel') }"
    size="md"
    data-testid="chat-classifier-modal"
    showCloseIcon
    class="custom-breaks-modal"
    @primary-button-click="saveStatus"
    @secondary-button-click="closeModal"
    @update:model-value="closeModal"
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
          :disabled="isLimitReached"
          @input="validateInput"
          @keyup.enter="addStatus"
        />
        <UnnnicButton
          :text="$t('add')"
          type="secondary"
          :disabled="isLimitReached || !customBreakName.trim() || isDuplicate"
          @click="addStatus"
        />
      </section>

      <section
        v-if="errorMessage"
        class="custom-breaks-modal__error-content"
      >
        <UnnnicIcon
          icon="alert-circle-1"
          :next="true"
          filled
          size="sm"
          scheme="feedback-red"
        />
        <p class="custom-breaks-modal__error-text">
          {{ errorMessage }}
        </p>
      </section>

      <section class="custom-breaks-modal__list">
        <div
          v-for="(status, index) in customBreaks"
          :key="index"
          class="custom-breaks-modal__item"
        >
          <p class="custom-breaks-modal__list__status">{{ status }}</p>
          <UnnnicButtonIcon
            icon="close"
            size="sm"
            class="delete-icon"
            type="tertiary"
            @click.prevent.stop="removeStatus(index)"
          />
        </div>
      </section>
    </section>
  </UnnnicModalDialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import i18n from '@/plugins/i18n';
import callUnnnicAlert from '@/utils/callUnnnicAlert';

const showModal = ref(false);
const isLoadingCloseRoom = ref(false);
const customBreakName = ref('');
const customBreaks = ref([]);
const originalBreaks = ref([]);
const isDuplicate = ref(false);

const MAX_STATUS = 6;

const fetchCustomBreaks = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const fakeData = ['Em pausa', 'Em reunião'];
      originalBreaks.value = [...fakeData];
      customBreaks.value = [...fakeData];
      resolve(fakeData);
    }, 500);
  });
};

const isLimitReached = computed(() => customBreaks.value.length >= MAX_STATUS);

const canSave = computed(() => {
  const hasNewStatus = customBreaks.value.some(
    (status) => !originalBreaks.value.includes(status),
  );
  return customBreaks.value.length > 0 && hasNewStatus;
});

const errorMessage = computed(() => {
  if (isLimitReached.value)
    return i18n.global.t('config_chats.custom_breaks.status_exceeded_limit');
  if (isDuplicate.value)
    return i18n.global.t('config_chats.custom_breaks.status_duplicate_name');
  return '';
});

const validateInput = () => {
  const lowerCaseName = customBreakName.value.trim().toLowerCase();
  isDuplicate.value = customBreaks.value.some(
    (status) => status.toLowerCase() === lowerCaseName,
  );
};

const addStatus = () => {
  if (
    !isLimitReached.value &&
    customBreakName.value.trim() &&
    !isDuplicate.value
  ) {
    customBreaks.value.push(customBreakName.value.trim());
    customBreakName.value = '';
    isDuplicate.value = false;
  }
};

const removeStatus = (index) => {
  customBreaks.value.splice(index, 1);
};

const saveStatus = async () => {
  if (!canSave.value) return;

  isLoadingCloseRoom.value = true;
  setTimeout(() => {
    originalBreaks.value = [...customBreaks.value];
    isLoadingCloseRoom.value = false;
    callUnnnicAlert({
      props: {
        text: i18n.global.t('config_chats.custom_breaks.status_success'),
        type: 'success',
      },
      seconds: 5,
    });
    closeModal();
  }, 1000);
};

const openModal = async () => {
  showModal.value = true;
  await fetchCustomBreaks();
};

const closeModal = () => {
  showModal.value = false;
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
    margin-top: $unnnic-spacing-sm;
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-nano;

    &__status {
      color: $unnnic-color-neutral-dark;

      font-family: $unnnic-font-family-secondary;
      font-size: $unnnic-font-size-body-gt;
      font-style: normal;
      font-weight: $unnnic-font-weight-bold;
      line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
    }
  }

  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    align-self: stretch;
  }
}
.delete-icon {
  cursor: pointer;
  background-color: inherit;
}
</style>

<template>
  <UnnnicButton
    class="custom-btn"
    :text="$t('config_chats.custom_breaks.title')"
    type="secondary"
    size="small"
    @click.prevent.stop="openModal"
  />

  <UnnnicModalDialog
    :modelValue="showModal"
    :title="$t('config_chats.custom_breaks.title')"
    :primaryButtonProps="{
      text: $t('save'),
      loading: isLoadingSaveStatus,
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

      <section
        v-if="!isLoadingStatusData"
        class="custom-breaks-modal__list"
      >
        <div
          v-for="(status, index) in customBreaks"
          :key="index"
          class="custom-breaks-modal__item"
        >
          <p class="custom-breaks-modal__list__status">{{ status.name }}</p>
          <UnnnicButton
            v-if="!isLoadingRemoveStatus"
            iconCenter="close"
            size="small"
            class="delete-icon"
            type="tertiary"
            @click.prevent.stop="removeStatus(index)"
          />
          <UnnnicIconLoading
            v-else
            size="sm"
          />
        </div>
      </section>
      <section
        v-else
        class="custom-breaks-modal__loading"
      >
        <UnnnicIconLoading />
      </section>
    </section>
  </UnnnicModalDialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import i18n from '@/plugins/i18n';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import customStatus from '@/services/api/resources/chats/pauseStatus';
import { useConfig } from '@/store/modules/config';
import { moduleStorage } from '@/utils/storage';

const config = useConfig();

const showModal = ref(false);
const isLoadingSaveStatus = ref(false);
const isLoadingStatusData = ref(false);
const isLoadingRemoveStatus = ref(false);
const customBreakName = ref('');
const customBreaks = ref([]);
const originalBreaks = ref([]);
const isDuplicate = ref(false);

const MAX_STATUS = 10;

const getStatus = async () => {
  isLoadingStatusData.value = true;
  try {
    const data = await customStatus.getCustomBreakStatusTypeList({
      projectUuid: config.project.uuid,
    });
    const dataStatus = data.results.map((item) => ({
      ...item,
      hasSaved: true,
    }));
    customBreaks.value = dataStatus;
  } catch (error) {
    console.error('error get status', error);
  } finally {
    isLoadingStatusData.value = false;
  }
};

const isLimitReached = computed(
  () => customBreaks?.value?.length >= MAX_STATUS,
);

const canSave = computed(() => {
  const hasNewStatus = customBreaks?.value?.some(
    (status) => !originalBreaks?.value?.includes(status),
  );
  return customBreaks?.value?.length > 0 && hasNewStatus;
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
  isDuplicate.value = customBreaks?.value?.some(
    (status) => status.name.toLowerCase() === lowerCaseName,
  );
};

const addStatus = () => {
  if (
    !isLimitReached.value &&
    customBreakName.value.trim() &&
    !isDuplicate.value
  ) {
    customBreaks.value.push({
      name: customBreakName.value.trim(),
    });
    customBreakName.value = '';
    isDuplicate.value = false;
  }
};

const removeStatus = async (index) => {
  const currentStatus = customBreaks.value[index];
  if (currentStatus.uuid) {
    isLoadingRemoveStatus.value = true;
    try {
      await customStatus.deleteCustomStatusType({
        statusUuid: currentStatus.uuid,
      });
      customBreaks.value.splice(index, 1);
      windowSettingsUpdated();
      callUnnnicAlert({
        props: {
          text: i18n.global.t(
            'config_chats.custom_breaks.status_remove_success',
            {
              status: currentStatus.name,
            },
          ),
          scheme: '$unnnic-color-neutral-black',
        },
        seconds: 3,
      });
    } catch (error) {
      callUnnnicAlert({
        props: {
          text: i18n.global.t('config_chats.custom_breaks.status_error'),
          type: 'error',
        },
        seconds: 5,
      });
    } finally {
      isLoadingRemoveStatus.value = false;
    }
  } else customBreaks.value.splice(index, 1);
};

const saveStatus = async () => {
  if (!canSave.value) return;

  isLoadingSaveStatus.value = true;
  try {
    const dataStatus = customBreaks.value
      .filter((item) => !item.hasSaved)
      .map((item) => ({
        name: item.name,
        project: config.project.uuid,
      }));

    await customStatus.createCustomStatusType({
      status: dataStatus,
    });

    callUnnnicAlert({
      props: {
        text: i18n.global.t('config_chats.custom_breaks.status_success'),
        type: 'success',
      },
      seconds: 5,
    });
    closeModal();
    windowSettingsUpdated();
  } catch (error) {
    console.error('error create custom status', error);

    callUnnnicAlert({
      props: {
        text: i18n.global.t('config_chats.custom_breaks.status_error'),
        type: 'error',
      },
      seconds: 5,
    });
  } finally {
    isLoadingSaveStatus.value = false;
  }
};

const openModal = async () => {
  showModal.value = true;
  await getStatus();
};

const closeModal = () => {
  showModal.value = false;
};

const windowSettingsUpdated = () => {
  const timestamp = Date.now().toString();
  moduleStorage.setItem('settingsUpdated', timestamp);
};
</script>

<style lang="scss" scoped>
.custom-btn {
  max-height: 37px;
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

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: $unnnic-spacing-sm;
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

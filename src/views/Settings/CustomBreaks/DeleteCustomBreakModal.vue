<template>
  <UnnnicDialog :open="open">
    <UnnnicDialogContent>
      <UnnnicDialogHeader
        type="warning"
        :closeButton="false"
      >
        <UnnnicDialogTitle>
          {{ $t('config_chats.custom_breaks.delete_modal.title') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="delete-custom-break-modal__content">
        <p class="delete-custom-break-modal__content__description">
          {{
            $t('config_chats.custom_breaks.delete_modal.description_1', {
              name: props.customBreak?.name,
            })
          }}
        </p>
        <p class="delete-custom-break-modal__content__description">
          {{ $t('config_chats.custom_breaks.delete_modal.description_2') }}
        </p>
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('cancel')"
          type="tertiary"
          @click="open = false"
        />
        <UnnnicButton
          text="Confirm"
          type="warning"
          :loading="isLoadingDeleteCustomBreak"
          @click="deleteCustomBreak"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { UnnnicCallAlert } from '@weni/unnnic-system';

import { useSettings } from '@/store/modules/settings';

import CustomBreakService from '@/services/api/resources/chats/pauseStatus';

import i18n from '@/plugins/i18n';

import { CustomBreak } from './types';
import { storeToRefs } from 'pinia';

defineOptions({
  name: 'DeleteCustomBreakModal',
});

interface Props {
  modelValue: boolean;
  customBreak: CustomBreak;
}

const { t } = i18n.global;

const emit = defineEmits(['close']);
const props = defineProps<Props>();

const settingsStore = useSettings();
const { customBreaks } = storeToRefs(settingsStore);

const open = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    if (!value) {
      emit('close');
    }
  },
});
const isLoadingDeleteCustomBreak = ref(false);
const deleteCustomBreak = async () => {
  try {
    isLoadingDeleteCustomBreak.value = true;
    await CustomBreakService.deleteCustomStatusType({
      statusUuid: props.customBreak.uuid,
    });
    customBreaks.value = customBreaks.value.filter(
      (customBreak) => customBreak.uuid !== props.customBreak.uuid,
    );
    UnnnicCallAlert({
      props: {
        text: t('config_chats.custom_breaks.delete_modal.success'),
        type: 'success',
      },
      seconds: 5,
    });
    emit('close');
  } catch (error) {
    console.error('error delete custom break', error);
    UnnnicCallAlert({
      props: {
        text: t('config_chats.custom_breaks.delete_modal.error'),
        type: 'error',
      },
      seconds: 5,
    });
  } finally {
    isLoadingDeleteCustomBreak.value = false;
  }
};
</script>

<style lang="scss" scoped>
.delete-custom-break-modal {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    padding: $unnnic-space-6;
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
  }
}
</style>

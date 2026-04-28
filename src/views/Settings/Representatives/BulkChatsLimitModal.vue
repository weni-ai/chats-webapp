<template>
  <UnnnicDialog v-model:open="open">
    <UnnnicDialogContent>
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('config_chats.representatives.bulk_chats_limit_modal.title') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="bulk-chats-limit-modal__content">
        <UnnnicDisclaimer
          :description="
            $t(
              'config_chats.representatives.bulk_chats_limit_modal.disclaimer',
              { count: props.representatives.length },
            )
          "
        />
        <UnnnicInput
          v-model="limit"
          :label="
            $t(
              'config_chats.representatives.bulk_chats_limit_modal.input.label',
            )
          "
          :tooltip="{
            text: $t(
              'config_chats.representatives.bulk_chats_limit_modal.input.tooltip',
            ),
          }"
          :message="
            $t(
              'config_chats.representatives.bulk_chats_limit_modal.input.helper',
            )
          "
          :placeholder="
            $t(
              'config_chats.representatives.bulk_chats_limit_modal.input.placeholder',
            )
          "
        />
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('cancel')"
          type="tertiary"
          :disabled="isLoadingSave"
          @click="emit('update:modelValue', false)"
        />
        <UnnnicButton
          :text="$t('save')"
          type="primary"
          :loading="isLoadingSave"
          :disabled="!validLimit"
          @click="save"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

import RepresentativeService from '@/services/api/resources/settings/representative';

import { UnnnicCallAlert, UnnnicToastManager } from '@weni/unnnic-system';

import i18n from '@/plugins/i18n';

import { handleConnectOverlay } from '@/utils/overlay';

import type { Representative } from './types';

defineOptions({
  name: 'BulkChatsLimitModal',
});

interface Props {
  modelValue: boolean;
  representatives: Representative[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  success: [void];
}>();

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const limit = ref('');
const isLoadingSave = ref(false);

const validLimit = computed(() => {
  return !!limit.value && Number(limit.value) >= 0;
});

const save = async () => {
  try {
    isLoadingSave.value = true;
    const body = {
      representatives: props.representatives.map(
        (representative) => representative.email,
      ),
      toRemove: [],
      toAdd: [],
      chatsLimit: {
        is_active: true,
        total: Number(limit.value),
      },
    };
    await RepresentativeService.updateRepresentativeQueuePermission(body);

    UnnnicCallAlert({
      props: {
        text: i18n.global.t('config_chats.representatives.save_success'),
        type: 'success',
      },
    });
    emit('success');
  } catch (error) {
    console.error('Error saving chats limit', error);
    UnnnicToastManager.error(
      i18n.global.t('config_chats.representatives.save_error'),
      '',
      {
        button: {
          text: i18n.global.t('try_again'),
          action: () => save(),
        },
      },
    );
  } finally {
    isLoadingSave.value = false;
  }
};

onMounted(() => {
  handleConnectOverlay(true);
});

onUnmounted(() => {
  handleConnectOverlay(false);
});
</script>

<style lang="scss" scoped>
.bulk-chats-limit-modal {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    padding: $unnnic-space-6;
  }
}
</style>

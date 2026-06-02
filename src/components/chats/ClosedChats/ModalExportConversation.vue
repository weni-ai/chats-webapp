<template>
  <UnnnicDialog v-model:open="isOpen">
    <UnnnicDialogContent size="medium">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('export_conversation.title') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>

      <section class="modal-export-conversation__content">
        <section class="modal-export-conversation__radio-group">
          <p class="modal-export-conversation__label">
            {{ $t('export_conversation.select_format') }}
          </p>
          <section class="modal-export-conversation__radios">
            <UnnnicRadio
              :modelValue="selectedFormat"
              :value="EXPORT_TYPES.PDF"
              size="md"
              @update:model-value="selectedFormat = $event"
            >
              PDF
            </UnnnicRadio>
            <UnnnicRadio
              :modelValue="selectedFormat"
              :value="EXPORT_TYPES.HTML"
              size="md"
              @update:model-value="selectedFormat = $event"
            >
              HTML
            </UnnnicRadio>
          </section>
        </section>

        <UnnnicDisclaimer
          type="attention"
          :description="$t('export_conversation.disclaimer')"
        />

        <UnnnicCheckbox
          v-model="acceptedTerms"
          :textRight="$t('export_conversation.accept_terms')"
          data-testid="export-conversation-accept-terms"
        />
      </section>

      <UnnnicDialogFooter>
        <UnnnicDialogClose>
          <UnnnicButton
            :text="$t('cancel')"
            type="tertiary"
            :disabled="isLoading"
          />
        </UnnnicDialogClose>
        <UnnnicButton
          :text="$t('export_conversation.button')"
          type="primary"
          :loading="isLoading"
          :disabled="!acceptedTerms"
          data-testid="export-conversation-submit"
          @click="handleExport"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { unnnicCallAlert } from '@weni/unnnic-system';

import History from '@/services/api/resources/chats/history';
import i18n from '@/plugins/i18n';

const EXPORT_TYPES = {
  PDF: 'PDF',
  HTML: 'HTML',
} as const;

type ExportType = (typeof EXPORT_TYPES)[keyof typeof EXPORT_TYPES];

const props = defineProps<{
  modelValue: boolean;
  roomId: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const selectedFormat = ref<ExportType>(EXPORT_TYPES.PDF);
const acceptedTerms = ref(false);
const isLoading = ref(false);

const isOpen = computed({
  get() {
    return props.modelValue;
  },
  set(value: boolean) {
    emit('update:modelValue', value);
    if (!value) {
      resetState();
    }
  },
});

function resetState() {
  selectedFormat.value = EXPORT_TYPES.PDF;
  acceptedTerms.value = false;
}

async function handleExport() {
  isLoading.value = true;

  try {
    await History.exportRoom({
      room: props.roomId,
      types: [selectedFormat.value],
    });

    unnnicCallAlert({
      props: {
        text: i18n.global.t('export_conversation.success_title'),
        description: i18n.global.t('export_conversation.success_description'),
        type: 'success',
      },
      seconds: 5,
    });

    isOpen.value = false;
  } catch {
    unnnicCallAlert({
      props: {
        text: i18n.global.t('export_conversation.error'),
        type: 'error',
      },
      seconds: 5,
    });
  } finally {
    isLoading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.modal-export-conversation {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    padding: $unnnic-space-6;
  }

  &__radio-group {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
  }

  &__label {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
  }

  &__radios {
    display: flex;
    flex-wrap: wrap;
    gap: $unnnic-space-4 $unnnic-space-6;

    :deep(> *) {
      flex: 1 0 0;
      min-width: 0;
    }
  }
}
</style>

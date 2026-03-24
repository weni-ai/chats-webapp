<template>
  <UnnnicDialog
    v-model:open="open"
    data-testid="feedback-modal"
  >
    <UnnnicDialogContent>
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('chats.transcription.feedback.modal.title') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="transcription-feedback-modal__content">
        <div
          v-if="isLoadingCategories"
          class="transcription-feedback-modal__content--loading"
        >
          <UnnnicSkeletonLoading
            v-for="i in 6"
            :key="`skeleton-${i}`"
            tag="div"
            width="100px"
            height="32px"
          />
        </div>
        <TagGroup
          v-else
          v-model="feedbackSelectedCategory"
          :tags="feedbackCategories"
          selectable
        />
        <UnnnicTextArea
          v-model="feedbackText"
          :placeholder="
            $t('chats.transcription.feedback.modal.input_placeholder')
          "
          :label="$t('other')"
          :maxLength="150"
          data-testid="feedback-textarea"
        />
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('cancel')"
          type="tertiary"
          data-testid="modal-close"
          @click="handleCancel"
        />
        <UnnnicButton
          :text="$t('submit')"
          :loading="isLoadingSubmit"
          :disabled="disableSubmit"
          data-testid="modal-confirm-button"
          @click="handleSubmit"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { UnnnicCallAlert } from '@weni/unnnic-system';

import TagGroup from '@/components/TagGroup.vue';

import audioTranscriptionService from '@/services/api/resources/chats/audioTranscription';

import i18n from '@/plugins/i18n';

defineOptions({
  name: 'TranscriptionFeedbackModal',
});

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  messageUuid: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close', 'update:modelValue']);

const feedbackText = ref('');
const feedbackSelectedCategory = ref([]);
const isLoadingSubmit = ref(false);
const isLoadingCategories = ref(false);
const feedbackCategories = ref([]);

const disableSubmit = computed(() => {
  return (
    feedbackSelectedCategory.value.length === 0 &&
    feedbackText.value.length === 0
  );
});

onMounted(() => {
  getFeedbackCategory();
});

const open = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

watch(
  () => i18n.global.locale,
  () => {
    getFeedbackCategory();
  },
);

const getFeedbackCategory = async () => {
  try {
    isLoadingCategories.value = true;
    const { results } =
      await audioTranscriptionService.getAudioTranscriptionFeedbackTags();
    feedbackCategories.value = Object.entries(results).map(([key, value]) => ({
      name: value,
      uuid: key,
    }));
  } catch (error) {
    console.error('Error getting feedback categories', error);
    emit('close', { reset: true });
  } finally {
    isLoadingCategories.value = false;
  }
};
const handleCancel = () => {
  emit('close', { reset: true });
};
const handleSubmit = async () => {
  isLoadingSubmit.value = true;
  try {
    await audioTranscriptionService.sendAudioTranscriptionFeedback(
      props.messageUuid,
      {
        liked: false,
        tags: feedbackSelectedCategory.value.map((category) => category.uuid),
        text: feedbackText.value,
      },
    );
    UnnnicCallAlert({
      props: {
        text: i18n.global.t('chats.transcription.feedback.sended'),
        type: 'success',
      },
      seconds: 5,
    });
    emit('close');
  } catch (error) {
    console.error('Error sending transcription feedback', error);
    UnnnicCallAlert({
      props: {
        text: i18n.global.t('chats.transcription.feedback.error'),
        type: 'error',
      },
      seconds: 5,
    });
  } finally {
    isLoadingSubmit.value = false;
  }
};
</script>

<style lang="scss" scoped>
.transcription-feedback-modal {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-6;
    padding: $unnnic-space-6;
    &--loading {
      display: flex;
      gap: $unnnic-space-2;
      flex-wrap: wrap;
    }
  }
}
</style>

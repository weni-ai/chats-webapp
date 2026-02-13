<template>
  <UnnnicDialog
    v-model:open="open"
    class="modal-feedback"
  >
    <UnnnicDialogContent size="large">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>{{ $t('feedback_modal.title') }}</UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-feedback__content">
        <p class="modal-feedback__content-title">
          {{ $t('feedback_modal.feedback_question') }}
        </p>

        <section class="modal-feedback__content-form">
          <section
            v-for="option in feedbackOptions"
            :key="option.label"
            class="modal-feedback__content-form-item"
            :class="{
              'modal-feedback__content-form-item-selected':
                selectedFeedback === option.value,
            }"
            :data-testid="`feedback-option-${option.value}`"
            @click="selectedFeedback = option.value"
          >
            <UnnnicIcon
              size="md"
              :icon="option.icon"
              scheme="weni-800"
            />
            <p class="modal-feedback__content-form-item-label">
              {{ $t(option.label) }}
            </p>
          </section>
        </section>
        <section
          v-if="selectedFeedback"
          class="modal-feedback__content-form-description"
          data-testid="feedback-description-section"
        >
          <UnnnicTextArea
            v-model="feedbackDescription"
            :label="$t(feedbackDescriptionLabel)"
            :placeholder="$t('feedback_modal.placeholder_feedback')"
            :maxLength="1000"
            data-testid="input-feedback"
          />
        </section>
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('feedback_modal.cancel')"
          type="tertiary"
          @click="closeModal()"
        />
        <UnnnicButton
          :text="$t('feedback_modal.submit')"
          type="primary"
          :disabled="!isSelected"
          :loading="isLoading"
          @click="submitFeedback()"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import feedbackService from '@/services/api/resources/chats/feedback';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import i18n from '@/plugins/i18n';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const open = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const emit = defineEmits(['update:modelValue', 'close']);

const selectedFeedback = ref(null);
const feedbackDescription = ref('');
const isLoading = ref(false);

const feedbackOptions = [
  {
    label: 'feedback_modal.feedback_options.negative',
    icon: 'sentiment_dissatisfied',
    value: 1,
  },
  {
    label: 'feedback_modal.feedback_options.neutral',
    icon: 'sentiment_neutral',
    value: 2,
  },
  {
    label: 'feedback_modal.feedback_options.positive',
    icon: 'sentiment_satisfied',
    value: 3,
  },
];

const isSelected = computed(() => {
  return selectedFeedback.value !== null;
});

const feedbackDescriptionLabel = computed(() => {
  if (['negative', 'neutral'].includes(selectedFeedback.value)) {
    return 'feedback_modal.problem_question';
  }

  return 'feedback_modal.improvement_question';
});

const closeModal = () => {
  emit('update:modelValue', false);
  emit('close');
};

const submitFeedback = async () => {
  isLoading.value = true;
  try {
    await feedbackService.createFeedback({
      rating: selectedFeedback.value,
      comment: feedbackDescription.value,
    });
    closeModal();
  } catch (error) {
    console.error('Error submitting feedback', error);
    callUnnnicAlert({
      props: {
        text: i18n.global.t('feedback_modal.default_error_message'),
        type: 'error',
      },
      seconds: 5,
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.modal-feedback {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;
    padding: $unnnic-space-6;

    &-title {
      color: $unnnic-color-neutral-cloudy;

      font-family: $unnnic-font-family-secondary;
      font-size: $unnnic-font-size-body-gt;
      font-weight: $unnnic-font-weight-regular;
      line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
    }

    &-form {
      display: flex;
      justify-content: center;
      gap: 40px;

      &-item {
        display: flex;
        width: 56px;
        padding: $unnnic-spacing-nano;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        background-color: $unnnic-color-weni-50;
        border-radius: $unnnic-border-width-thick;
        cursor: pointer;

        &-selected {
          background-color: $unnnic-color-weni-200;
        }

        &:hover {
          background-color: $unnnic-color-weni-100;
        }

        &-label {
          color: $unnnic-color-weni-800;
          font-family: $unnnic-font-family-secondary;
          font-size: $unnnic-font-size-body-md;
          font-weight: $unnnic-font-weight-regular;
          line-height: $unnnic-font-size-body-md + $unnnic-line-height-md;
        }
      }
    }
  }
}
</style>

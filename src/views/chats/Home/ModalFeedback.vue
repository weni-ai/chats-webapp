<template>
  <UnnnicModalDialog
    :modelValue="modelValue"
    class="modal-feedback"
    showCloseIcon
    showActionsDivider
    :title="$t('feedback_modal.title')"
    :primaryButtonProps="{
      text: $t('feedback_modal.submit'),
      disabled: !isSelected,
    }"
    :secondaryButtonProps="{ text: $t('feedback_modal.cancel') }"
    size="lg"
    data-testid="feedback-modal"
    @primary-button-click="submitFeedback()"
    @secondary-button-click="closeModal()"
    @update:model-value="closeModal()"
  >
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
  </UnnnicModalDialog>
</template>

<script setup>
import { ref, computed } from 'vue';

defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'close']);

const selectedFeedback = ref(null);
const feedbackDescription = ref('');

const feedbackOptions = [
  {
    label: 'feedback_modal.feedback_options.negative',
    icon: 'sentiment_dissatisfied',
    value: 'negative',
  },
  {
    label: 'feedback_modal.feedback_options.neutral',
    icon: 'sentiment_neutral',
    value: 'neutral',
  },
  {
    label: 'feedback_modal.feedback_options.positive',
    icon: 'sentiment_satisfied',
    value: 'positive',
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
};

const submitFeedback = () => {
  console.log('submitFeedback');
};
</script>

<style lang="scss" scoped>
.modal-feedback {
  &__content {
    display: flex;
    flex-direction: column;
    gap: 16px;

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
        padding: 4px;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        background-color: $unnnic-color-weni-50;
        border-radius: 4px;
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

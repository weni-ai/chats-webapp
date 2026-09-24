<template>
  <UnnnicDialog
    v-model:open="open"
    class="ai-feedback-modal"
    data-testid="ai-feedback-modal"
  >
    <UnnnicDialogContent size="medium">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('contact_info.desk_copilot.feedback.title') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="ai-feedback-modal__content">
        <section
          v-if="isLoadingTags"
          class="ai-feedback-modal__tags-loading"
          data-testid="ai-feedback-modal-tags-loading"
        >
          <UnnnicSkeletonLoading
            v-for="index in 6"
            :key="`skeleton-${index}`"
            tag="div"
            width="100px"
            height="32px"
          />
        </section>
        <section
          v-else
          class="ai-feedback-modal__tags"
          data-testid="ai-feedback-modal-tags"
        >
          <UnnnicChip
            v-for="tag in tags"
            :key="tag.uuid"
            type="multiple"
            isClickable
            :isSelected="isTagSelected(tag)"
            :text="tag.name"
            :data-testid="`tag__${tag.uuid}`"
            @click="toggleTag(tag)"
          />
        </section>
        <UnnnicTextArea
          v-model="feedbackText"
          :placeholder="$t('contact_info.desk_copilot.feedback.placeholder')"
          :label="$t('contact_info.desk_copilot.feedback.other')"
          :maxLength="150"
          data-testid="ai-feedback-modal-textarea"
        />
      </section>
      <UnnnicDialogFooter>
        <UnnnicDialogClose>
          <UnnnicButton
            :text="$t('cancel')"
            type="tertiary"
            :disabled="isSubmitting"
            data-testid="ai-feedback-modal-cancel"
            @click="handleCancel"
          />
        </UnnnicDialogClose>
        <UnnnicButton
          :text="$t('submit')"
          type="primary"
          :disabled="disableSubmit"
          :loading="isSubmitting"
          data-testid="ai-feedback-modal-submit"
          @click="handleSubmit"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

export type AiFeedbackTag = {
  uuid: string;
  name: string;
};

defineOptions({
  name: 'AiFeedbackModal',
});

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    tags?: AiFeedbackTag[];
    isLoadingTags?: boolean;
    isSubmitting?: boolean;
  }>(),
  {
    tags: () => [],
    isLoadingTags: false,
    isSubmitting: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [payload: { tags: string[]; text: string }];
  cancel: [];
}>();

const selectedTags = ref<AiFeedbackTag[]>([]);
const feedbackText = ref('');

const open = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
    if (!value) {
      emit('cancel');
    }
  },
});

const disableSubmit = computed(
  () =>
    props.isSubmitting ||
    props.isLoadingTags ||
    (selectedTags.value.length === 0 && feedbackText.value.trim().length === 0),
);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      selectedTags.value = [];
      feedbackText.value = '';
    }
  },
);

function isTagSelected(tag: AiFeedbackTag) {
  return selectedTags.value.some((item) => item.uuid === tag.uuid);
}

function toggleTag(tag: AiFeedbackTag) {
  if (isTagSelected(tag)) {
    selectedTags.value = selectedTags.value.filter(
      (item) => item.uuid !== tag.uuid,
    );
    return;
  }

  selectedTags.value = [...selectedTags.value, tag];
}

function handleCancel() {
  open.value = false;
}

function handleSubmit() {
  if (disableSubmit.value) {
    return;
  }

  emit('submit', {
    tags: selectedTags.value.map((tag) => tag.uuid),
    text: feedbackText.value.trim(),
  });
}
</script>

<style lang="scss" scoped>
.ai-feedback-modal {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    padding: $unnnic-space-6;
  }

  &__tags,
  &__tags-loading {
    display: flex;
    flex-wrap: wrap;
    gap: $unnnic-space-3;
    width: 100%;
  }
}
</style>

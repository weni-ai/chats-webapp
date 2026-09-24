<template>
  <UnnnicDialog
    v-model:open="open"
    class="ai-feedback-modal"
    data-testid="ai-feedback-modal"
  >
    <UnnnicDialogContent>
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
        <TagGroup
          v-else
          v-model="selectedTags"
          :tags="tags"
          selectable
          flex
          data-testid="ai-feedback-modal-tags"
        />
        <UnnnicTextArea
          v-model="feedbackText"
          :placeholder="$t('contact_info.desk_copilot.feedback.placeholder')"
          :label="$t('contact_info.desk_copilot.feedback.other')"
          :maxLength="150"
          data-testid="ai-feedback-modal-textarea"
        />
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('cancel')"
          type="tertiary"
          :disabled="isSubmitting"
          data-testid="ai-feedback-modal-cancel"
          @click="handleCancel"
        />
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
import TagGroup from '@/components/TagGroup.vue';

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
    gap: $unnnic-space-6;
    padding: $unnnic-space-6;
    overflow-y: auto;
  }

  &__tags-loading {
    display: flex;
    flex-wrap: wrap;
    gap: $unnnic-space-2;
  }
}
</style>

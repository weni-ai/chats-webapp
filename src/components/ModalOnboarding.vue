<!-- eslint-disable vue/no-v-html -->
<template>
  <UnnnicDialog v-model:open="open">
    <UnnnicDialogContent size="large">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          <header class="modal-onboarding__header">
            <UnnnicIcon
              icon="brand_awareness"
              size="avatar-nano"
            />
            {{ $t('onboarding.title') }}
          </header>
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-onboarding__content">
        <p v-html="$t(`onboarding.steps.step_${contentIndex}.content_1`)" />
        <p v-html="$t(`onboarding.steps.step_${contentIndex}.content_2`)" />
        <section class="modal-onboarding__image-container">
          <img
            :src="showImage"
            class="modal-onboarding__image"
          />
        </section>
        <p
          v-if="contentIndex === 5"
          class="modal-onboarding__ended-text"
          v-html="$t(`onboarding.ended_text`)"
        />
        <nav class="modal-onboarding__nav">
          <UnnnicButton
            v-if="contentIndex > 1"
            iconCenter="arrow-left-1-1"
            type="tertiary"
            size="small"
            @click="contentIndex = contentIndex - 1"
          />
          <UnnnicButton
            v-for="i in 5"
            :key="i"
            :text="i"
            :type="i === contentIndex ? 'secondary' : 'tertiary'"
            size="small"
            @click="contentIndex = i"
          />
          <UnnnicButton
            v-if="contentIndex < 5"
            iconCenter="arrow-right-1-1"
            type="tertiary"
            size="small"
            @click="contentIndex = contentIndex + 1"
          />
        </nav>
      </section>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup>
import { ref, computed } from 'vue';

import guide1 from '@/assets/onboarding/step1.gif';
import guide2 from '@/assets/onboarding/step2.gif';
import guide3 from '@/assets/onboarding/step3.gif';
import guide4 from '@/assets/onboarding/step4.gif';
import guide5 from '@/assets/onboarding/step5.gif';

defineOptions({
  name: 'ModalNewContactInfoVisual',
});
const emit = defineEmits(['update:modelValue']);
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
const contentIndex = ref(1);
const showImage = computed(() => {
  const map = {
    1: guide1,
    2: guide2,
    3: guide3,
    4: guide4,
    5: guide5,
  };
  return map[contentIndex.value];
});
</script>

<style lang="scss">
.modal-onboarding {
  &__header {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
  }
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    padding: $unnnic-space-6;
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
  }
  &__image {
    max-width: 100%;
    border-radius: $unnnic-radius-1;
    box-shadow: 0 $unnnic-space-1 $unnnic-space-1 0 rgba(0, 0, 0, 0.25);

    &-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
    }
  }
  &__nav {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: $unnnic-space-2;
  }
  &__ended-text {
    > .link {
      color: $unnnic-color-fg-base;

      &:visited {
        color: $unnnic-color-fg-base;
      }
    }
  }
}
</style>

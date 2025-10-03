<!-- eslint-disable vue/no-v-html -->
<template>
  <UnnnicModalDialog
    v-if="props.modelValue"
    :modelValue="props.modelValue"
    :title="$t('new_feature_internal_note.title')"
    showCloseIcon
    icon="brand_awareness"
    size="lg"
    persistent
    @update:model-value="$emit('update:modelValue', false)"
  >
    <section class="modal-new-contact-info-visual__content">
      <template v-if="contentIndex === 1">
        <p v-html="$t('new_contact_info_visual.content_1.text_1')"></p>
        <p v-html="$t('new_contact_info_visual.content_1.text_2')"></p>
      </template>
      <template v-if="contentIndex === 2">
        <p v-html="$t('new_contact_info_visual.content_2.text_1')"></p>
      </template>
      <template v-if="contentIndex === 3">
        <p v-html="$t('new_contact_info_visual.content_3.text_1')"></p>
        <p v-html="$t('new_contact_info_visual.content_3.text_2')"></p>
        <p v-html="$t('new_contact_info_visual.content_3.text_3')"></p>
      </template>
      <section class="modal-new-contact-info-visual__image-container">
        <img
          :src="showImage"
          class="modal-new-contact-info-visual__image"
        />
      </section>
      <nav class="modal-new-contact-info-visual__nav">
        <UnnnicButton
          v-if="contentIndex > 1"
          iconCenter="arrow-left-1-1"
          type="tertiary"
          size="small"
          @click="contentIndex = contentIndex - 1"
        />
        <UnnnicButton
          v-for="i in 3"
          :key="i"
          :text="i"
          :type="i === contentIndex ? 'secondary' : 'tertiary'"
          size="small"
          @click="contentIndex = i"
        />
        <UnnnicButton
          v-if="contentIndex < 3"
          iconCenter="arrow-right-1-1"
          type="tertiary"
          size="small"
          @click="contentIndex = contentIndex + 1"
        />
      </nav>
    </section>
  </UnnnicModalDialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import guide1 from '@/assets/new-contact-info-1.gif';
import guide2 from '@/assets/new-contact-info-2.gif';
import guide3 from '@/assets/new-contact-info-3.gif';

defineOptions({
  name: 'ModalNewContactInfoVisual',
});
defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const contentIndex = ref(1);

const showImage = computed(() => {
  const map = {
    1: guide1,
    2: guide2,
    3: guide3,
  };
  return map[contentIndex.value];
});
</script>

<style lang="scss" scoped>
.modal-new-contact-info-visual {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
  }
  &__image {
    max-width: 513px;
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
}
</style>

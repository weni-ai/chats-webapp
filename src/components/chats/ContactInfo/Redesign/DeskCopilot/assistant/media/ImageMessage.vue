<template>
  <section
    class="image-message"
    data-testid="assistant-image-message"
  >
    <a
      class="image-message__link"
      :href="src"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        class="image-message__image"
        :src="src"
        :alt="
          filename || $t('contact_info.desk_copilot.assistant.image_attachment')
        "
      />
    </a>
  </section>
</template>

<script setup lang="ts">
defineOptions({
  name: 'AssistantImageMessage',
});

withDefaults(
  defineProps<{
    src: string;
    filename?: string;
  }>(),
  {
    filename: undefined,
  },
);
</script>

<style lang="scss" scoped>
.image-message {
  max-width: 100%;
  overflow: hidden;
  border: 1px solid $unnnic-color-border-base;
  border-radius: $unnnic-radius-2;
  background-color: $unnnic-color-bg-base;

  &__link {
    display: block;
  }

  &__image {
    display: block;
    max-width: 100%;
    max-height: 240px;
    object-fit: contain;
  }
}
</style>

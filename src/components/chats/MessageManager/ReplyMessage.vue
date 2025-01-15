<template>
  <section
    v-if="replyMessage"
    :class="`reply-message reply-message--${props.replyMessage.user ? 'you' : 'contact'}`"
  >
    <section class="reply-message__message-container">
      <p
        :class="`reply-message__contact-name reply-message__contact-name--${props.replyMessage.user ? 'you' : 'contact'}`"
      >
        {{
          props.replyMessage.user ? $t('you') : props.replyMessage.contact.name
        }}
      </p>
      <section class="reply-message__content">
        <p
          v-if="props.replyMessage.content_type === 'text'"
          class="reply-message__content-text"
        >
          {{ props.replyMessage.text }}
        </p>

        <template v-if="props.replyMessage.content_type === 'attachment'">
          <UnnnicIcon
            icon="article"
            size="avatar-nano"
          />
          <p>
            {{
              props.replyMessage.media[0]?.url?.split('/').at(-1) ||
              props.replyMessage.media[0]?.file?.name
            }}
          </p>
        </template>
        <template v-if="props.replyMessage.content_type === 'image'">
          <UnnnicIcon
            icon="image"
            size="avatar-nano"
          />
          <p>
            {{ $t('image') }}
          </p>
        </template>
        <template v-if="props.replyMessage.content_type === 'video'">
          <UnnnicIcon
            icon="videocam"
            size="avatar-nano"
          />
          <p>
            {{ $t('video') }}
          </p>
        </template>
        <template v-if="props.replyMessage.content_type === 'audio'">
          <UnnnicIcon
            icon="mic"
            size="avatar-nano"
          />
          <p>{{ $t('audio_message') }} {{ audioDuration }}</p>
          <audio
            :id="props.replyMessage.uuid"
            :src="props.replyMessage.media[0].url"
            preload="metadata"
          ></audio>
        </template>
      </section>
    </section>
    <section
      v-if="hasPreview"
      :class="{ 'reply-message__media-preview': true, right: hasPreview }"
    >
      <img
        v-if="props.replyMessage.content_type === 'image'"
        :src="props.replyMessage.media[0].url"
        style="object-fit: contain"
        width="100%"
        height="100%"
      />
      <video
        v-if="props.replyMessage.content_type === 'video'"
        :src="props.replyMessage.media[0].url"
        preload="metadata"
        style="object-fit: contain"
        width="100%"
        height="100%"
      />
    </section>
    <UnnnicIcon
      :class="{ right: !hasPreview }"
      icon="close"
      clickable
      @click="$emit('close')"
    />
  </section>
</template>

<script setup>
import { computed, onUpdated, ref } from 'vue';

const props = defineProps({
  replyMessage: { type: [Object, null], required: true },
});

defineEmits(['close']);

const audioDuration = ref('');

const hasPreview = computed(() =>
  ['image', 'video'].includes(props.replyMessage?.content_type),
);

onUpdated(() => {
  const audio = document.getElementById(props.replyMessage?.uuid);
  if (audio)
    audio.addEventListener(
      'loadedmetadata',
      () => {
        const duration = Math.round(audio.duration);

        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);

        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        audioDuration.value = formattedTime;
      },
      { once: true },
    );
});
</script>

<style lang="scss" scoped>
.right {
  margin-left: auto;
}
.reply-message {
  display: flex;
  background-color: $unnnic-color-neutral-lightest;

  padding: $unnnic-spacing-xs;
  gap: $unnnic-spacing-nano;

  border-radius: $unnnic-border-radius-sm;
  box-shadow: 0px 2px 5px -1px rgba(0, 0, 0, 0.1);

  &--you {
    border-left: 2px solid $unnnic-color-weni-600;
  }

  &--contact {
    border-left: 2px solid $unnnic-color-aux-purple-500;
  }

  &__message-container {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-nano;
  }

  &__contact-name {
    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-bold;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;

    &--you {
      color: $unnnic-color-weni-600;
    }

    &--contact {
      color: $unnnic-color-aux-purple-500;
    }
  }

  &__content {
    display: flex;
    align-items: center;
    gap: $unnnic-spacing-nano;

    color: $unnnic-color-neutral-dark;

    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
  }

  &__media-preview {
    width: 50px;
    height: 50px;
  }
}
</style>

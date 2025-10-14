<template>
  <div
    class="scrollable"
    data-testid="audios-scrollable"
  >
    <section
      v-if="!isLoadingAudios"
      class="audios__content"
      data-testid="audios-content"
    >
      <UnnnicToolTip
        v-for="audio in audios"
        :key="audio.url"
        :text="audioTooltipText(audio)"
        side="top"
        enabled
        data-testid="audio-tooltip"
      >
        <UnnnicAudioRecorder
          data-testid="audio-recorder"
          class="audios__content__audio"
          :src="audio.url"
          :canDiscard="false"
        />
      </UnnnicToolTip>
    </section>
    <section
      v-else
      class="audios__content--loading"
      data-testid="audios-content-loading"
    >
      <UnnnicSkeletonLoading
        v-for="audio in 8"
        :key="`audio-${audio}`"
      />
    </section>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import i18n from '@/plugins/i18n';
import moment from 'moment';
import { useContactInfos } from '@/store/modules/chats/contactInfos';

const props = defineProps({
  room: {
    type: Object,
    default: () => {},
  },
  contactInfo: {
    type: Object,
    default: () => {},
  },
  history: {
    type: Boolean,
    default: false,
  },
});

const contactInfosStore = useContactInfos();
const { audios, hasAudios, isLoadingAudios } = storeToRefs(contactInfosStore);

const audioTooltipText = (audio) => {
  return i18n.global.t('contact_info.audio_tooltip', {
    agent: audio.sender || '',
    date: moment(audio.created_on).format('L'),
    time: moment(audio.created_on).format('LT'),
  });
};

onMounted(async () => {
  if (!hasAudios.value && !isLoadingAudios.value) {
    await contactInfosStore.loadAudios({
      contact: props.room?.contact?.uuid,
      room: props.room?.uuid,
      history: props.history,
      contactInfo: props.contactInfo?.uuid,
    });
  }
});
</script>

<style lang="scss" scoped>
.audios__content {
  display: grid;
  gap: $unnnic-spacing-sm;

  &__audio {
    padding: $unnnic-spacing-sm;
  }

  &--loading {
    display: grid;
    gap: $unnnic-spacing-sm;
  }
}

.audio-text {
  font-size: 0.75rem;
  color: $unnnic-color-neutral-dark;
}
</style>

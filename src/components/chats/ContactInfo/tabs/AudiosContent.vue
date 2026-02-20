<template>
  <section
    ref="scrollContainer"
    class="audios__container"
    data-testid="audios-container"
  >
    <section
      v-if="hasAudios || isLoadingAudios"
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

      <template v-if="isLoadingAudios">
        <UnnnicSkeletonLoading
          v-for="skeleton in 8"
          :key="`skeleton-${skeleton}`"
        />
      </template>
    </section>
    <section
      v-else
      class="audios__empty"
      data-testid="audios-empty"
    >
      <p>{{ $t('no_audios_found') }}</p>
    </section>
  </section>
</template>

<script setup>
import { onMounted, ref, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useInfiniteScroll, useResizeObserver } from '@vueuse/core';
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

const scrollContainer = ref(null);
const contactInfosStore = useContactInfos();
const { audios, hasAudios, isLoadingAudios, hasMoreAudios } =
  storeToRefs(contactInfosStore);

const audioTooltipText = (audio) => {
  return i18n.global.t('contact_info.audio_tooltip', {
    agent: audio.sender || '',
    date: moment(audio.created_on).format('L'),
    time: moment(audio.created_on).format('LT'),
  });
};

const loadMoreAudios = async () => {
  if (!hasMoreAudios.value || isLoadingAudios.value) return;

  if (!props.history) {
    await contactInfosStore.loadNextAudios({
      contact: props.room?.contact?.uuid,
      room: props.room?.uuid,
    });
  } else {
    await contactInfosStore.loadNextAudiosClosedRoom({
      contactInfo: props.contactInfo?.uuid,
    });
  }
};

const checkAndLoadMore = async () => {
  await nextTick();

  if (!scrollContainer.value || isLoadingAudios.value || !hasMoreAudios.value) {
    return;
  }

  const container = scrollContainer.value;
  const hasScroll = container.scrollHeight > container.clientHeight;

  if (!hasScroll && hasMoreAudios.value && audios.value.length > 0) {
    await loadMoreAudios();
    await checkAndLoadMore();
  }
};

useInfiniteScroll(scrollContainer, loadMoreAudios, {
  distance: 10,
  canLoadMore: () => hasMoreAudios.value && !isLoadingAudios.value,
});

watch(
  () => audios.value.length,
  async () => {
    if (!isLoadingAudios.value) {
      await checkAndLoadMore();
    }
  },
  { flush: 'post' },
);

watch(isLoadingAudios, async (loading) => {
  if (!loading) {
    await checkAndLoadMore();
  }
});

useResizeObserver(scrollContainer, async () => {
  if (!isLoadingAudios.value && hasAudios.value) {
    await checkAndLoadMore();
  }
});

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
.audios__container {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: $unnnic-spacing-xs;
}

.audios__content {
  display: grid;
  gap: $unnnic-spacing-sm;

  &__audio {
    padding: $unnnic-spacing-sm;
  }
}

.audios__empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: $unnnic-spacing-md;
  color: $unnnic-color-neutral-cloudy;
}

.audio-text {
  font-size: 0.75rem;
  color: $unnnic-color-neutral-dark;
}
</style>

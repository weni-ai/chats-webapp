<template>
  <div
    class="scrollable"
    data-testid="audios-scrollable"
  >
    <section
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import i18n from '@/plugins/i18n';
import Media from '@/services/api/resources/chats/media';
import moment from 'moment';

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

const page = ref(1);
const audios = ref([]);

const audioTooltipText = (audio) => {
  return i18n.global.t('contact_info.audio_tooltip', {
    agent: audio.sender || '',
    date: moment(audio.created_on).format('L'),
    time: moment(audio.created_on).format('LT'),
  });
};

const loadNextMedias = async () => {
  const response = await Media.listFromContactAndRoom({
    contact: props.room.contact.uuid,
    room: props.room.uuid,
    ordering: 'content_type',
    content_type: 'audio',
    page: page.value,
  });

  const newAudios = await Promise.all(
    response.results
      .filter((media) => media.content_type.startsWith('audio/'))
      .map(
        (element) =>
          new Promise((resolve) => {
            const url = new Audio(element.url);
            url.onloadedmetadata = (event) => {
              if (event.path) {
                const { duration } = event.path[0];
                resolve({ ...element, duration });
              } else {
                const duration = Math.round(url.duration);
                resolve({ ...element, duration });
              }
            };
          }),
      ),
  );

  audios.value = audios.value.concat(newAudios);

  page.value += 1;

  if (response.next) {
    loadNextMedias();
  }
};

const loadNextMediasClosedRoom = async () => {
  const response = await Media.listFromContactAndClosedRoom({
    ordering: 'content_type',
    contact: props.contactInfo.uuid,
    content_type: 'audio',
    page: page.value,
  });

  const newAudios = await Promise.all(
    response.results
      .filter((media) => media.content_type.startsWith('audio/'))
      .map(
        (element) =>
          new Promise((resolve) => {
            const url = new Audio(element.url);
            url.onloadedmetadata = (event) => {
              if (event.path) {
                const { duration } = event.path[0];
                resolve({ ...element, duration });
              } else {
                const duration = Math.round(url.duration);
                resolve({ ...element, duration });
              }
            };
          }),
      ),
  );

  audios.value = audios.value.concat(newAudios);

  page.value += 1;

  if (response.next) {
    loadNextMediasClosedRoom();
  }
};

onMounted(async () => {
  if (!props.history) {
    await loadNextMedias();
  } else {
    await loadNextMediasClosedRoom();
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
}

.audio-text {
  font-size: 0.75rem;
  color: $unnnic-color-neutral-dark;
}
</style>

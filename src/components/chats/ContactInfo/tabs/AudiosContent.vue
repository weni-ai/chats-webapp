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

<script>
import Media from '@/services/api/resources/chats/media';
import moment from 'moment';

export default {
  name: 'AudiosContent',

  props: {
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
  },

  data() {
    return {
      page: 1,
      audios: [],
    };
  },

  async created() {
    if (!this.history) {
      await this.loadNextMedias();
    } else {
      await this.loadNextMediasClosedRoom();
    }
  },

  methods: {
    audioTooltipText(audio) {
      return this.$t('contact_info.audio_tooltip', {
        agent: audio.sender || '',
        date: moment(audio.created_on).format('L'),
        time: moment(audio.created_on).format('LT'),
      });
    },

    async loadNextMedias() {
      const response = await Media.listFromContactAndRoom({
        contact: this.room.contact.uuid,
        room: this.room.uuid,
        ordering: 'content_type',
        page: this.page,
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

      this.audios = this.audios.concat(newAudios);

      this.page += 1;

      if (response.next) {
        this.loadNextMedias();
      }
    },

    async loadNextMediasClosedRoom() {
      const response = await Media.listFromContactAndClosedRoom({
        ordering: 'content_type',
        contact: this.contactInfo.uuid,
        content_type: 'audio',
        page: this.page,
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

      this.audios = this.audios.concat(newAudios);

      this.page += 1;

      if (response.next) {
        this.loadNextMediasClosedRoom();
      }
    },
  },
};
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

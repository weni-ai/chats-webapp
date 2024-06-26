<template>
  <UnnnicTab
    size="md"
    v-model="tab"
    :tabs="tabs"
  >
    <template #tab-head-media>
      <div
        class="media-tab"
        :class="{ active: isActiveTab('media') }"
      >
        <span class="name">{{ $t('medias') }}</span>
      </div>
    </template>

    <template #tab-panel-media>
      <section class="medias__content">
        <MediaPreview
          v-for="(media, index) in images"
          :key="media.created_on + index"
          :src="media.url"
          :isVideo="media.content_type.startsWith('video/')"
          @click="$emit('fullscreen', media.url, images)"
        />
      </section>
    </template>

    <template #tab-head-docs>
      <div
        class="media-tab"
        :class="{ active: isActiveTab('docs') }"
      >
        <span class="name">{{ $t('docs') }}</span>
      </div>
    </template>

    <template #tab-panel-docs>
      <section class="documents__content">
        <UnnnicChatsMessage
          v-for="document in documents"
          :key="document.url"
          :time="new Date(document.created_on)"
          :documentName="treatedMediaName(document.url)"
          @click="download(document.url)"
        />
      </section>
    </template>
    <template #tab-head-audio>
      <div
        class="media-tab"
        :class="{ active: isActiveTab('audio') }"
      >
        <span class="name">{{ $t('audios') }}</span>
      </div>
    </template>
    <template #tab-panel-audio>
      <div class="scrollable">
        <section class="audios__content">
          <UnnnicToolTip
            v-for="audio in audios"
            :key="audio.url"
            :text="audioTooltipText(audio)"
            side="top"
            enabled
          >
            <UnnnicAudioRecorder
              class="audios__content__audio"
              :src="audio.url"
              :canDiscard="false"
            />
          </UnnnicToolTip>
        </section>
      </div>
    </template>
  </UnnnicTab>
</template>

<script>
import Media from '@/services/api/resources/chats/media';
import MediaPreview from '@/components/chats/MediaMessage/Previews/Media.vue';
import moment from 'moment';

export default {
  name: 'ContactMedia',

  components: {
    MediaPreview,
  },

  props: {
    room: {
      type: Object,
    },
    contactInfo: {
      type: Object,
    },
    history: {
      type: Boolean,
      default: false,
    },
  },

  async created() {
    if (!this.history) {
      await this.loadNextMedias();
    } else {
      await this.loadNextMediasClosedRoom();
    }

    this.$emit('loaded-medias');
  },

  data: () => ({
    tab: 'media',
    tabs: ['media', 'docs', 'audio'],
    page: 1,

    medias: [],
    audios: [],
    audioWithDuration: [],
    currentAudio: null,
    audioDuration: null,
  }),

  computed: {
    images() {
      return this.medias.filter(
        (media) =>
          media.content_type.startsWith('image/') ||
          media.content_type.startsWith('video/'),
      );
    },

    documents() {
      return this.medias.filter(
        (media) =>
          !(
            media.content_type.startsWith('image/') ||
            media.content_type.startsWith('video/')
          ),
      );
    },
  },

  methods: {
    isActiveTab(tab) {
      return tab === this.tab;
    },

    audioTooltipText(audio) {
      return this.$t('contact_info.audio_tooltip', {
        agent: audio.sender || '',
        date: moment(audio.created_on).format('L'),
        time: moment(audio.created_on).format('LT'),
      });
    },

    treatedMediaName(mediaName) {
      if (mediaName) {
        return mediaName.split('/')?.at(-1);
      }

      throw new Error(
        'Pass as a parameter the name of the media you want to handle',
      );
    },

    download(url) {
      try {
        const mediaName = this.treatedMediaName(url);

        Media.download({ media: url, name: mediaName });
      } catch (error) {
        console.error(
          'An error occurred when trying to download the media:',
          error,
        );
      }
    },

    async loadNextMedias() {
      const response = await Media.listFromContactAndRoom({
        contact: this.room.contact.uuid,
        room: this.room.uuid,
        ordering: 'content_type',
        page: this.page,
      });
      this.audios = await Promise.all(
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
      this.medias = this.medias.concat(
        response.results.filter(
          (media) => !media.content_type.startsWith('audio/'),
        ),
      );

      this.page += 1;

      if (response.next) {
        this.loadNextMedias();
      }
    },
    async loadNextMediasClosedRoom() {
      const response = await Media.listFromContactAndClosedRoom({
        ordering: 'content_type',
        contact: this.contactInfo.uuid,
        page: this.page,
      });
      this.audios = await Promise.all(
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
      this.medias = this.medias.concat(
        response.results.filter(
          (media) => !media.content_type.startsWith('audio/'),
        ),
      );

      this.page += 1;

      if (response.next) {
        this.loadNextMediasClosedRoom();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.medias__content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
  gap: $unnnic-spacing-xs;
}

.documents__content {
  display: grid;
  gap: $unnnic-spacing-nano;

  :deep(.unnnic-chats-message.is-document) {
    .unnnic-chats-message__time {
      display: none;
    }
  }
}

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

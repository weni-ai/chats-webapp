<template>
  <unnnic-tab v-model="tab" :tabs="tabs">
    <template slot="tab-head-media">
      <div class="media-tab" :class="{ active: isActiveTab('media') }">
        <span class="name">{{ $t('media') }}</span>
      </div>
    </template>

    <template slot="tab-panel-media">
      <section class="medias__content">
        <media-preview
          v-for="(media, index) in images"
          :key="media.created_on + index"
          :src="media.url"
          :is-video="media.content_type.startsWith('video/')"
          @click="$emit('fullscreen', media.url, images)"
        />
      </section>
    </template>

    <template slot="tab-head-docs">
      <div class="media-tab" :class="{ active: isActiveTab('docs') }">
        <span class="name">{{ $t('docs') }}</span>
      </div>
    </template>

    <template slot="tab-panel-docs">
      <section class="documents__content">
        <unnnic-chats-message
          v-for="document in documents"
          :key="document.url"
          :time="new Date(document.created_on)"
          :documentName="treatedMediaName(document.url)"
          @click="download(document.url)"
        />
      </section>
    </template>
    <template slot="tab-head-audio">
      <div class="media-tab" :class="{ active: isActiveTab('audio') }">
        <span class="name">{{ $t('audio') }}</span>
      </div>
    </template>
    <template slot="tab-panel-audio">
      <div class="scrollable">
        <section class="audios__content">
          <unnnic-tool-tip
            v-for="audio in audios"
            :key="audio.url"
            :text="audioTooltipText(audio)"
            side="top"
            enabled
          >
            <unnnic-audio-recorder
              class="audios__content__audio"
              :src="audio.url"
              :canDiscard="false"
            />
          </unnnic-tool-tip>
        </section>
      </div>
    </template>
  </unnnic-tab>
</template>

<script>
import Media from '@/services/api/resources/chats/media';
import MediaPreview from '@/components/chats/MediaMessage/Previews/Media';
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

  created() {
    if (!this.history) {
      this.loadNextMedias();
    } else {
      this.loadNextMediasClosedRoom();
    }
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
          media.content_type.startsWith('image/') || media.content_type.startsWith('video/'),
      );
    },

    documents() {
      return this.medias.filter(
        (media) =>
          !(media.content_type.startsWith('image/') || media.content_type.startsWith('video/')),
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

      throw new Error('Pass as a parameter the name of the media you want to handle');
    },

    download(url) {
      try {
        const mediaName = this.treatedMediaName(url);

        Media.download({ media: url, name: mediaName });
      } catch (error) {
        console.error('An error occurred when trying to download the media:', error);
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
        response.results.filter((media) => !media.content_type.startsWith('audio/')),
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
        response.results.filter((media) => !media.content_type.startsWith('audio/')),
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
.media-tab {
  display: flex;
  align-items: center;
  gap: $unnnic-spacing-stack-xs;

  &.active {
    .name {
      color: $unnnic-color-neutral-dark;
    }
  }

  .name {
    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-cloudy;
  }
}

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

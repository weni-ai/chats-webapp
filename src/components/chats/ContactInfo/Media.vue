<template>
  <unnnic-tab v-model="tab" :tabs="tabs">
    <template slot="tab-head-media">
      <div class="media-tab" :class="{ active: isActiveTab('media') }">
        <span class="name">{{ $t('media') }}</span>
      </div>
    </template>

    <template slot="tab-panel-media">
      <section class="media__content">
        <div v-for="media in images" :key="media.url" class="media__content__media">
          <div class="media__content__media__preview">
            <image-preview
              v-if="media.content_type.startsWith('image/')"
              v-bind="media"
              fullscreen-on-click
              object-fit="cover"
              :url="media.url"
              @click="$emit('fullscreen', media.url, images)"
            />
            <video-preview
              v-if="media.content_type.startsWith('video/')"
              :src="media.url"
              fullscreen-on-click
              @click="$emit('fullscreen', media.url, images)"
            />
          </div>
        </div>
      </section>
    </template>

    <template slot="tab-head-docs">
      <div class="media-tab" :class="{ active: isActiveTab('docs') }">
        <span class="name">{{ $t('docs') }}</span>
      </div>
    </template>

    <template slot="tab-panel-docs">
      <section class="documents__content">
        <document-preview
          v-for="document in documents"
          :type="document.content_type"
          size="sm"
          :key="document.url"
          :src="document.url"
          :fullFilename="document.url"
          class="documents__content__document"
          @download="download(document.url)"
        />
      </section>
    </template>
    <template slot="tab-head-audio">
      <div class="media-tab" :class="{ active: isActiveTab('audio') }">
        <span class="name">{{ $t('audio') }}</span>
      </div>
    </template>
    <template slot="tab-panel-audio">
      <div class="scrollable" style="background-color: #ffff">
        <section class="media__content_audio">
          <div
            v-for="audio in audios"
            :key="audio.url"
            class="media__content_audio__media"
            style="display: flex; width: 100%"
          >
            <div style="width: 6%">
              <audio-preview :currentAudio="audio.url"></audio-preview>
            </div>
            <div style="width: 94%">
              <span
                >Enviado por {{ audio.sender }} |
                {{ audio.duration == 'Infinity' ? 0 : audio.duration }}s
              </span>
              <!-- <span class="audio-text">
                Áudio enviado | {{ audio.duration == 'Infinity' ? 0 : audio.duration }}s
              </span> -->
            </div>
          </div>
        </section>
      </div>
    </template>
  </unnnic-tab>
</template>

<script>
import DocumentPreview from '@/components/chats/MediaMessage/Previews/Document';
import ImagePreview from '@/components/chats/MediaMessage/Previews/Image';
import AudioPreview from '@/components/chats/MediaMessage/Previews/Audio';
import Media from '@/services/api/resources/chats/media';
import VideoPreview from '@/components/chats/MediaMessage/Previews/Video';

export default {
  name: 'ContactMedia',

  components: {
    DocumentPreview,
    ImagePreview,
    AudioPreview,
    VideoPreview,
  },

  props: {
    room: {
      type: Object,
    },
  },

  created() {
    this.loadNextMedias();
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

    download(url) {
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', true);
      document.body.appendChild(a);
      a.click();
      a.parentNode.removeChild(a);
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
                  const { duration } = event.path[0];
                  resolve({ ...element, duration });
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
      color: $unnnic-color-aux-purple;
    }
  }

  .name {
    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-cloudy;
  }
}

.media__content {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $unnnic-spacing-stack-xs;

  max-width: 100%;

  &__media {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;

    &__preview {
      height: 100%;
      width: 100%;
    }
  }
}
.documents__content {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-xs;

  &__document {
    padding-bottom: 0.25rem;
    border-bottom: solid 1px $unnnic-color-neutral-soft;
  }
}

.media__content_audio {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: $unnnic-spacing-stack-xs;

  max-width: 100%;

  &__media {
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: solid 1px $unnnic-color-neutral-soft;
    // aspect-ratio: 1;

    &__preview {
      height: 100%;
      width: 15%;
    }
  }
  .scrollable {
    overflow-y: auto;
    height: 100%;
    background-color: #ffff;
  }
}

.audio-text {
  font-size: 0.75rem;
  color: $unnnic-color-neutral-dark;
}
</style>

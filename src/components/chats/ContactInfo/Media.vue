<template>
  <UnnnicTab
    v-model="tab"
    size="md"
    :tabs="tabs"
  >
    <template #tab-head-notes>
      <div
        class="notes-tab"
        :class="{ active: isActiveTab('notes') }"
        data-testid="note-tab-notes"
      >
        <span class="name">{{ $t('notes') }}</span>
      </div>
    </template>

    <template #tab-panel-notes>
      <section
        class="notes__content"
        data-testid="notes-content"
      >
        <ChatInternalNote
          v-for="note in roomInternalNotes"
          :key="note.uuid"
          class="chat-internal-note"
          :message="note"
          @click="handleInternalNoteClick(note)"
        />
      </section>
    </template>
    <template #tab-head-media>
      <div
        class="media-tab"
        :class="{ active: isActiveTab('media') }"
        data-testid="media-tab-medias"
      >
        <span class="name">{{ $t('medias') }}</span>
      </div>
    </template>

    <template #tab-panel-media>
      <section
        class="medias__content"
        data-testid="medias-content"
      >
        <MediaPreview
          v-for="(media, index) in images"
          :key="media.created_on + index"
          :src="media.url"
          :isVideo="media.content_type.startsWith('video/')"
          data-testid="media-preview"
          @click="$emit('fullscreen', media.url, images)"
        />
      </section>
    </template>

    <template #tab-head-docs>
      <div
        class="media-tab"
        :class="{ active: isActiveTab('docs') }"
        data-testid="media-tab-docs"
      >
        <span class="name">{{ $t('docs') }}</span>
      </div>
    </template>

    <template #tab-panel-docs>
      <section
        class="documents__content"
        data-testid="documents-content"
      >
        <UnnnicChatsMessage
          v-for="document in documents"
          :key="document.url"
          :time="new Date(document.created_on)"
          :documentName="treatedMediaName(document.url)"
          data-testid="document-message"
          @click="download(document.url)"
        />
      </section>
    </template>
    <template #tab-head-audio>
      <div
        class="media-tab"
        :class="{ active: isActiveTab('audio') }"
        data-testid="media-tab-audios"
      >
        <span class="name">{{ $t('audios') }}</span>
      </div>
    </template>
    <template #tab-panel-audio>
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
  </UnnnicTab>
</template>

<script>
import { mapState } from 'pinia';
import Media from '@/services/api/resources/chats/media';
import MediaPreview from '@/components/chats/MediaMessage/Previews/Media.vue';
import ChatInternalNote from '@/components/chats/chat/ChatMessages/ChatMessagesInternalNote.vue';

import { useRoomMessages } from '@/store/modules/chats/roomMessages';

import moment from 'moment';

export default {
  name: 'ContactMedia',

  components: {
    MediaPreview,
    ChatInternalNote,
  },

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
  emits: ['fullscreen', 'loaded-medias'],

  data() {
    return {
      tab: 'notes',
      tabs: ['notes', 'media', 'docs', 'audio'],
      page: 1,
      medias: [],
      audios: [],
      audioWithDuration: [],
      currentAudio: null,
      audioDuration: null,
    };
  },

  computed: {
    ...mapState(useRoomMessages, ['roomInternalNotes']),
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

  async created() {
    if (!this.history) {
      await this.loadNextMedias();
    } else {
      await this.loadNextMediasClosedRoom();
    }

    this.$emit('loaded-medias');
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
    handleInternalNoteClick(note) {
      // TODO: scroll to the note
    },
  },
};
</script>

<style lang="scss" scoped>
.notes__content {
  .chat-internal-note {
    cursor: pointer;
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

<template>
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

<script>
import Media from '@/services/api/resources/chats/media';

export default {
  name: 'DocumentsContent',

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
      medias: [],
    };
  },

  computed: {
    documents() {
      return this.medias.filter(
        (media) =>
          !media.content_type.startsWith('image/') &&
          !media.content_type.startsWith('video/') &&
          !media.content_type.startsWith('audio/'),
      );
    },
  },

  async created() {
    if (!this.history) {
      await this.loadNextMedias();
    } else {
      await this.loadNextMediasClosedRoom();
    }
  },

  methods: {
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

      this.medias = this.medias.concat(
        response.results.filter(
          (media) =>
            !media.content_type.startsWith('image/') &&
            !media.content_type.startsWith('video/') &&
            !media.content_type.startsWith('audio/'),
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
        content_type: 'application',
        page: this.page,
      });

      this.medias = this.medias.concat(
        response.results.filter(
          (media) =>
            !media.content_type.startsWith('image/') &&
            !media.content_type.startsWith('video/') &&
            !media.content_type.startsWith('audio/'),
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
.documents__content {
  display: grid;
  gap: $unnnic-spacing-nano;

  :deep(.unnnic-chats-message.is-document) {
    .unnnic-chats-message__time {
      display: none;
    }
  }
}
</style>

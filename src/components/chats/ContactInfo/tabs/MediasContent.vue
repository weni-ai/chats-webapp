<template>
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

<script>
import Media from '@/services/api/resources/chats/media';
import MediaPreview from '@/components/chats/MediaMessage/Previews/Media.vue';

export default {
  name: 'MediasContent',

  components: {
    MediaPreview,
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

  emits: ['fullscreen'],

  data() {
    return {
      page: 1,
      medias: [],
    };
  },

  computed: {
    images() {
      return this.medias.filter(
        (media) =>
          media.content_type.startsWith('image/') ||
          media.content_type.startsWith('video/'),
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
    async loadNextMedias() {
      const response = await Media.listFromContactAndRoom({
        contact: this.room.contact.uuid,
        room: this.room.uuid,
        ordering: 'content_type',
        content_type: 'image/video',
        page: this.page,
      });

      this.medias = this.medias.concat(
        response.results.filter(
          (media) =>
            media.content_type.startsWith('image/') ||
            media.content_type.startsWith('video/'),
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
        content_type: 'image/video',
      });

      this.medias = this.medias.concat(
        response.results.filter(
          (media) =>
            media.content_type.startsWith('image/') ||
            media.content_type.startsWith('video/'),
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
</style>

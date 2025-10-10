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

<script setup>
import { ref, computed, onMounted } from 'vue';
import Media from '@/services/api/resources/chats/media';
import MediaPreview from '@/components/chats/MediaMessage/Previews/Media.vue';

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

defineEmits(['fullscreen']);

const page = ref(1);
const medias = ref([]);

const images = computed(() => {
  return medias.value.filter(
    (media) =>
      media.content_type.startsWith('image/') ||
      media.content_type.startsWith('video/'),
  );
});

const loadNextMedias = async () => {
  const response = await Media.listFromContactAndRoom({
    contact: props.room.contact.uuid,
    room: props.room.uuid,
    ordering: 'content_type',
    content_type: 'image/video',
    page: page.value,
  });

  medias.value = medias.value.concat(
    response.results.filter(
      (media) =>
        media.content_type.startsWith('image/') ||
        media.content_type.startsWith('video/'),
    ),
  );

  page.value += 1;

  if (response.next) {
    loadNextMedias();
  }
};

const loadNextMediasClosedRoom = async () => {
  const response = await Media.listFromContactAndClosedRoom({
    ordering: 'content_type',
    contact: props.contactInfo.uuid,
    page: page.value,
    content_type: 'image/video',
  });

  medias.value = medias.value.concat(
    response.results.filter(
      (media) =>
        media.content_type.startsWith('image/') ||
        media.content_type.startsWith('video/'),
    ),
  );

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
.medias__content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
  gap: $unnnic-spacing-xs;
}
</style>

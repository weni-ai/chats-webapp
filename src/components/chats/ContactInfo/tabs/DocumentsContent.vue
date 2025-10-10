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

<script setup>
import { ref, computed, onMounted } from 'vue';
import Media from '@/services/api/resources/chats/media';

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
const medias = ref([]);

const documents = computed(() => {
  return medias.value.filter(
    (media) =>
      !media.content_type.startsWith('image/') &&
      !media.content_type.startsWith('video/') &&
      !media.content_type.startsWith('audio/'),
  );
});

const treatedMediaName = (mediaName) => {
  if (mediaName) {
    return mediaName.split('/')?.at(-1);
  }

  throw new Error(
    'Pass as a parameter the name of the media you want to handle',
  );
};

const download = (url) => {
  try {
    const mediaName = treatedMediaName(url);

    Media.download({ media: url, name: mediaName });
  } catch (error) {
    console.error(
      'An error occurred when trying to download the media:',
      error,
    );
  }
};

const loadNextMedias = async () => {
  const response = await Media.listFromContactAndRoom({
    contact: props.room.contact.uuid,
    room: props.room.uuid,
    ordering: 'content_type',
    content_type: 'application',
    page: page.value,
  });

  medias.value = medias.value.concat(
    response.results.filter(
      (media) =>
        !media.content_type.startsWith('image/') &&
        !media.content_type.startsWith('video/') &&
        !media.content_type.startsWith('audio/'),
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
    content_type: 'application',
    page: page.value,
  });

  medias.value = medias.value.concat(
    response.results.filter(
      (media) =>
        !media.content_type.startsWith('image/') &&
        !media.content_type.startsWith('video/') &&
        !media.content_type.startsWith('audio/'),
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

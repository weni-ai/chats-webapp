<template>
  <section
    v-if="!isLoadingDocuments"
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
  <section
    v-else
    class="documents__content--loading"
    data-testid="documents-content-loading"
  >
    <UnnnicSkeletonLoading
      v-for="document in 8"
      :key="`document-${document}`"
    />
  </section>
</template>

<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import Media from '@/services/api/resources/chats/media';
import { useContactInfos } from '@/store/modules/chats/contactInfos';

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

const contactInfosStore = useContactInfos();
const {
  docs: documents,
  hasDocuments,
  isLoadingDocuments,
} = storeToRefs(contactInfosStore);

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

onMounted(async () => {
  if (!hasDocuments.value && !isLoadingDocuments.value) {
    await contactInfosStore.loadDocuments({
      contact: props.room?.contact?.uuid,
      room: props.room?.uuid,
      history: props.history,
      contactInfo: props.contactInfo?.uuid,
    });
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

  &--loading {
    display: grid;
    gap: $unnnic-spacing-sm;
  }
}
</style>

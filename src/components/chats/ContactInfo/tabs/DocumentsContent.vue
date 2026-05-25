<template>
  <section
    ref="scrollContainer"
    class="documents__container"
    data-testid="documents-container"
  >
    <section
      v-if="hasDocuments || isLoadingDocuments"
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

      <template v-if="isLoadingDocuments">
        <UnnnicSkeletonLoading
          v-for="skeleton in 8"
          :key="`skeleton-${skeleton}`"
        />
      </template>
    </section>
    <section
      v-else
      class="documents__empty"
      data-testid="documents-empty"
    >
      <p>{{ $t('no_documents_found') }}</p>
    </section>
  </section>
</template>

<script setup>
import { onMounted, ref, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useInfiniteScroll, useResizeObserver } from '@vueuse/core';
import Media from '@/services/api/resources/chats/media';
import { useContactInfos } from '@/store/modules/chats/contactInfos';
import { treatedMediaName } from '@/utils/medias';

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

const scrollContainer = ref(null);
const contactInfosStore = useContactInfos();
const {
  docs: documents,
  hasDocuments,
  isLoadingDocuments,
  hasMoreDocuments,
} = storeToRefs(contactInfosStore);

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

const loadMoreDocuments = async () => {
  if (!hasMoreDocuments.value || isLoadingDocuments.value) return;

  if (!props.history) {
    await contactInfosStore.loadNextDocuments({
      contact: props.room?.contact?.uuid,
      room: props.room?.uuid,
    });
  } else {
    await contactInfosStore.loadNextDocumentsClosedRoom({
      contactInfo: props.contactInfo?.uuid,
    });
  }
};

const checkAndLoadMore = async () => {
  await nextTick();

  if (
    !scrollContainer.value ||
    isLoadingDocuments.value ||
    !hasMoreDocuments.value
  ) {
    return;
  }

  const container = scrollContainer.value;
  const hasScroll = container.scrollHeight > container.clientHeight;

  if (!hasScroll && hasMoreDocuments.value && documents.value.length > 0) {
    await loadMoreDocuments();
    await checkAndLoadMore();
  }
};

useInfiniteScroll(scrollContainer, loadMoreDocuments, {
  distance: 10,
  canLoadMore: () => hasMoreDocuments.value && !isLoadingDocuments.value,
});

watch(
  () => documents.value.length,
  async () => {
    if (!isLoadingDocuments.value) {
      await checkAndLoadMore();
    }
  },
  { flush: 'post' },
);

watch(isLoadingDocuments, async (loading) => {
  if (!loading) {
    await checkAndLoadMore();
  }
});

useResizeObserver(scrollContainer, async () => {
  if (!isLoadingDocuments.value && hasDocuments.value) {
    await checkAndLoadMore();
  }
});

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
.documents__container {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: $unnnic-spacing-xs;
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

.documents__empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: $unnnic-spacing-md;
  color: $unnnic-color-neutral-cloudy;
}
</style>

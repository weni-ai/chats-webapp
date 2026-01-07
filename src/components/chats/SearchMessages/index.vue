<template>
  <AsideSlotTemplate
    class="search-messages-container"
    :close="() => emit('close')"
  >
    <template #header>
      <header class="search-messages__header">
        <p>{{ $t('chats.search_messages.title') }}</p>
        <UnnnicButton
          iconCenter="close"
          type="tertiary"
          size="small"
          @click="emit('close')"
        />
      </header>
    </template>
    <AsideSlotTemplateSection class="search-messages__content">
      <section class="search-messages__container">
        <UnnnicInput
          v-model="searchTerm"
          iconLeft="search-1"
          :placeholder="$t('chats.search_messages.input_placeholder')"
        />
        <section
          v-if="searchTerm"
          class="search-messages__results-label-container"
        >
          <UnnnicIcon
            icon="search"
            size="ant"
          />
          <p v-if="matchedMessages.length === 0">
            {{ $t('chats.search_messages.no_results', { searchTerm }) }}
          </p>
          <p v-else>
            {{
              $t('chats.search_messages.results_found', {
                count: matchedMessages.length,
                searchTerm,
              })
            }}
          </p>
        </section>
        <HighlightMessageCard
          v-for="message in matchedMessages"
          :key="message.uuid"
          :message="message"
          :searchTerm="searchTerm"
        />
      </section>
    </AsideSlotTemplateSection>
  </AsideSlotTemplate>
</template>

<script setup>
import { computed, ref } from 'vue';
import { watchDebounced } from '@vueuse/core';

import { useRoomMessages } from '@/store/modules/chats/roomMessages';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';
import HighlightMessageCard from './HighlightMessageCard.vue';

defineOptions({
  name: 'SearchMessages',
});

const emit = defineEmits(['close']);

const roomMessagesStore = useRoomMessages();

const isLoading = ref(false);

const searchTerm = ref('');

watchDebounced(
  searchTerm,
  () => {
    const { roomMessagesNext, getAllRoomsMessages } = roomMessagesStore;
    if (roomMessagesNext) getAllRoomsMessages();
  },
  { debounce: 500, maxWait: 1000 },
);

const matchedMessages = computed(() => {
  if (!searchTerm.value) {
    return [];
  }

  const messagesWithSender = roomMessagesStore.roomMessages.filter(
    (message) => {
      return !!(message.user || message.contact);
    },
  );
  return messagesWithSender.filter((message) => {
    return message.text.toLowerCase().includes(searchTerm.value.toLowerCase());
  });
});
</script>

<style lang="scss" scoped>
.search-messages {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $unnnic-space-4 $unnnic-space-2;
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
    border-bottom: 1px solid $unnnic-color-border-soft;
  }
  &__content {
    height: 100%;
    width: 100%;

    display: flex;
    flex-direction: column;

    overflow: auto;
  }
  &__container {
    padding: $unnnic-space-3 $unnnic-space-2 $unnnic-space-2 $unnnic-space-2;
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
  }
  &__results-label-container {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
    padding: 0 $unnnic-space-4;

    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
    font-style: italic;
  }
}
</style>

<template>
  <AsideSlotTemplate
    class="search-messages-container"
    :close="() => emit('close')"
  >
    <template #header>
      <header
        class="search-messages__header"
        data-testid="search-messages-header"
      >
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
          ref="searchInputRef"
          v-model="searchTerm"
          iconLeft="search-1"
          :placeholder="$t('chats.search_messages.input_placeholder')"
        />
        <section
          v-if="searchTerm"
          class="search-messages__results-label-container"
          data-testid="search-messages-results-label"
        >
          <UnnnicIcon
            icon="search"
            size="ant"
            scheme="gray-500"
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
        <section
          v-if="isLoadingAllMessages"
          class="search-messages__loading"
        >
          <p class="search-messages__loading__text">
            {{ $t('chats.search_messages.loading') }}
          </p>
          <span
            v-for="i in 3"
            :key="i"
            class="search-messages__loading__dot"
          />
        </section>
        <HighlightMessageCard
          v-for="message in matchedMessages"
          :key="message.uuid"
          :message="message"
          :searchTerm="searchTerm"
          @click="handleMessageClick(message)"
        />
      </section>
    </AsideSlotTemplateSection>
  </AsideSlotTemplate>
</template>

<script setup>
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import { watchDebounced } from '@vueuse/core';

import { useRoomMessages } from '@/store/modules/chats/roomMessages';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';
import HighlightMessageCard from './HighlightMessageCard.vue';

import { isValidJson } from '@/utils/messages';
import { normalizeText } from '@/utils/string';
import { storeToRefs } from 'pinia';

defineOptions({
  name: 'SearchMessages',
});

const emit = defineEmits(['close']);

const roomMessagesStore = useRoomMessages();

const { isLoadingAllMessages } = storeToRefs(roomMessagesStore);

const searchTerm = ref('');
const searchInputRef = useTemplateRef('searchInputRef');

onMounted(() => {
  searchInputRef.value.$el.children[0].children[0].focus();
});

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

  const validMessages = roomMessagesStore.roomMessages.filter((message) => {
    return !isValidJson(message.text);
  });

  const normalizedSearchTerm = normalizeText(searchTerm.value);

  return validMessages.filter((message) => {
    const normalizedMessageText = normalizeText(message.text);
    return normalizedMessageText.includes(normalizedSearchTerm);
  });
});

const handleMessageClick = (message) => {
  roomMessagesStore.toScrollMessage = message;
};
</script>

<style lang="scss" scoped>
.search-messages {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $unnnic-space-2;
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
  &__loading {
    display: flex;
    font: $unnnic-font-caption-2;
    color: $unnnic-color-fg-emphasized;
    align-items: baseline;
    justify-content: center;

    @keyframes wave {
      0%,
      60%,
      100% {
        transform: initial;
      }

      30% {
        transform: translateY(-3px);
      }
    }

    &__dot {
      display: inline-block;
      width: $unnnic-space-05;
      height: $unnnic-space-05;
      border-radius: 50%;
      margin-right: $unnnic-space-05;
      background-color: $unnnic-color-fg-emphasized;
      animation: wave 1.5s linear infinite;

      &:first-of-type {
        margin-left: $unnnic-space-05;
      }

      &:nth-child(2) {
        animation-delay: 0.9s;
      }

      &:nth-child(3) {
        animation-delay: 1.2s;
      }
    }
  }
}
</style>

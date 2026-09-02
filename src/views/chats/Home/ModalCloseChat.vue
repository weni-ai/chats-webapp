<template>
  <UnnnicDialog v-model:open="open">
    <UnnnicDialogContent :size="hasNoSectorTags ? 'medium' : 'large'">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{
            hasNoSectorTags ? $t('end_chat') : $t('chats.to_end_rate_the_chat')
          }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>

      <template v-if="hasNoSectorTags">
        <section class="modal-close-chat__content">
          <p class="modal-close-chat__confirm-text">
            {{ $t('close_chat.confirm_end') }}
          </p>
        </section>
      </template>

      <template v-else>
        <section class="modal-close-chat__content">
          <UnnnicDisclaimer
            v-if="isInvalidRequiredTags && !isLoadingTags"
            class="modal-close-chat__disclaimer"
            type="attention"
            :description="$t('chats.to_end_required_tags')"
          />
          <UnnnicInput
            v-model="tagsFilter"
            iconLeft="search"
            :placeholder="$t('tags.search')"
          />
          <section
            ref="tagsListContainer"
            class="modal-close-chat__tags-list"
          >
            <ChatClassifier
              v-model="tags"
              :tags="sectorTags"
              :loading="isLoadingTags && sectorTags.length === 0"
              @update:to-remove-tags="(value) => (toRemoveTags = value)"
              @update:to-add-tags="(value) => (toAddTags = value)"
            />
            <UnnnicIconLoading
              v-if="isLoadingTags && sectorTags.length > 0"
              class="modal-close-chat__tags-loading"
            />
          </section>
        </section>
      </template>

      <UnnnicDialogFooter>
        <UnnnicDialogClose>
          <UnnnicButton
            :text="$t('cancel')"
            type="tertiary"
            :disabled="isLoadingCloseRoom"
          />
        </UnnnicDialogClose>
        <UnnnicButton
          data-testid="close-chat-button"
          :text="hasNoSectorTags ? $t('end') : $t('end_chat')"
          type="primary"
          :loading="isLoadingCloseRoom"
          :disabled="isInvalidRequiredTags"
          @click="closeRoom()"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup>
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import { useInfiniteScroll, watchDebounced } from '@vueuse/core';

import Room from '@/services/api/resources/chats/room';
import Queue from '@/services/api/resources/settings/queue';
import ChatClassifier from '@/components/chats/ChatClassifier.vue';

import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomCounters } from '@/store/modules/chats/roomCounters';
import { useFeedback } from '@/store/modules/feedback';

import {
  markPendingClose,
  unmarkPendingClose,
} from '@/services/api/websocket/listeners/room/update';

import feedbackService from '@/services/api/resources/chats/feedback';

const TAGS_PAGE_SIZE = 20;

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['close', 'update:modelValue']);

const roomsStore = useRooms();
const counters = useRoomCounters();
const { setIsRenderFeedbackModal } = useFeedback();

const tags = ref([]);
const roomTagsNext = ref('');
const sectorTags = ref([]);
const sectorTagsNext = ref('');
const isLoadingTags = ref(true);
const isLoadingCloseRoom = ref(false);
const isShowFeedback = ref(false);
const hasAvailableTags = ref(false);
const hasCheckedTagsAvailability = ref(false);
const toRemoveTags = ref([]);
const toAddTags = ref([]);
const tagsFilter = ref('');
const tagsListContainer = useTemplateRef('tagsListContainer');
let loadTagsRequestId = 0;

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const hasNoSectorTags = computed(
  () => hasCheckedTagsAvailability.value && !hasAvailableTags.value,
);

const isInvalidRequiredTags = computed(
  () => props.room?.queue?.required_tags && tags.value.length === 0,
);

const canLoadMoreTags = computed(
  () => !!sectorTagsNext.value && !isLoadingTags.value,
);

async function classifyRoom({ reset = false } = {}) {
  const queueUuid = props.room?.queue?.uuid;
  if (!queueUuid) return;
  if (!reset && (isLoadingTags.value || !sectorTagsNext.value)) return;

  const requestId = ++loadTagsRequestId;
  isLoadingTags.value = true;

  if (reset) {
    sectorTags.value = [];
    sectorTagsNext.value = '';
  }

  try {
    const { results, next } = await Queue.tags(queueUuid, {
      limit: TAGS_PAGE_SIZE,
      next: reset ? '' : sectorTagsNext.value,
      search: tagsFilter.value,
    });

    if (requestId !== loadTagsRequestId) return;

    sectorTags.value = reset ? results : sectorTags.value.concat(results);
    sectorTagsNext.value = next || '';

    if (!tagsFilter.value) {
      hasAvailableTags.value =
        sectorTags.value.length > 0 || !!sectorTagsNext.value;
      hasCheckedTagsAvailability.value = true;
    }
  } catch (error) {
    console.error('Error classifying room', error);
    if (!tagsFilter.value) {
      hasCheckedTagsAvailability.value = true;
    }
  } finally {
    if (requestId === loadTagsRequestId) {
      isLoadingTags.value = false;
    }
  }
}

async function loadRoomTags({ reset = false } = {}) {
  try {
    if (reset) {
      tags.value = [];
      roomTagsNext.value = '';
    }

    const roomUuid = props.room?.uuid;
    if (!roomUuid) return;

    const { results, next } = await Room.getRoomTags(roomUuid, {
      next: roomTagsNext.value,
      limit: TAGS_PAGE_SIZE,
    });
    tags.value = tags.value.concat(results);
    roomTagsNext.value = next;

    if (roomTagsNext.value) {
      await loadRoomTags();
    }
  } catch (error) {
    console.error('Error loading room tags', error);
  }
}

async function closeRoom() {
  isLoadingCloseRoom.value = true;
  const { uuid } = props.room;

  markPendingClose(uuid);

  const tagsUuids = tags.value.map((tag) => tag.uuid);

  try {
    await Room.close(uuid, tagsUuids);
  } catch (error) {
    unmarkPendingClose(uuid);
    isLoadingCloseRoom.value = false;
    throw error;
  }

  const roomType = roomsStore.applyClose(uuid, props.room);
  if (roomType) {
    counters.handleClose(roomType);
    counters.clearTypeCache(uuid);
  }

  isLoadingCloseRoom.value = false;
  emit('close');

  if (isShowFeedback.value) {
    setIsRenderFeedbackModal(true);
  }
}

async function checkIsShowFeedback() {
  try {
    const response = await feedbackService.getIsShowFeedback();
    isShowFeedback.value = response.should_show_feedback_form;
  } catch (error) {
    console.error('Error checking is show feedback', error);
  }
}

useInfiniteScroll(
  tagsListContainer,
  () => {
    classifyRoom();
  },
  {
    distance: 40,
    canLoadMore: () => canLoadMoreTags.value,
  },
);

watchDebounced(
  tagsFilter,
  () => {
    if (!hasAvailableTags.value) return;
    classifyRoom({ reset: true });
  },
  { debounce: 400 },
);

onMounted(() => {
  classifyRoom({ reset: true });
  checkIsShowFeedback();
  loadRoomTags({ reset: true });
});

defineExpose({
  classifyRoom,
  closeRoom,
  sectorTags,
  tags,
  isLoadingTags,
  hasNoSectorTags,
  tagsFilter,
});
</script>

<style lang="scss" scoped>
.modal-close-chat {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    padding: $unnnic-space-6;
    overflow: auto;
  }

  &__confirm-text {
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-base;
    margin: 0;
  }

  &--mobile {
    :deep(.unnnic-modal-dialog__container) {
      width: 100%;
    }
  }

  &__tags-list {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
    overflow: hidden auto;
    max-height: 300px;
    scroll-snap-type: y proximity;
  }

  &__tags-loading {
    align-self: center;
  }
}
</style>

<template>
  <section
    class="about-support-card"
    data-testid="about-support-card"
  >
    <header class="about-support-card__header">
      <h3 class="about-support-card__title">
        {{ $t('contact_info.about_support') }}
      </h3>
      <section class="about-support-card__header-buttons">
        <UnnnicPopover
          v-if="showAddTagButton"
          :open="openDropdownTags"
          @update:open="openDropdownTags = $event"
        >
          <UnnnicPopoverTrigger>
            <UnnnicButton
              iconLeft="add-1"
              type="secondary"
              size="small"
            >
              {{ $t('tag') }}
            </UnnnicButton>
          </UnnnicPopoverTrigger>
          <UnnnicPopoverContent align="end">
            <UnnnicInput
              v-model="tagsFilter"
              iconLeft="search"
              :placeholder="$t('tags.search')"
              class="about-support-card__tags-dropdown-input"
            />
            <section
              ref="tagsListContainer"
              class="about-support-card__tags-dropdown"
            >
              <UnnnicCheckbox
                v-for="tag in allTags"
                :key="tag.uuid"
                :modelValue="
                  roomTags.some((roomTag) => roomTag.uuid === tag.uuid)
                "
                :textRight="tag.name"
                @change="handleTagClick(tag)"
              />
              <UnnnicIconLoading
                v-if="isLoadingTags"
                class="about-support-card__tags-loading"
              />
            </section>
          </UnnnicPopoverContent>
        </UnnnicPopover>
        <UnnnicToolTip
          enabled
          :text="$t('discussions.start_discussion.title')"
          side="left"
        >
          <UnnnicButton
            v-if="!isViewMode && !isMobile"
            iconCenter="communication"
            size="small"
            type="secondary"
            @click="handleModalStartDiscussion()"
          />
        </UnnnicToolTip>
      </section>
    </header>

    <section class="about-support-card__content">
      <TagGroup
        v-if="roomTags?.length > 0"
        class="about-support-card__tag-group"
        :modelValue="roomTags"
        :tags="roomTags"
        selectable
        :useCloseClick="tagUseCloseOnClick"
        @close="handleTagClick"
      />
      <ProtocolText :protocol="contactProtocol" />
      <CsatInfo
        v-if="closedRoom?.uuid"
        :note="closedRoom?.csat_note"
        :commentary="closedRoom?.csat_commentary"
      />
      <DiscussionsSession v-if="isHistory" />
    </section>

    <ModalStartDiscussion
      v-if="isShowModalStartDiscussion"
      v-model="isShowModalStartDiscussion"
      @close="handleModalStartDiscussion()"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useInfiniteScroll, watchDebounced } from '@vueuse/core';
import isMobileLib from 'is-mobile';

import TagGroup from '@/components/TagGroup.vue';
import ProtocolText from '../ProtocolText.vue';
import CsatInfo from '../CsatInfo.vue';
import DiscussionsSession from '../DiscussionsSession.vue';
import ModalStartDiscussion from '../ModalStartDiscussion.vue';

import { useRooms } from '@/store/modules/chats/rooms';
import Queues from '@/services/api/resources/settings/queue';
import Room from '@/services/api/resources/chats/room';

defineOptions({
  name: 'AboutSupportCard',
});

type RoomTag = {
  uuid: string;
  name: string;
};

type ClosedRoom = {
  uuid?: string;
  protocol?: string;
  csat_note?: number;
  csat_commentary?: string;
  [key: string]: unknown;
};

const props = withDefaults(
  defineProps<{
    closedRoom?: ClosedRoom;
    isHistory?: boolean;
    isViewMode?: boolean;
  }>(),
  {
    closedRoom: () => ({}),
    isHistory: false,
    isViewMode: false,
  },
);

const roomsStore = useRooms();
const {
  activeRoom: room,
  activeRoomTags: roomTags,
  activeRoomTagsNext: roomTagsNext,
} = storeToRefs(roomsStore);

const TAGS_PAGE_SIZE = 20;

const openDropdownTags = ref(false);
const allTags = ref<RoomTag[]>([]);
const allTagsNext = ref('');
const tagsFilter = ref('');
const isLoadingTags = ref(false);
const hasAvailableTags = ref(false);
const isShowModalStartDiscussion = ref(false);
const tagsListContainer = useTemplateRef<HTMLElement>('tagsListContainer');
let loadTagsRequestId = 0;

const isMobile = computed(() => isMobileLib());

const canManageTags = computed(
  () => !props.isHistory && !props.isViewMode && !!room.value?.user,
);

const showAddTagButton = computed(
  () => canManageTags.value && hasAvailableTags.value,
);

const tagUseCloseOnClick = computed(
  () => !props.isViewMode && !props.isHistory && !!room.value?.user,
);

const hideTagCloseIcon = computed(() =>
  props.isViewMode || props.isHistory || !room.value?.user ? 'none' : 'flex',
);

const contactProtocol = computed(
  () => (props.closedRoom || room.value)?.protocol || '',
);

const canLoadMoreTags = computed(
  () => !!allTagsNext.value && !isLoadingTags.value,
);

async function loadAllTags({ reset = false }: { reset?: boolean } = {}) {
  const { queue } = room.value || {};
  if (!queue) return;
  if (!reset && (isLoadingTags.value || !allTagsNext.value)) return;

  const requestId = ++loadTagsRequestId;
  isLoadingTags.value = true;

  if (reset) {
    allTags.value = [];
    allTagsNext.value = '';
  }

  try {
    const { results, next } = await Queues.tags(queue.uuid, {
      limit: TAGS_PAGE_SIZE,
      next: reset ? '' : allTagsNext.value,
      search: tagsFilter.value,
    });

    if (requestId !== loadTagsRequestId) return;

    allTags.value = reset ? results : allTags.value.concat(results);
    allTagsNext.value = next || '';

    if (!tagsFilter.value) {
      hasAvailableTags.value = allTags.value.length > 0 || !!allTagsNext.value;
    }
  } catch (error) {
    console.error('Error loading all tags', error);
  } finally {
    if (requestId === loadTagsRequestId) {
      isLoadingTags.value = false;
    }
  }
}

async function loadRoomTags({ reset = false }: { reset?: boolean } = {}) {
  try {
    if (reset) {
      roomTags.value = [];
      roomTagsNext.value = '';
    }

    const roomUuid = props.closedRoom?.uuid || room.value?.uuid;
    if (!roomUuid) return;

    const { results, next } = await Room.getRoomTags(roomUuid, {
      next: roomTagsNext.value,
      limit: TAGS_PAGE_SIZE,
    });
    roomTags.value = roomTags.value.concat(results);
    roomTagsNext.value = next;

    if (roomTagsNext.value) {
      await loadRoomTags();
    }
  } catch (error) {
    console.error('Error loading room tags', error);
  }
}

async function removeRoomTag(tag: RoomTag) {
  const previousTags = [...roomTags.value];
  try {
    await Room.removeRoomTag(room.value.uuid, tag.uuid);
    roomTags.value = roomTags.value.filter(
      (roomTag: RoomTag) => roomTag.uuid !== tag.uuid,
    );
  } catch (error) {
    roomTags.value = previousTags;
    console.log(error);
  }
}

async function addRoomTag(tag: RoomTag) {
  const previousTags = [...roomTags.value];
  try {
    await Room.addRoomTag(room.value.uuid, tag.uuid);
    roomTags.value.push(tag);
  } catch (error) {
    roomTags.value = previousTags;
    console.log(error);
  }
}

function handleTagClick(tag: RoomTag) {
  if (!room.value?.user) return;

  const hasSelectedTag = roomTags.value.some(
    (roomTag: RoomTag) => roomTag.uuid === tag.uuid,
  );

  if (hasSelectedTag) {
    removeRoomTag(tag);
  } else {
    addRoomTag(tag);
  }
}

function handleModalStartDiscussion() {
  isShowModalStartDiscussion.value = !isShowModalStartDiscussion.value;
}

useInfiniteScroll(
  tagsListContainer,
  () => {
    loadAllTags();
  },
  {
    distance: 40,
    canLoadMore: () => canLoadMoreTags.value,
  },
);

watch(
  () => room.value?.uuid,
  (newRoomUuid) => {
    if (!newRoomUuid) return;

    tagsFilter.value = '';
    hasAvailableTags.value = false;
    loadAllTags({ reset: true });
    loadRoomTags({ reset: true });
  },
  { immediate: true },
);

watchDebounced(
  tagsFilter,
  () => {
    if (!hasAvailableTags.value) return;
    loadAllTags({ reset: true });
  },
  { debounce: 400 },
);

onUnmounted(() => {
  roomTags.value = [];
  roomTagsNext.value = '';
});
</script>

<style lang="scss" scoped>
.about-support-card {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-3;
  padding: $unnnic-space-4;
  background-color: $unnnic-color-bg-base;
  border: 1px solid $unnnic-color-border-base;
  border-radius: $unnnic-radius-2;
  overflow: hidden;

  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;

    :deep(.about-support-card__tag-group) {
      margin-top: 0;

      .unnnic-icon {
        display: v-bind(hideTagCloseIcon);
      }
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $unnnic-space-2;

    &-buttons {
      display: flex;
      align-items: center;
      gap: $unnnic-space-2;
      flex-shrink: 0;
    }
  }

  &__title {
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-emphasized;
  }

  &__tags-dropdown {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-6;
    width: 100%;
    height: 204px;
    overflow-y: auto;
    padding-right: $unnnic-space-2;

    &-input {
      margin-bottom: $unnnic-space-6;
    }
  }

  &__tags-loading {
    align-self: center;
    margin-top: $unnnic-space-2;
  }

  :deep(.unnnic-tooltip) {
    display: flex;
  }
}
</style>

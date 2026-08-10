<template>
  <AsideSlotTemplateSection class="contact-info__section">
    <section class="about-support">
      <header class="about-support__header">
        <h3 class="about-support__title">
          {{ $t('contact_info.about_support') }}
        </h3>
        <section class="about-support__header-buttons">
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
                class="about-support__tags-dropdown-input"
              />
              <section
                ref="tagsListContainer"
                class="about-support__tags-dropdown"
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
                  class="about-support__tags-loading"
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
      <section class="about-support__content">
        <TagGroup
          v-if="roomTags?.length > 0"
          class="about-support__tag-group"
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
    </section>

    <ModalStartDiscussion
      v-if="isShowModalStartDiscussion"
      v-model="isShowModalStartDiscussion"
      @close="handleModalStartDiscussion()"
    />
  </AsideSlotTemplateSection>
</template>

<script setup>
import { computed, ref, watch, onUnmounted, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useInfiniteScroll, watchDebounced } from '@vueuse/core';
import isMobileLib from 'is-mobile';

import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';
import TagGroup from '@/components/TagGroup.vue';
import ProtocolText from './ProtocolText.vue';
import CsatInfo from './CsatInfo.vue';
import DiscussionsSession from './DiscussionsSession.vue';
import ModalStartDiscussion from './ModalStartDiscussion.vue';

import { useRooms } from '@/store/modules/chats/rooms';
import Queues from '@/services/api/resources/settings/queue';
import Room from '@/services/api/resources/chats/room';

const props = defineProps({
  closedRoom: {
    type: Object,
    default: () => ({}),
  },
  isHistory: {
    type: Boolean,
    default: false,
  },
  isViewMode: {
    type: Boolean,
    default: false,
  },
});

const roomsStore = useRooms();
const {
  activeRoom: room,
  activeRoomTags: roomTags,
  activeRoomTagsNext: roomTagsNext,
} = storeToRefs(roomsStore);

const TAGS_PAGE_SIZE = 20;

const openDropdownTags = ref(false);
const allTags = ref([]);
const allTagsNext = ref('');
const tagsFilter = ref('');
const isLoadingTags = ref(false);
const hasAvailableTags = ref(false);
const isShowModalStartDiscussion = ref(false);
const tagsListContainer = useTemplateRef('tagsListContainer');
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

async function loadAllTags({ reset = false } = {}) {
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

    // Only update availability without an active search, so clearing the
    // filter doesn't hide the button while the unfiltered list reloads.
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

async function loadRoomTags({ reset = false } = {}) {
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

async function removeRoomTag(tag) {
  try {
    await Room.removeRoomTag(room.value.uuid, tag.uuid);
    roomTags.value = roomTags.value.filter(
      (roomTag) => roomTag.uuid !== tag.uuid,
    );
  } catch (error) {
    console.log(error);
  }
}

async function addRoomTag(tag) {
  try {
    await Room.addRoomTag(room.value.uuid, tag.uuid);
    roomTags.value.push(tag);
  } catch (error) {
    console.log(error);
  }
}

function handleTagClick(tag) {
  if (!room.value?.user) return;

  const hasSelectedTag = roomTags.value.some(
    (roomTag) => roomTag.uuid === tag.uuid,
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
.contact-info__section {
  padding: $unnnic-space-2;
}

.about-support {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;

    :deep(.about-support__tag-group) {
      .unnnic-icon {
        display: v-bind(hideTagCloseIcon);
      }
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    &-buttons {
      display: flex;
      align-items: center;
      gap: $unnnic-space-1;

      :deep(.unnnic-dropdown__content) {
        padding: $unnnic-space-2;
      }
    }
  }

  &__title {
    font: $unnnic-font-display-4;
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

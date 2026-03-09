<template>
  <UnnnicDialog
    v-model:open="isEndDiscussionModalOpen"
    class="modal-close-discussion"
  >
    <UnnnicDialogContent size="small">
      <UnnnicDialogHeader type="attention">
        <UnnnicDialogTitle>
          {{ $t('discussions.close.title') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-close-discussion__content">
        <p class="modal-close-discussion__description">
          {{ $t('discussions.close.description') }}
        </p>
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('cancel')"
          type="tertiary"
          :disabled="isLoading"
          @click="isEndDiscussionModalOpen = false"
        />
        <UnnnicButton
          :text="$t('end')"
          type="attention"
          :loading="isLoading"
          @click="endDiscussion"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useDiscussions } from '@/store/modules/chats/discussions';
import { useRooms } from '@/store/modules/chats/rooms';
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const discussionsStore = useDiscussions();
const roomsStore = useRooms();

const { setActiveRoom } = roomsStore;
const { delete: deleteDiscussion, setDiscussionsCount } = discussionsStore;

const { discussionsCount } = storeToRefs(discussionsStore);

const isEndDiscussionModalOpen = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const isLoading = ref(false);

const endDiscussion = async () => {
  try {
    isLoading.value = true;
    setActiveRoom(null);
    await deleteDiscussion();
    setDiscussionsCount(discussionsCount.value - 1);
    isEndDiscussionModalOpen.value = false;
  } catch (error) {
    console.error('Error ending discussion', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.modal-close-discussion {
  &__content {
    padding: $unnnic-space-6;
  }
  &__description {
    color: $unnnic-color-neutral-dark;
    font: $unnnic-font-body;
  }
}
</style>

<template>
  <section
    class="notes-tab-content"
    data-testid="notes-tab-content"
  >
    <NoteCard
      v-for="note in roomInternalNotes"
      :key="note.uuid"
      :message="note"
      @click-note="handleInternalNoteClick(note)"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import NoteCard from './NoteCard.vue';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import RoomNotes from '@/services/api/resources/chats/roomNotes';

defineOptions({
  name: 'NotesTabContent',
});

type Room = {
  uuid?: string;
  [key: string]: unknown;
};

type InternalNote = {
  uuid: string;
  text?: string;
  [key: string]: unknown;
};

const props = withDefaults(
  defineProps<{
    room?: Room;
  }>(),
  {
    room: () => ({}),
  },
);

const emit = defineEmits<{
  loaded: [];
}>();

const roomMessagesStore = useRoomMessages();
const { toScrollNote, roomInternalNotes } = storeToRefs(roomMessagesStore);

const loadInternalNotes = async () => {
  try {
    const response = await RoomNotes.getInternalNotes({
      room: props.room.uuid,
    });

    roomInternalNotes.value = response.results;
  } catch (error) {
    console.error('Error loading internal notes:', error);
    roomInternalNotes.value = [];
  }
};

const handleInternalNoteClick = (note: InternalNote) => {
  toScrollNote.value = note;
};

onMounted(async () => {
  await loadInternalNotes();
  emit('loaded');
});

onUnmounted(() => {
  roomInternalNotes.value = [];
});
</script>

<style lang="scss" scoped>
.notes-tab-content {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-3;
}
</style>

<template>
  <section
    class="notes__content"
    data-testid="notes-content"
  >
    <ChatInternalNote
      v-for="note in roomInternalNotes"
      :key="note.uuid"
      class="chat-internal-note"
      :message="note"
      showAgentName
      @click-note="handleInternalNoteClick(note)"
    />
  </section>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import ChatInternalNote from '@/components/chats/chat/ChatMessages/ChatMessagesInternalNote.vue';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import RoomNotes from '@/services/api/resources/chats/roomNotes';

const props = defineProps({
  room: {
    type: Object,
    default: () => {},
  },
});

const emit = defineEmits(['loaded']);

const roomMessagesStore = useRoomMessages();
const { toScrollNote, roomInternalNotes } = storeToRefs(roomMessagesStore);

const loadInternalNotes = async () => {
  const response = await RoomNotes.getInternalNotes({
    room: props.room.uuid,
  });

  roomInternalNotes.value = response.results;
};

const handleInternalNoteClick = (note) => {
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
.notes__content {
  .chat-internal-note {
    cursor: pointer;
  }
}
</style>

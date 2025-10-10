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

<script>
import { mapWritableState } from 'pinia';
import ChatInternalNote from '@/components/chats/chat/ChatMessages/ChatMessagesInternalNote.vue';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import RoomNotes from '@/services/api/resources/chats/roomNotes';

export default {
  name: 'NotesContent',

  components: {
    ChatInternalNote,
  },

  props: {
    room: {
      type: Object,
      default: () => {},
    },
  },

  emits: ['loaded'],

  computed: {
    ...mapWritableState(useRoomMessages, ['toScrollNote', 'roomInternalNotes']),
  },

  async created() {
    await this.loadInternalNotes();
    this.$emit('loaded');
  },

  unmounted() {
    this.roomInternalNotes = [];
  },

  methods: {
    async loadInternalNotes() {
      const response = await RoomNotes.getInternalNotes({
        room: this.room.uuid,
      });

      this.roomInternalNotes = response.results;
    },

    handleInternalNoteClick(note) {
      this.toScrollNote = note;
    },
  },
};
</script>

<style lang="scss" scoped>
.notes__content {
  .chat-internal-note {
    cursor: pointer;
  }
}
</style>

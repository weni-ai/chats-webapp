<template>
  <section class="chat-messages__internal-note-container">
    <div class="chat-messages__internal-note">
      <p
        v-if="showAgentName"
        class="chat-messages__internal-note-agent-name"
      >
        {{ agentName }}
      </p>
      <p class="chat-messages__internal-note-text">
        {{ text }}
      </p>
    </div>
    <UnnnicIcon
      v-if="canDelete"
      icon="delete"
      size="ant"
      scheme="aux-red-500"
      clickable
      @click="handleShowModalDeleteInternalNote()"
    />
  </section>
  <ModalDeleteInternalNote
    v-if="showModalDeleteInternalNote"
    :modelValue="showModalDeleteInternalNote"
    :noteUuid="noteUuid"
    @update:model-value="handleShowModalDeleteInternalNote()"
  />
</template>

<script>
import { mapState } from 'pinia';
import { useProfile } from '@/store/modules/profile';
import ModalDeleteInternalNote from './ModalDeleteInternalNote.vue';
export default {
  name: 'ChatMessagesInternalNote',
  components: {
    ModalDeleteInternalNote,
  },
  props: {
    showAgentName: {
      type: Boolean,
      default: false,
    },
    message: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      showModalDeleteInternalNote: false,
    };
  },
  computed: {
    ...mapState(useProfile, ['me']),
    note() {
      return this.message.internal_note || this.message;
    },
    agentName() {
      const { first_name, last_name } = this.note.user;
      return `${first_name} ${last_name}`;
    },
    text() {
      return this.note.text;
    },
    noteUuid() {
      return this.note.uuid;
    },
    canDelete() {
      const isMeInternalNote = this.me?.email === this.note.user.email;
      return isMeInternalNote && this.note.is_deletable;
    },
  },
  methods: {
    handleShowModalDeleteInternalNote() {
      this.showModalDeleteInternalNote = !this.showModalDeleteInternalNote;
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-messages__internal-note {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: $unnnic-color-aux-baby-yellow;
  padding: $unnnic-spacing-xs $unnnic-spacing-ant;
  border-radius: $unnnic-border-radius-md;
  width: 100%;
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.1);

  &-container {
    margin-top: $unnnic-spacing-ant;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &-text {
    color: $unnnic-color-neutral-cloudy;
    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-medium;
  }

  &-agent-name {
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-darkest;
  }
}
</style>

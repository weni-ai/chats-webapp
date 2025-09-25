<template>
  <UnnnicModalDialog
    :modelValue="modelValue"
    type="warning"
    :title="$t('delete_internal_note.title')"
    showCloseIcon
    :primaryButtonProps="{
      text: $t('delete'),
      loading: isLoadingDeleteRequest,
    }"
    @primary-button-click="handleDeleteInternalNote"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    {{ $t('delete_internal_note.description') }}
  </UnnnicModalDialog>
</template>

<script>
import { mapWritableState } from 'pinia';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import RoomNotes from '@/services/api/resources/chats/roomNotes';

import { removeFromGroupedMessages } from '@/utils/messages';
import { unnnicCallAlert } from '@weni/unnnic-system';

export default {
  name: 'ModalDeleteInternalNote',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    noteUuid: {
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      isLoadingDeleteRequest: false,
    };
  },
  computed: {
    ...mapWritableState(useRoomMessages, [
      'roomInternalNotes',
      'roomMessages',
      'roomMessagesSorted',
    ]),
  },
  methods: {
    async handleDeleteInternalNote() {
      this.isLoadingDeleteRequest = true;
      try {
        await RoomNotes.deleteInternalNote({ note: this.noteUuid });

        this.roomInternalNotes = this.roomInternalNotes.filter(
          (note) => note.uuid !== this.noteUuid,
        );

        const internalNoteMessage = this.roomMessages.find(
          (message) => message.internal_note?.uuid === this.noteUuid,
        );

        if (internalNoteMessage) {
          removeFromGroupedMessages(this.roomMessagesSorted, {
            message: internalNoteMessage,
          });

          this.roomMessages = this.roomMessages.filter(
            (message) => message.uuid !== internalNoteMessage.uuid,
          );
        }
        unnnicCallAlert({
          props: {
            text: this.$t('delete_internal_note.message.delete.success'),
            type: 'success',
          },
        });
      } catch (error) {
        console.log(error);
        unnnicCallAlert({
          props: {
            text: this.$t('delete_internal_note.message.delete.error'),
            type: 'error',
          },
        });
      } finally {
        this.isLoadingDeleteRequest = false;
        this.$emit('update:modelValue', false);
      }
    },
  },
};
</script>

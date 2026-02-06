<template>
  <UnnnicDialog
    v-model:open="open"
    class="modal-delete-internal-note"
  >
    <UnnnicDialogContent size="medium">
      <UnnnicDialogHeader type="warning">
        <UnnnicDialogTitle>
          {{ $t('delete_internal_note.title') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-delete-internal-note__content">
        <p>
          {{ $t('delete_internal_note.description') }}
        </p>
      </section>
      <UnnnicDialogFooter>
        <UnnnicDialogClose>
          <UnnnicButton
            :text="$t('cancel')"
            type="tertiary"
            @click="open = false"
          />
        </UnnnicDialogClose>
        <UnnnicButton
          :text="$t('delete')"
          type="warning"
          :loading="isLoadingDeleteRequest"
          @click="handleDeleteInternalNote"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script>
import { mapWritableState } from 'pinia';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import RoomNotes from '@/services/api/resources/chats/roomNotes';

import { removeFromGroupedMessages } from '@/utils/messages';
import { unnnicCallAlert } from '@weni/unnnic-system';

import i18n from '@/plugins/i18n';

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
    open: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
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
            text: i18n.global.t('delete_internal_note.message.delete.success'),
            type: 'success',
          },
        });
      } catch (error) {
        console.log(error);
        unnnicCallAlert({
          props: {
            text: i18n.global.t('delete_internal_note.message.delete.error'),
            type: 'error',
          },
        });
      } finally {
        this.isLoadingDeleteRequest = false;
        this.open = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-delete-internal-note {
  &__content {
    color: $unnnic-color-gray-500;
    padding: $unnnic-space-6;
  }
}
</style>

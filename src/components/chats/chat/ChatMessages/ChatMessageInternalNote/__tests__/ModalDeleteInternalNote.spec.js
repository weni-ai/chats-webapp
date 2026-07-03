import { flushPromises, mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { unnnicCallAlert } from '@weni/unnnic-system';

import ModalDeleteInternalNote from '../ModalDeleteInternalNote.vue';

import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import RoomNotes from '@/services/api/resources/chats/roomNotes';
import { removeInternalNoteMessage } from '@/utils/messages';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/roomNotes', () => ({
  default: {
    deleteInternalNote: vi.fn(),
  },
}));

vi.mock('@/utils/messages', () => ({
  removeInternalNoteMessage: vi.fn(),
}));

vi.mock('@weni/unnnic-system', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    unnnicCallAlert: vi.fn(),
  };
});

const createDialogStubs = () => ({
  UnnnicDialog: {
    props: ['open'],
    template: `
      <div v-if="open" data-testid="modal-delete-internal-note">
        <slot />
      </div>
    `,
  },
  UnnnicDialogContent: {
    template: '<div><slot /></div>',
  },
  UnnnicDialogHeader: {
    template: '<div><slot /></div>',
  },
  UnnnicDialogTitle: {
    template: '<div><slot /></div>',
  },
  UnnnicDialogFooter: {
    template: '<div><slot /></div>',
  },
  UnnnicDialogClose: {
    template: '<div><slot /></div>',
  },
  UnnnicButton: {
    props: ['text', 'type', 'loading'],
    template: `
      <button
        :data-testid="type === 'warning' ? 'delete-button' : 'cancel-button'"
        :disabled="loading"
        @click="$emit('click')"
      >
        {{ text }}
      </button>
    `,
  },
});

const noteUuid = 'note-uuid-1';

const createWrapper = (props = {}) => {
  const pinia = createPinia();
  setActivePinia(pinia);

  const roomMessagesStore = useRoomMessages();
  roomMessagesStore.roomInternalNotes = [
    { uuid: noteUuid, text: 'Internal note' },
    { uuid: 'note-uuid-2', text: 'Other note' },
  ];
  roomMessagesStore.roomMessages = [
    {
      uuid: 'message-uuid-1',
      internal_note: { uuid: noteUuid },
    },
    {
      uuid: 'message-uuid-2',
      text: 'Regular message',
    },
  ];
  roomMessagesStore.roomMessagesSorted = [
    {
      minutes: [
        {
          messages: [
            {
              uuid: 'message-uuid-1',
              internal_note: { uuid: noteUuid },
            },
          ],
        },
      ],
    },
  ];

  return mount(ModalDeleteInternalNote, {
    props: {
      modelValue: true,
      noteUuid,
      ...props,
    },
    global: {
      plugins: [pinia],
      stubs: createDialogStubs(),
      mocks: {
        $t: (key) => key,
      },
    },
  });
};

describe('ModalDeleteInternalNote.vue', () => {
  const { t } = i18n.global;

  beforeEach(() => {
    vi.clearAllMocks();
    RoomNotes.deleteInternalNote.mockResolvedValue({});
  });

  describe('rendering', () => {
    it('should render modal content when open', () => {
      const wrapper = createWrapper();

      expect(
        wrapper.find('[data-testid="modal-delete-internal-note"]').exists(),
      ).toBe(true);
      expect(wrapper.text()).toContain(t('delete_internal_note.title'));
      expect(wrapper.text()).toContain(t('delete_internal_note.description'));
    });

    it('should not render modal when modelValue is false', () => {
      const wrapper = createWrapper({ modelValue: false });

      expect(
        wrapper.find('[data-testid="modal-delete-internal-note"]').exists(),
      ).toBe(false);
    });
  });

  describe('handleDeleteInternalNote', () => {
    it('should delete note, update store and show success alert', async () => {
      const wrapper = createWrapper();
      const roomMessagesStore = useRoomMessages();
      const internalNoteMessage = roomMessagesStore.roomMessages.find(
        (message) => message.internal_note?.uuid === noteUuid,
      );

      await wrapper.vm.handleDeleteInternalNote();
      await flushPromises();

      expect(RoomNotes.deleteInternalNote).toHaveBeenCalledTimes(1);
      expect(RoomNotes.deleteInternalNote).toHaveBeenCalledWith({
        note: noteUuid,
      });
      expect(roomMessagesStore.roomInternalNotes).toEqual([
        { uuid: 'note-uuid-2', text: 'Other note' },
      ]);
      expect(removeInternalNoteMessage).toHaveBeenCalledWith(
        roomMessagesStore.roomMessagesSorted,
        {
          message: internalNoteMessage,
        },
      );
      expect(roomMessagesStore.roomMessages).toEqual([
        {
          uuid: 'message-uuid-2',
          text: 'Regular message',
        },
      ]);
      expect(unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: t('delete_internal_note.message.delete.success'),
          type: 'success',
        },
      });
      expect(wrapper.emitted('update:modelValue')).toContainEqual([false]);
      expect(wrapper.vm.isLoadingDeleteRequest).toBe(false);
    });

    it('should show error alert when delete request fails', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      RoomNotes.deleteInternalNote.mockRejectedValueOnce(
        new Error('Delete failed'),
      );

      const wrapper = createWrapper();
      const roomMessagesStore = useRoomMessages();

      await wrapper.vm.handleDeleteInternalNote();
      await flushPromises();

      expect(RoomNotes.deleteInternalNote).toHaveBeenCalledTimes(1);
      expect(roomMessagesStore.roomInternalNotes).toHaveLength(2);
      expect(roomMessagesStore.roomMessages).toHaveLength(2);
      expect(removeInternalNoteMessage).not.toHaveBeenCalled();
      expect(unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: t('delete_internal_note.message.delete.error'),
          type: 'error',
        },
      });
      expect(wrapper.emitted('update:modelValue')).toContainEqual([false]);
      consoleSpy.mockRestore();
    });

    it('should skip removeInternalNoteMessage when note message is not found', async () => {
      const wrapper = createWrapper({ noteUuid: 'missing-note-uuid' });
      const roomMessagesStore = useRoomMessages();

      await wrapper.vm.handleDeleteInternalNote();
      await flushPromises();

      expect(removeInternalNoteMessage).not.toHaveBeenCalled();
      expect(roomMessagesStore.roomMessages).toHaveLength(2);
    });
  });
});

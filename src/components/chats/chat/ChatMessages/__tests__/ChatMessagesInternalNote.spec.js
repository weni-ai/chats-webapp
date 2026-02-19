import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import ChatMessagesInternalNote from '../ChatMessagesInternalNote.vue';
import { useProfile } from '@/store/modules/profile';
import { useRooms } from '@/store/modules/chats/rooms';

vi.mock('../ModalDeleteInternalNote.vue', () => ({
  default: {
    name: 'ModalDeleteInternalNote',
    template:
      '<div class="modal-delete-internal-note" @update:modelValue="$emit(\'update:modelValue\', $event)"></div>',
    props: ['modelValue', 'noteUuid'],
  },
}));

const defaultMessage = {
  uuid: 'note-uuid-1',
  text: 'Internal note content',
  user: { name: 'Agent Name', email: 'agent@test.com' },
  is_deletable: false,
};

const createWrapper = (props = {}, storeState = {}) => {
  const pinia = createPinia();
  setActivePinia(pinia);

  const profileStore = useProfile();
  const roomsStore = useRooms();

  profileStore.me = { email: 'other@test.com', name: 'Other User' };
  roomsStore.activeRoom = { ended_at: null };

  if (storeState.profile) {
    Object.assign(profileStore, storeState.profile);
  }
  if (storeState.rooms) {
    Object.assign(roomsStore, storeState.rooms);
  }

  return mount(ChatMessagesInternalNote, {
    props: {
      message: defaultMessage,
      ...props,
    },
    global: {
      plugins: [pinia],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicIcon: {
          name: 'UnnnicIcon',
          template:
            '<span class="unnnic-icon" @click="$emit(\'click\')"></span>',
          props: ['icon', 'size', 'scheme', 'clickable'],
        },
      },
    },
  });
};

describe('ChatMessagesInternalNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the component with message content', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('.chat-messages__internal-note').exists()).toBe(true);
      expect(wrapper.find('.chat-messages__internal-note-text').text()).toBe(
        defaultMessage.text,
      );
    });

    it('renders agent name when showAgentName is true', () => {
      const wrapper = createWrapper({ showAgentName: true });

      expect(
        wrapper.find('.chat-messages__internal-note-agent-name').exists(),
      ).toBe(true);
      expect(
        wrapper.find('.chat-messages__internal-note-agent-name').text(),
      ).toBe(defaultMessage.user.name);
    });

    it('does not render agent name when showAgentName is false', () => {
      const wrapper = createWrapper({ showAgentName: false });

      expect(
        wrapper.find('.chat-messages__internal-note-agent-name').exists(),
      ).toBe(false);
    });

    it('uses message.internal_note when present for note computed', () => {
      const message = {
        internal_note: {
          uuid: 'internal-uuid',
          text: 'From internal_note',
          user: { name: 'Internal Agent', email: 'internal@test.com' },
        },
      };
      const wrapper = createWrapper({ message });

      expect(wrapper.find('.chat-messages__internal-note-text').text()).toBe(
        'From internal_note',
      );
    });

    it('renders empty agent name when note has no user', () => {
      const message = {
        uuid: 'n1',
        text: 'Note without user',
        is_deletable: false,
      };
      const wrapper = createWrapper({ message, showAgentName: true });

      const agentEl = wrapper.find('.chat-messages__internal-note-agent-name');
      expect(agentEl.exists()).toBe(true);
      expect(agentEl.text()).toBe('');
    });
  });

  describe('delete button and canDelete', () => {
    it('does not show delete icon when canDelete is false', () => {
      const wrapper = createWrapper();

      expect(
        wrapper.find('.chat-messages__internal-note-delete').exists(),
      ).toBe(false);
    });

    it('shows delete icon when note is from current user, is_deletable and room is not ended', () => {
      const message = {
        ...defaultMessage,
        is_deletable: true,
      };
      const wrapper = createWrapper(
        { message },
        {
          profile: { me: { email: 'agent@test.com' } },
          rooms: { activeRoom: { ended_at: null } },
        },
      );

      expect(
        wrapper.find('.chat-messages__internal-note-delete').exists(),
      ).toBe(true);
    });

    it('does not show delete icon when room is ended', () => {
      const message = {
        ...defaultMessage,
        is_deletable: true,
      };
      const wrapper = createWrapper(
        { message },
        {
          profile: { me: { email: 'agent@test.com' } },
          rooms: { activeRoom: { ended_at: '2024-01-01T12:00:00Z' } },
        },
      );

      expect(
        wrapper.find('.chat-messages__internal-note-delete').exists(),
      ).toBe(false);
    });

    it('does not show delete icon when note is not from current user', () => {
      const message = {
        ...defaultMessage,
        is_deletable: true,
      };
      const wrapper = createWrapper(
        { message },
        {
          profile: { me: { email: 'other@test.com' } },
          rooms: { activeRoom: { ended_at: null } },
        },
      );

      expect(
        wrapper.find('.chat-messages__internal-note-delete').exists(),
      ).toBe(false);
    });
  });

  describe('emits', () => {
    it('emits clickNote when the note section is clicked', async () => {
      const wrapper = createWrapper();

      await wrapper.find('.chat-messages__internal-note').trigger('click');

      expect(wrapper.emitted('clickNote')).toBeTruthy();
      expect(wrapper.emitted('clickNote')).toHaveLength(1);
    });
  });

  describe('modal delete', () => {
    it('toggles showModalDeleteInternalNote when handleShowModalDeleteInternalNote is called', async () => {
      const message = {
        ...defaultMessage,
        is_deletable: true,
      };
      const wrapper = createWrapper(
        { message },
        {
          profile: { me: { email: 'agent@test.com' } },
          rooms: { activeRoom: { ended_at: null } },
        },
      );

      expect(wrapper.vm.showModalDeleteInternalNote).toBe(false);
      expect(
        wrapper.findComponent({ name: 'ModalDeleteInternalNote' }).exists(),
      ).toBe(false);

      await wrapper.vm.handleShowModalDeleteInternalNote();
      expect(wrapper.vm.showModalDeleteInternalNote).toBe(true);

      await wrapper.vm.$nextTick();
      const modal = wrapper.findComponent({ name: 'ModalDeleteInternalNote' });
      expect(modal.exists()).toBe(true);
      expect(modal.props('noteUuid')).toBe(defaultMessage.uuid);
      expect(modal.props('modelValue')).toBe(true);

      await wrapper.vm.handleShowModalDeleteInternalNote();
      expect(wrapper.vm.showModalDeleteInternalNote).toBe(false);
    });

    it('opens modal when delete icon is clicked', async () => {
      const message = {
        ...defaultMessage,
        is_deletable: true,
      };
      const wrapper = createWrapper(
        { message },
        {
          profile: { me: { email: 'agent@test.com' } },
          rooms: { activeRoom: { ended_at: null } },
        },
      );

      const deleteIcon = wrapper.findComponent({ name: 'UnnnicIcon' });
      await deleteIcon.vm.$emit('click');

      expect(wrapper.vm.showModalDeleteInternalNote).toBe(true);
    });
  });

  describe('computed', () => {
    it('noteUuid returns note uuid', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.noteUuid).toBe(defaultMessage.uuid);
    });

    it('agentEmail returns user email from message or internal_note', () => {
      const wrapper = createWrapper();
      expect(wrapper.vm.agentEmail).toBe('agent@test.com');

      const messageWithInternalNote = {
        internal_note: {
          user: { email: 'internal@test.com' },
        },
        user: { email: 'fallback@test.com' },
      };
      const wrapper2 = createWrapper({ message: messageWithInternalNote });
      expect(wrapper2.vm.agentEmail).toBe('internal@test.com');
    });
  });
});

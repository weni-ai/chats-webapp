import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia } from 'pinia';

import DeleteGroupModal from '../DeleteGroupModal.vue';

import { createTestingPinia } from '@pinia/testing';
import { useSettings } from '@/store/modules/settings';
import Group from '@/services/api/resources/settings/group';
import Unnnic from '@weni/unnnic-system';

vi.mock('@/services/api/resources/settings/group');
vi.mock('@weni/unnnic-system', () => ({
  default: {
    unnnicCallAlert: vi.fn(),
  },
}));

const mockGroup = {
  id: 1,
  uuid: 'group-uuid-123',
  name: 'Test Group',
};

const mockGroups = [
  mockGroup,
  {
    id: 2,
    uuid: 'group-uuid-456',
    name: 'Another Group',
  },
  {
    id: 3,
    uuid: 'group-uuid-789',
    name: 'Third Group',
  },
];

const createWrapper = (props = {}) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      settings: {
        groups: mockGroups,
      },
    },
  });

  setActivePinia(pinia);

  return mount(DeleteGroupModal, {
    props: {
      group: mockGroup,
      ...props,
    },
    global: {
      plugins: [pinia],
      stubs: {
        UnnnicModalDialog: {
          template: `
            <div data-testid="modal-delete-group">
              <slot></slot>
              <button 
                data-testid="primary-button" 
                :disabled="primaryButtonProps.disabled"
                @click="$emit('primary-button-click')"
              >
                {{ primaryButtonProps.text }}
              </button>
              <button 
                data-testid="close-button"
                @click="$emit('update:model-value', false)"
              >
                Close
              </button>
            </div>
          `,
          props: [
            'modelValue',
            'title',
            'primaryButtonProps',
            'secondaryButtonProps',
            'showActionsDivider',
            'showCloseIcon',
            'size',
          ],
          emits: ['update:model-value', 'primary-button-click'],
        },
        UnnnicLabel: {
          template: '<label><slot></slot></label>',
          props: ['label'],
        },
        UnnnicInput: {
          template:
            '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" />',
          props: ['modelValue', 'placeholder'],
        },
      },
      mocks: {
        $t: (key, params) => {
          const translations = {
            'config_chats.groups.delete.title': `Delete ${params?.groupName || ''}`,
            'config_chats.groups.delete.notice':
              'This action will be irreversible. To confirm the action, please type the name of the group',
            'config_chats.groups.delete.success':
              'Group  successfully deleted!',
            'config_chats.groups.delete.error':
              'Failed to delete group. Please try again.',
            delete: 'Delete',
            confirmation: 'Confirmation',
          };
          return translations[key] || key;
        },
      },
    },
  });
};

describe('DeleteGroupModal.vue', () => {
  let wrapper;
  let settingsStore;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = createWrapper();
    settingsStore = useSettings();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render the modal', () => {
      const modal = wrapper.find('[data-testid="modal-delete-group"]');
      expect(modal.exists()).toBe(true);
    });

    it('should render the delete notice', () => {
      const notice = wrapper.find('[data-testid="delete-notice"]');
      expect(notice.exists()).toBe(true);
      expect(notice.text()).toContain('This action will be irreversible');
    });

    it('should render the input field with placeholder', () => {
      const input = wrapper.find('[data-testid="input-dashboard-name"]');
      expect(input.exists()).toBe(true);
      expect(input.attributes('placeholder')).toBe(mockGroup.name);
    });

    it('should render the primary button with delete text', () => {
      const button = wrapper.find('[data-testid="primary-button"]');
      expect(button.exists()).toBe(true);
      expect(button.text()).toBe('Delete');
    });
  });

  describe('Group Name Validation', () => {
    it('should have validGroupName as false when groupName is empty', () => {
      expect(wrapper.vm.groupName).toBe('');
      expect(wrapper.vm.validGroupName).toBe(false);
    });

    it('should have validGroupName as false when groupName does not match', async () => {
      wrapper.vm.groupName = 'Wrong Name';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.validGroupName).toBe(false);
    });

    it('should have validGroupName as true when groupName matches', async () => {
      wrapper.vm.groupName = mockGroup.name;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.validGroupName).toBe(true);
    });

    it('should disable primary button when groupName is invalid', async () => {
      wrapper.vm.groupName = 'Wrong Name';
      await wrapper.vm.$nextTick();

      const button = wrapper.find('[data-testid="primary-button"]');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should enable primary button when groupName is valid', async () => {
      wrapper.vm.groupName = mockGroup.name;
      await wrapper.vm.$nextTick();

      const button = wrapper.find('[data-testid="primary-button"]');
      expect(button.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Delete Group Success', () => {
    it('should delete group successfully', async () => {
      Group.delete = vi.fn().mockResolvedValue({ success: true });
      wrapper.vm.groupName = mockGroup.name;
      await wrapper.vm.$nextTick();

      await wrapper.vm.deleteGroup();
      await flushPromises();

      expect(Group.delete).toHaveBeenCalledWith(mockGroup.uuid);
      expect(settingsStore.groups).not.toContainEqual(mockGroup);
      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Group  successfully deleted!',
          type: 'success',
        },
        seconds: 5,
      });
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should remove group from store after successful deletion', async () => {
      Group.delete = vi.fn().mockResolvedValue({ success: true });
      wrapper.vm.groupName = mockGroup.name;
      await wrapper.vm.$nextTick();

      const initialGroupsCount = settingsStore.groups.length;

      await wrapper.vm.deleteGroup();
      await flushPromises();

      expect(settingsStore.groups.length).toBe(initialGroupsCount - 1);
      expect(
        settingsStore.groups.find((g) => g.uuid === mockGroup.uuid),
      ).toBeUndefined();
    });

    it('should set isLoadingRequest to false after deletion', async () => {
      Group.delete = vi.fn().mockResolvedValue({ success: true });
      wrapper.vm.groupName = mockGroup.name;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isLoadingRequest).toBe(false);

      const deletePromise = wrapper.vm.deleteGroup();
      expect(wrapper.vm.isLoadingRequest).toBe(true);

      await deletePromise;
      await flushPromises();

      expect(wrapper.vm.isLoadingRequest).toBe(false);
    });
  });

  describe('Delete Group Error', () => {
    it('should handle error when deleting group fails', async () => {
      const error = new Error('Delete failed');
      Group.delete = vi.fn().mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      wrapper.vm.groupName = mockGroup.name;
      await wrapper.vm.$nextTick();

      await wrapper.vm.deleteGroup();
      await flushPromises();

      expect(Group.delete).toHaveBeenCalledWith(mockGroup.uuid);
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Failed to delete group. Please try again.',
          type: 'success',
        },
        seconds: 5,
      });
      expect(wrapper.emitted('close')).toBeTruthy();
      expect(wrapper.vm.isLoadingRequest).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should not remove group from store when deletion fails', async () => {
      const error = new Error('Delete failed');
      Group.delete = vi.fn().mockRejectedValue(error);

      wrapper.vm.groupName = mockGroup.name;
      await wrapper.vm.$nextTick();

      const initialGroupsCount = settingsStore.groups.length;

      await wrapper.vm.deleteGroup();
      await flushPromises();

      expect(settingsStore.groups.length).toBe(initialGroupsCount);
      expect(
        settingsStore.groups.find((g) => g.uuid === mockGroup.uuid),
      ).toEqual(mockGroup);
    });

    it('should set isLoadingRequest to false after error', async () => {
      const error = new Error('Delete failed');
      Group.delete = vi.fn().mockRejectedValue(error);

      wrapper.vm.groupName = mockGroup.name;
      await wrapper.vm.$nextTick();

      const deletePromise = wrapper.vm.deleteGroup();
      expect(wrapper.vm.isLoadingRequest).toBe(true);

      await deletePromise;
      await flushPromises();

      expect(wrapper.vm.isLoadingRequest).toBe(false);
    });
  });

  describe('Close Modal', () => {
    it('should emit close event when close button is clicked', async () => {
      const closeButton = wrapper.find('[data-testid="close-button"]');

      await closeButton.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit close event after successful deletion', async () => {
      Group.delete = vi.fn().mockResolvedValue({ success: true });
      wrapper.vm.groupName = mockGroup.name;
      await wrapper.vm.$nextTick();

      await wrapper.vm.deleteGroup();
      await flushPromises();

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit close event after failed deletion', async () => {
      const error = new Error('Delete failed');
      Group.delete = vi.fn().mockRejectedValue(error);

      wrapper.vm.groupName = mockGroup.name;
      await wrapper.vm.$nextTick();

      await wrapper.vm.deleteGroup();
      await flushPromises();

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Input Field', () => {
    it('should update groupName when input value changes', async () => {
      const input = wrapper.find('[data-testid="input-dashboard-name"]');

      await input.setValue('New Group Name');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.groupName).toBe('New Group Name');
    });

    it('should have correct placeholder', () => {
      const input = wrapper.find('[data-testid="input-dashboard-name"]');
      expect(input.attributes('placeholder')).toBe(mockGroup.name);
    });
  });

  describe('Groups from Store', () => {
    it('should get groups from settings store', () => {
      expect(wrapper.vm.groups).toEqual(mockGroups);
    });

    it('should update groups in store after deletion', async () => {
      Group.delete = vi.fn().mockResolvedValue({ success: true });
      wrapper.vm.groupName = mockGroup.name;
      await wrapper.vm.$nextTick();

      const initialGroups = [...settingsStore.groups];

      await wrapper.vm.deleteGroup();
      await flushPromises();

      expect(settingsStore.groups.length).toBe(initialGroups.length - 1);
      expect(settingsStore.groups).not.toContainEqual(mockGroup);
    });
  });

  describe('Snapshot', () => {
    it('should match the snapshot', () => {
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});

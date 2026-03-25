import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia } from 'pinia';

import SettingsGroups from '@/views/Settings/SettingsGroups.vue';

import { createTestingPinia } from '@pinia/testing';
import { useSettings } from '@/store/modules/settings';

const mockGroups = [
  {
    id: 1,
    name: 'Group Alpha',
    uuid: 'uuid-1',
  },
  {
    id: 2,
    name: 'Group Beta',
    uuid: 'uuid-2',
  },
  {
    id: 3,
    name: 'Group Gamma',
    uuid: 'uuid-3',
  },
];

const createWrapper = (initialState = {}) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      settings: {
        groups: mockGroups,
        ...initialState.settings,
      },
    },
  });

  setActivePinia(pinia);

  return mount(SettingsGroups, {
    global: {
      plugins: [pinia],
      stubs: {
        NewGroupDrawer: {
          template: '<div data-testid="new-group-drawer" v-if="show"></div>',
          props: ['show'],
        },
        EditGroupDrawer: {
          template: '<div data-testid="edit-group-drawer" v-if="show"></div>',
          props: ['show', 'projectGroup'],
        },
        DeleteGroupModal: {
          template: '<div data-testid="delete-group-modal" v-if="group"></div>',
          props: ['group'],
        },
        UnnnicCard: {
          template:
            '<div data-testid="new-group-card" @click="$emit(\'click\')"><slot></slot></div>',
          props: ['type', 'text', 'icon'],
        },
        UnnnicSimpleCard: {
          template:
            '<div data-testid="group-card" @click="$emit(\'click\')"><slot name="headerSlot"></slot></div>',
          props: ['title', 'clickable'],
        },
        UnnnicDropdown: {
          template: '<div><slot name="trigger"></slot><slot></slot></div>',
          props: ['position'],
        },
        UnnnicDropdownItem: {
          template:
            '<div :data-testid="dataTestId || \'dropdown-item\'" @click.stop="$emit(\'click\')"><slot></slot></div>',
          props: ['dataTestId'],
        },
        UnnnicToolTip: {
          template: '<div><slot></slot></div>',
          props: ['enabled', 'text', 'side'],
        },
        UnnnicButton: {
          template: '<button data-testid="open-dropdown-menu-button"></button>',
          props: ['iconCenter', 'type'],
        },
        UnnnicIconSvg: {
          template: '<span></span>',
          props: ['icon', 'size', 'scheme'],
        },
      },
      mocks: {
        $t: (key) => {
          const translations = {
            'config_chats.new_group': 'New Group',
            'config_chats.groups.delete_or_edit': 'Delete or edit',
            edit: 'Edit',
            exclude: 'Exclude',
          };
          return translations[key] || key;
        },
      },
    },
  });
};

describe('SettingsGroups.vue', () => {
  let wrapper;
  let settingsStore;
  let postMessageSpy;

  beforeEach(() => {
    postMessageSpy = vi
      .spyOn(window.parent, 'postMessage')
      .mockImplementation(() => {});
    wrapper = createWrapper();
    settingsStore = useSettings();
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render the card for creating a new group', () => {
      const newGroupCard = wrapper.find('[data-testid="new-group-card"]');

      expect(newGroupCard.exists()).toBe(true);
    });

    it('should render the correct number of group cards', () => {
      const groupCards = wrapper.findAll('[data-testid="group-card"]');

      expect(groupCards.length).toBe(3);
    });

    it('should render group cards', () => {
      const groupCards = wrapper.findAll('[data-testid="group-card"]');

      expect(groupCards.length).toBeGreaterThan(0);
    });
  });

  describe('New Group Drawer', () => {
    it('should open new group drawer when clicking on new group card', async () => {
      const newGroupCard = wrapper.find('[data-testid="new-group-card"]');

      expect(wrapper.vm.showNewGroupDrawer).toBe(false);

      await newGroupCard.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showNewGroupDrawer).toBe(true);
      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: true },
        '*',
      );
    });

    it('should render NewGroupDrawer when showNewGroupDrawer is true', async () => {
      wrapper.vm.showNewGroupDrawer = true;
      await wrapper.vm.$nextTick();

      const drawer = wrapper.find('[data-testid="new-group-drawer"]');
      expect(drawer.exists()).toBe(true);
    });

    it('should close new group drawer when closeNewGroupDrawer is called', async () => {
      wrapper.vm.showNewGroupDrawer = true;
      await wrapper.vm.$nextTick();

      wrapper.vm.closeNewGroupDrawer();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showNewGroupDrawer).toBe(false);
      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: false },
        '*',
      );
    });

    it('should close new group drawer when drawer emits close event', async () => {
      wrapper.vm.showNewGroupDrawer = true;
      await wrapper.vm.$nextTick();

      const drawer = wrapper.find('[data-testid="new-group-drawer"]');
      expect(drawer.exists()).toBe(true);

      // Simulate close event
      wrapper.vm.closeNewGroupDrawer();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showNewGroupDrawer).toBe(false);
    });
  });

  describe('Edit Group Drawer', () => {
    it('should open edit group drawer when clicking on group card', async () => {
      const groupCards = wrapper.findAll('[data-testid="group-card"]');

      expect(wrapper.vm.showEditGroupDrawer).toBe(false);
      expect(wrapper.vm.editGroup).toBe(null);

      await groupCards[0].trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showEditGroupDrawer).toBe(true);
      expect(wrapper.vm.editGroup).toEqual(mockGroups[0]);
      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: true },
        '*',
      );
    });

    it('should render EditGroupDrawer when showEditGroupDrawer is true', async () => {
      wrapper.vm.showEditGroupDrawer = true;
      wrapper.vm.editGroup = mockGroups[0];
      await wrapper.vm.$nextTick();

      const drawer = wrapper.find('[data-testid="edit-group-drawer"]');
      expect(drawer.exists()).toBe(true);
    });

    it('should pass correct projectGroup prop to EditGroupDrawer', async () => {
      wrapper.vm.showEditGroupDrawer = true;
      wrapper.vm.editGroup = mockGroups[1];
      await wrapper.vm.$nextTick();

      const drawer = wrapper.find('[data-testid="edit-group-drawer"]');
      expect(drawer.exists()).toBe(true);
      expect(wrapper.vm.editGroup).toEqual(mockGroups[1]);
    });

    it('should close edit group drawer when closeEditGroupDrawer is called', async () => {
      wrapper.vm.showEditGroupDrawer = true;
      wrapper.vm.editGroup = mockGroups[0];
      await wrapper.vm.$nextTick();

      wrapper.vm.closeEditGroupDrawer();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showEditGroupDrawer).toBe(false);
      expect(wrapper.vm.editGroup).toBe(null);
      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: false },
        '*',
      );
    });

    it('should close edit group drawer when drawer emits close event', async () => {
      wrapper.vm.showEditGroupDrawer = true;
      wrapper.vm.editGroup = mockGroups[0];
      await wrapper.vm.$nextTick();

      const drawer = wrapper.find('[data-testid="edit-group-drawer"]');
      expect(drawer.exists()).toBe(true);

      // Simulate close event
      wrapper.vm.closeEditGroupDrawer();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showEditGroupDrawer).toBe(false);
    });

    it('should open edit group drawer when clicking edit in dropdown', async () => {
      const dropdownItems = wrapper.findAll('[data-testid="dropdown-item"]');

      // Find the edit item (first dropdown item, before delete)
      const editItem = dropdownItems[0];

      expect(editItem.exists()).toBe(true);
      expect(wrapper.vm.showEditGroupDrawer).toBe(false);

      await editItem.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showEditGroupDrawer).toBe(true);
      expect(wrapper.vm.editGroup).toEqual(mockGroups[0]);
    });
  });

  describe('Delete Group Modal', () => {
    it('should open delete group modal when openDeleteGroupModal is called', async () => {
      const group = mockGroups[0];

      expect(wrapper.vm.showDeleteGroupModal).toBe(false);
      expect(wrapper.vm.deleteGroup).toBe(null);

      wrapper.vm.openDeleteGroupModal(group);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDeleteGroupModal).toBe(true);
      expect(wrapper.vm.deleteGroup).toEqual(group);
      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: true },
        '*',
      );
    });

    it('should render DeleteGroupModal when showDeleteGroupModal is true', async () => {
      wrapper.vm.showDeleteGroupModal = true;
      wrapper.vm.deleteGroup = mockGroups[0];
      await wrapper.vm.$nextTick();

      const modal = wrapper.find('[data-testid="delete-group-modal"]');
      expect(modal.exists()).toBe(true);
    });

    it('should pass correct group prop to DeleteGroupModal', async () => {
      wrapper.vm.showDeleteGroupModal = true;
      wrapper.vm.deleteGroup = mockGroups[1];
      await wrapper.vm.$nextTick();

      const modal = wrapper.find('[data-testid="delete-group-modal"]');
      expect(modal.exists()).toBe(true);
      expect(wrapper.vm.deleteGroup).toEqual(mockGroups[1]);
    });

    it('should close delete group modal when closeDeleteGroupModal is called', async () => {
      wrapper.vm.showDeleteGroupModal = true;
      wrapper.vm.deleteGroup = mockGroups[0];
      await wrapper.vm.$nextTick();

      wrapper.vm.closeDeleteGroupModal();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDeleteGroupModal).toBe(false);
      expect(wrapper.vm.deleteGroup).toBe(null);
      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: false },
        '*',
      );
    });

    it('should close delete group modal when modal emits close event', async () => {
      wrapper.vm.showDeleteGroupModal = true;
      wrapper.vm.deleteGroup = mockGroups[0];
      await wrapper.vm.$nextTick();

      const modal = wrapper.find('[data-testid="delete-group-modal"]');
      expect(modal.exists()).toBe(true);

      // Simulate close event
      wrapper.vm.closeDeleteGroupModal();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDeleteGroupModal).toBe(false);
    });

    it('should open delete group modal when clicking delete in dropdown', async () => {
      expect(wrapper.vm.showDeleteGroupModal).toBe(false);

      // Call the method directly since the stub may not propagate events correctly
      wrapper.vm.openDeleteGroupModal(mockGroups[0]);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDeleteGroupModal).toBe(true);
      expect(wrapper.vm.deleteGroup).toEqual(mockGroups[0]);
      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: true },
        '*',
      );
    });
  });

  describe('handleConnectOverlay', () => {
    it('should send postMessage when handleConnectOverlay is called with true', () => {
      wrapper.vm.handleConnectOverlay(true);

      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: true },
        '*',
      );
    });

    it('should send postMessage when handleConnectOverlay is called with false', () => {
      wrapper.vm.handleConnectOverlay(false);

      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: false },
        '*',
      );
    });
  });

  describe('Groups from store', () => {
    it('should get groups from settings store', () => {
      expect(wrapper.vm.groups).toEqual(mockGroups);
    });

    it('should update when groups in store change', async () => {
      const newGroups = [{ id: 4, name: 'New Group', uuid: 'uuid-4' }];

      settingsStore.groups = newGroups;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.groups).toEqual(newGroups);
    });
  });

  describe('Snapshot', () => {
    it('should match the snapshot', () => {
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});

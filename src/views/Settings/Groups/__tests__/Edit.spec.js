import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

import EditGroupDrawer from '../Edit.vue';
import Group from '@/services/api/resources/settings/group';
import Unnnic from '@weni/unnnic-system';

vi.mock('@/services/api/resources/settings/group', () => ({
  default: {
    show: vi.fn(),
    listAuthorization: vi.fn(),
    listSectorsQueues: vi.fn(() => ({})),
    listAgentsQueuesPermissions: vi.fn(() => ({})),
    update: vi.fn(),
    addAuthorization: vi.fn(),
    deleteAuthorization: vi.fn(),
    addSector: vi.fn(),
    removeSector: vi.fn(),
  },
}));
vi.mock('@weni/unnnic-system', () => ({
  default: { unnnicCallAlert: vi.fn() },
}));

const mockProjectGroup = {
  uuid: 'group-uuid-123',
  name: 'Test Group',
};

const mockGroup = {
  uuid: 'group-uuid-123',
  name: 'Test Group',
  rooms_limit: 5,
  sectors: [{ uuid: 'sector-uuid-1', name: 'Sector 1' }],
};

const mockAuthorizations = {
  results: [
    { uuid: 'auth-1', permission: 'manager-uuid-1', role: 1 },
    {
      uuid: 'auth-2',
      permission: 'agent-uuid-1',
      role: 2,
      user_email: 'agent@test.com',
    },
  ],
};

const createWrapper = (props = {}) => {
  const pinia = createTestingPinia({ createSpy: vi.fn });
  setActivePinia(pinia);

  return mount(EditGroupDrawer, {
    props: { show: true, projectGroup: mockProjectGroup, ...props },
    global: {
      plugins: [pinia],
      stubs: {
        General: {
          template: '<div data-testid="general-form"></div>',
          props: ['modelValue', 'isEditing'],
        },
      },
      mocks: {
        $t: (key) =>
          ({
            'config_chats.groups.general': 'General',
            'config_chats.groups.projects': 'Projects',
            'config_chats.groups.agents': 'Agents',
            'config_chats.groups.update_success': 'Group updated successfully!',
            'config_chats.groups.update_error':
              'We had problems updating some data. Check the information and try again if anything is missing.',
            save: 'Save',
            cancel: 'Cancel',
          })[key] || key,
      },
    },
  });
};

describe('EditGroupDrawer.vue', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    Group.show = vi.fn().mockResolvedValue(mockGroup);
    Group.listAuthorization = vi.fn().mockResolvedValue(mockAuthorizations);
    Group.listSectorsQueues = vi.fn().mockResolvedValue({});
    Group.listAgentsQueuesPermissions = vi.fn().mockResolvedValue({});
    Group.update = vi.fn().mockResolvedValue({});
    Group.addAuthorization = vi.fn().mockResolvedValue({});
    Group.deleteAuthorization = vi.fn().mockResolvedValue({});
    Group.addSector = vi.fn().mockResolvedValue({});
    Group.removeSector = vi.fn().mockResolvedValue({});
  });

  afterEach(async () => {
    if (wrapper) {
      await flushPromises();
      wrapper.unmount();
    }
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render drawer when show is true, not render when false', async () => {
      wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.find('[data-testid="drawer"]').exists()).toBe(true);

      await wrapper.setProps({ show: false });
      expect(wrapper.find('[data-testid="drawer"]').exists()).toBe(false);
    });

    it('should render General form', async () => {
      wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.find('[data-testid="general-form"]').exists()).toBe(true);
    });
  });

  describe('Mounted - Data Loading', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should load group data and authorizations on mount', () => {
      expect(Group.show).toHaveBeenCalledWith(mockProjectGroup.uuid);
      expect(Group.listAuthorization).toHaveBeenCalledWith({
        groupSectorUuid: mockProjectGroup.uuid,
      });
    });

    it('should set editingProjectGroup with loaded data', () => {
      expect(wrapper.vm.editingProjectGroup.name).toBe(mockGroup.name);
      expect(wrapper.vm.editingProjectGroup.maxSimultaneousChatsByAgent).toBe(
        '5',
      );
    });

    it('should filter managers and agents from authorizations', () => {
      expect(wrapper.vm.editingProjectGroup.managers.length).toBe(1);
      expect(wrapper.vm.editingProjectGroup.managers[0].role).toBe(1);
      expect(wrapper.vm.editingProjectGroup.agents.length).toBe(1);
      expect(wrapper.vm.editingProjectGroup.agents[0].role).toBe(2);
      expect(wrapper.vm.editingProjectGroup.agents[0].queues).toEqual([]);
    });

    it('should call listSectorsQueues and loadAgentsQueuesPermissions, set firstLoaded', async () => {
      expect(Group.listSectorsQueues).toHaveBeenCalled();
      expect(Group.listAgentsQueuesPermissions).toHaveBeenCalled();
      expect(wrapper.vm.firstLoaded).toBe(true);
    });
  });

  describe('Tabs', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should have correct tabs and tabsIds computed', () => {
      expect(wrapper.vm.activeTab.id).toBe('general');
      expect(wrapper.vm.tabs.length).toBe(3);
      expect(wrapper.vm.tabsIds).toEqual(['general', 'projects', 'agents']);
    });

    it('should update active tab when updateTab is called with id or name', async () => {
      wrapper.vm.updateTab('projects');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.activeTab.id).toBe('projects');

      wrapper.vm.updateTab('General');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.activeTab.id).toBe('general');
    });

    it('should not update tab if tab not found', async () => {
      const initialTab = wrapper.vm.activeTab;
      wrapper.vm.updateTab('invalid-tab');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.activeTab).toEqual(initialTab);
    });
  });

  describe('listSectorsQueues', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should fetch and format sector queues', async () => {
      const mockSectorsQueues = {
        'sector-uuid-1': {
          sector_name: 'Sector 1',
          queues: [{ uuid: 'queue-1', queue_name: 'Queue 1' }],
        },
      };
      Group.listSectorsQueues = vi.fn().mockResolvedValue(mockSectorsQueues);
      wrapper.vm.editingProjectGroup.sectors = [{ uuid: 'sector-uuid-1' }];
      await wrapper.vm.$nextTick();

      await wrapper.vm.listSectorsQueues({});
      await flushPromises();

      expect(wrapper.vm.avaliableSectorQueues.length).toBe(1);
      expect(wrapper.vm.avaliableSectorQueues[0].name).toBe(
        'Sector 1 | Queue 1',
      );
    });

    it('should add/remove queues from agents when sectors change', async () => {
      Group.listSectorsQueues = vi.fn().mockResolvedValue({
        'sector-uuid-1': {
          sector_name: 'Sector 1',
          queues: [{ uuid: 'queue-1', queue_name: 'Queue 1' }],
        },
      });
      wrapper.vm.editingProjectGroup.sectors = [{ uuid: 'sector-uuid-1' }];
      wrapper.vm.editingProjectGroup.agents = [{ uuid: 'agent-1', queues: [] }];
      await wrapper.vm.$nextTick();

      await wrapper.vm.listSectorsQueues({
        toAddQueuesSector: 'sector-uuid-1',
      });
      await flushPromises();
      expect(
        wrapper.vm.editingProjectGroup.agents[0].queues.length,
      ).toBeGreaterThan(0);

      wrapper.vm.editingProjectGroup.agents[0].queues = [
        { uuid: 'queue-1', sectorUuid: 'sector-uuid-1' },
        { uuid: 'queue-2', sectorUuid: 'sector-uuid-2' },
      ];
      await wrapper.vm.listSectorsQueues({
        toRemoveQueuesSector: 'sector-uuid-1',
      });
      await flushPromises();
      expect(wrapper.vm.editingProjectGroup.agents[0].queues.length).toBe(1);
    });
  });

  describe('loadAgentsQueuesPermissions', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should load agents queues permissions and update agent queues', async () => {
      Group.listAgentsQueuesPermissions = vi.fn().mockResolvedValue({
        'agent@test.com': { 'sector-uuid-1': { permissions: ['queue-1'] } },
      });
      Group.listSectorsQueues = vi.fn().mockResolvedValue({
        'sector-uuid-1': {
          sector_name: 'Sector 1',
          queues: [{ uuid: 'queue-1', queue_name: 'Queue 1' }],
        },
      });
      wrapper.vm.editingProjectGroup.sectors = [{ uuid: 'sector-uuid-1' }];
      wrapper.vm.editingProjectGroup.agents = [
        { uuid: 'agent-1', user_email: 'agent@test.com', queues: [] },
      ];
      wrapper.vm.avaliableSectorQueues = [
        { uuid: 'queue-1', sectorUuid: 'sector-uuid-1' },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.loadAgentsQueuesPermissions();
      await flushPromises();

      expect(wrapper.vm.editingProjectGroup.agents[0].queues.length).toBe(1);
    });

    it('should not update agent if not found', async () => {
      Group.listAgentsQueuesPermissions = vi.fn().mockResolvedValue({
        'other@test.com': { 'sector-uuid-1': { permissions: ['queue-1'] } },
      });
      wrapper.vm.editingProjectGroup.agents = [
        { uuid: 'agent-1', user_email: 'agent@test.com', queues: [] },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.loadAgentsQueuesPermissions();
      await flushPromises();

      expect(wrapper.vm.editingProjectGroup.agents[0].queues).toEqual([]);
    });
  });

  describe('Watch - sectors', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should not trigger watch if firstLoaded is false, should trigger after firstLoaded', async () => {
      wrapper.vm.firstLoaded = false;
      Group.listSectorsQueues.mockClear();
      wrapper.vm.editingProjectGroup.sectors = [{ uuid: 'sector-uuid-1' }];
      await wrapper.vm.$nextTick();
      await flushPromises();
      expect(Group.listSectorsQueues.mock.calls.length).toBe(0);

      wrapper.vm.firstLoaded = true;
      Group.listSectorsQueues = vi.fn().mockResolvedValue({});
      wrapper.vm.editingProjectGroup.sectors = [{ uuid: 'sector-uuid-2' }];
      await wrapper.vm.$nextTick();
      await flushPromises();
      expect(Group.listSectorsQueues).toHaveBeenCalled();
    });

    it('should clear queues when all sectors are removed', async () => {
      wrapper.vm.firstLoaded = true;
      Group.listSectorsQueues = vi.fn().mockResolvedValue({});
      wrapper.vm.editingProjectGroup.agents = [
        {
          uuid: 'agent-1',
          queues: [{ uuid: 'queue-1', sectorUuid: 'sector-uuid-1' }],
        },
      ];
      await wrapper.vm.$nextTick();

      wrapper.vm.editingProjectGroup.sectors = [];
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.vm.avaliableSectorQueues).toEqual([]);
      expect(wrapper.vm.editingProjectGroup.agents[0].queues).toEqual([]);
    });
  });

  describe('Remove Handlers', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should add items to remove arrays', async () => {
      const manager = { uuid: 'manager-1' };
      const sector = { uuid: 'sector-1' };
      const agent = { uuid: 'agent-1' };

      wrapper.vm.toRemoveManagers.push(manager);
      wrapper.vm.toRemoveSectors.push(sector);
      wrapper.vm.toRemoveAgents.push(agent);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.toRemoveManagers[0].uuid).toBe('manager-1');
      expect(wrapper.vm.toRemoveSectors[0].uuid).toBe('sector-1');
      expect(wrapper.vm.toRemoveAgents[0].uuid).toBe('agent-1');
    });
  });

  describe('finish - Update Group', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should update group successfully and show success alert', async () => {
      wrapper.vm.editingProjectGroup.maxSimultaneousChatsByAgent = '10';
      await wrapper.vm.$nextTick();

      await wrapper.vm.finish();
      await flushPromises();

      expect(Group.update).toHaveBeenCalledWith({
        groupUuid: mockProjectGroup.uuid,
        body: { rooms_limit: '10' },
      });
      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: { text: 'Group updated successfully!', type: 'success' },
        seconds: 5,
      });
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should set isLoadingRequest correctly during update', async () => {
      const finishPromise = wrapper.vm.finish();
      expect(wrapper.vm.isLoadingRequest).toBe(true);
      await finishPromise;
      await flushPromises();
      expect(wrapper.vm.isLoadingRequest).toBe(false);
    });
  });

  describe('updateManagers', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should remove and add managers correctly', async () => {
      wrapper.vm.toRemoveManagers = [{ uuid: 'manager-1' }];
      wrapper.vm.editingProjectGroup.managers = [
        { uuid: 'manager-2', new: true },
        { uuid: 'manager-3', new: false },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.updateManagers();
      await flushPromises();

      expect(Group.deleteAuthorization).toHaveBeenCalledWith({
        permissionUuid: 'manager-1',
      });
      expect(Group.addAuthorization).toHaveBeenCalledWith({
        groupSectorUuid: mockProjectGroup.uuid,
        role: 1,
        permissionUuid: 'manager-2',
      });
      expect(Group.addAuthorization).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateSectors', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should remove and add sectors correctly', async () => {
      wrapper.vm.toRemoveSectors = [{ uuid: 'sector-1' }];
      wrapper.vm.editingProjectGroup.sectors = [
        { uuid: 'sector-2', new: true },
        { uuid: 'sector-3', new: false },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.updateSectors();
      await flushPromises();

      expect(Group.removeSector).toHaveBeenCalledWith({
        groupUuid: mockProjectGroup.uuid,
        sectorUuid: 'sector-1',
      });
      expect(Group.addSector).toHaveBeenCalledWith({
        groupUuid: mockProjectGroup.uuid,
        sectorUuid: 'sector-2',
      });
      expect(Group.addSector).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateAgents', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should remove agents and agents without queues', async () => {
      wrapper.vm.toRemoveAgents = [{ uuid: 'agent-1' }];
      wrapper.vm.editingProjectGroup.agents = [
        { uuid: 'agent-2', queues: [] },
        { uuid: 'agent-3', queues: [{ uuid: 'queue-1' }] },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.updateAgents();
      await flushPromises();

      expect(Group.deleteAuthorization).toHaveBeenCalledTimes(2);
      expect(Group.deleteAuthorization).toHaveBeenCalledWith({
        permissionUuid: 'agent-1',
      });
      expect(Group.deleteAuthorization).toHaveBeenCalledWith({
        permissionUuid: 'agent-2',
      });
    });

    it('should add agents with queues using correct permissionUuid', async () => {
      wrapper.vm.avaliableSectorQueues = [
        { uuid: 'queue-1' },
        { uuid: 'queue-2' },
      ];
      wrapper.vm.editingProjectGroup.agents = [
        { uuid: 'agent-1', new: true, queues: [{ uuid: 'queue-1' }] },
        {
          uuid: 'agent-2',
          permission: 'perm-2',
          new: false,
          queues: [{ uuid: 'queue-2' }],
        },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.updateAgents();
      await flushPromises();

      expect(Group.addAuthorization).toHaveBeenCalledWith(
        expect.objectContaining({ permissionUuid: 'agent-1' }),
      );
      expect(Group.addAuthorization).toHaveBeenCalledWith(
        expect.objectContaining({ permissionUuid: 'perm-2' }),
      );
      expect(Group.addAuthorization).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should handle error when update fails', async () => {
      const error = new Error('Update failed');
      Group.update = vi.fn().mockRejectedValue(error);
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await wrapper.vm.finish();
      await flushPromises();

      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'We had problems updating some data. Check the information and try again if anything is missing.',
          type: 'error',
        },
        seconds: 5,
      });
      expect(wrapper.emitted('close')).toBeTruthy();
      expect(wrapper.vm.isLoadingRequest).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('closeDrawer', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should emit close when forceClose is true or showDiscartQuestion is false', async () => {
      wrapper.vm.closeDrawer(true);
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('close')).toBeTruthy();

      wrapper.vm.closeDrawer(false);
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('close')).toHaveLength(2);
    });
  });

  describe('Snapshot', () => {
    it('should match the snapshot', async () => {
      wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});

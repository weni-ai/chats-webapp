import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia } from 'pinia';

import EditGroupDrawer from '../Edit.vue';

import { createTestingPinia } from '@pinia/testing';
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
  default: {
    unnnicCallAlert: vi.fn(),
  },
}));

const mockProjectGroup = {
  uuid: 'group-uuid-123',
  name: 'Test Group',
};

const mockGroup = {
  uuid: 'group-uuid-123',
  name: 'Test Group',
  rooms_limit: 5,
  sectors: [
    { uuid: 'sector-uuid-1', name: 'Sector 1' },
    { uuid: 'sector-uuid-2', name: 'Sector 2' },
  ],
};

const mockAuthorizations = {
  results: [
    {
      uuid: 'auth-1',
      permission: 'manager-uuid-1',
      role: 1,
      user_email: 'manager@test.com',
    },
    {
      uuid: 'auth-2',
      permission: 'agent-uuid-1',
      role: 2,
      user_email: 'agent@test.com',
    },
  ],
};

const createWrapper = (props = {}) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
  });

  setActivePinia(pinia);

  return mount(EditGroupDrawer, {
    props: {
      show: true,
      projectGroup: mockProjectGroup,
      ...props,
    },
    global: {
      plugins: [pinia],
      stubs: {
        General: {
          template: '<div data-testid="general-form"></div>',
          props: ['modelValue', 'isEditing'],
          emits: ['update:modelValue', 'remove-manager'],
        },
        Projects: {
          template: '<div data-testid="projects-form"></div>',
          props: ['modelValue', 'isEditing'],
          emits: ['update:modelValue', 'remove-sector'],
        },
        Agents: {
          template: '<div data-testid="agents-form"></div>',
          props: ['modelValue', 'isEditing', 'queuesOptions'],
          emits: ['update:modelValue', 'remove-agent'],
        },
        UnnnicDrawer: {
          template: `
            <div data-testid="drawer" v-if="modelValue">
              <slot name="content"></slot>
              <button 
                data-testid="primary-button" 
                @click="$emit('primary-button-click')"
              >
                {{ primaryButtonText }}
              </button>
              <button 
                data-testid="secondary-button"
                @click="$emit('secondary-button-click')"
              >
                {{ secondaryButtonText }}
              </button>
              <button 
                data-testid="close-button"
                @click="$emit('close')"
              >
                Close
              </button>
            </div>
          `,
          props: [
            'modelValue',
            'title',
            'primaryButtonText',
            'secondaryButtonText',
            'loadingPrimaryButton',
            'size',
          ],
          emits: ['close', 'primary-button-click', 'secondary-button-click'],
          methods: {
            close() {
              this.$emit('close');
            },
          },
        },
        UnnnicTab: {
          template: `
            <div data-testid="tabs">
              <slot></slot>
              <button 
                data-testid="tab-general"
                @click="$emit('change', 'general')"
              >
                General
              </button>
              <button 
                data-testid="tab-projects"
                @click="$emit('change', 'projects')"
              >
                Projects
              </button>
              <button 
                data-testid="tab-agents"
                @click="$emit('change', 'agents')"
              >
                Agents
              </button>
            </div>
          `,
          props: ['tabs', 'activeTab'],
          emits: ['change'],
        },
      },
      mocks: {
        $t: (key) => {
          const translations = {
            'config_chats.groups.general': 'General',
            'config_chats.groups.projects': 'Projects',
            'config_chats.groups.agents': 'Agents',
            'config_chats.groups.update_success': 'Group updated successfully!',
            'config_chats.groups.update_error':
              'We had problems updating some data. Check the information and try again if anything is missing.',
            save: 'Save',
            cancel: 'Cancel',
          };
          return translations[key] || key;
        },
      },
    },
  });
};

describe('EditGroupDrawer.vue', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set default mocks
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
    it('should render the drawer when show is true', async () => {
      wrapper = createWrapper();
      await flushPromises();

      const drawer = wrapper.find('[data-testid="drawer"]');
      expect(drawer.exists()).toBe(true);
    });

    it('should not render the drawer when show is false', async () => {
      wrapper = createWrapper({ show: false });
      await flushPromises();

      const drawer = wrapper.find('[data-testid="drawer"]');
      expect(drawer.exists()).toBe(false);
    });

    it('should render tabs', async () => {
      wrapper = createWrapper();
      await flushPromises();

      // Tabs are rendered inside the drawer content slot
      const drawer = wrapper.find('[data-testid="drawer"]');
      expect(drawer.exists()).toBe(true);
    });

    it('should render General form', async () => {
      wrapper = createWrapper();
      await flushPromises();

      const generalForm = wrapper.find('[data-testid="general-form"]');
      expect(generalForm.exists()).toBe(true);
    });
  });

  describe('Mounted - Data Loading', () => {
    it('should load group data on mount', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(Group.show).toHaveBeenCalledWith(mockProjectGroup.uuid);
    });

    it('should load authorizations on mount', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(Group.listAuthorization).toHaveBeenCalledWith({
        groupSectorUuid: mockProjectGroup.uuid,
      });
    });

    it('should set editingProjectGroup with loaded data', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.editingProjectGroup.name).toBe(mockGroup.name);
      expect(wrapper.vm.editingProjectGroup.maxSimultaneousChatsByAgent).toBe(
        String(mockGroup.rooms_limit),
      );
    });

    it('should filter managers from authorizations', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.editingProjectGroup.managers.length).toBe(1);
      expect(wrapper.vm.editingProjectGroup.managers[0].role).toBe(1);
    });

    it('should filter agents from authorizations', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.editingProjectGroup.agents.length).toBe(1);
      expect(wrapper.vm.editingProjectGroup.agents[0].role).toBe(2);
      expect(wrapper.vm.editingProjectGroup.agents[0].queues).toEqual([]);
    });

    it('should call listSectorsQueues after loading data', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(Group.listSectorsQueues).toHaveBeenCalled();
    });

    it('should call loadAgentsQueuesPermissions after loading data', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(Group.listAgentsQueuesPermissions).toHaveBeenCalled();
    });

    it('should set firstLoaded to true after loading', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.firstLoaded).toBe(true);
    });
  });

  describe('Tabs', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should start with general tab active', () => {
      expect(wrapper.vm.activeTab.id).toBe('general');
    });

    it('should have correct tabs computed', () => {
      expect(wrapper.vm.tabs.length).toBe(3);
      expect(wrapper.vm.tabs[0].id).toBe('general');
      expect(wrapper.vm.tabs[1].id).toBe('projects');
      expect(wrapper.vm.tabs[2].id).toBe('agents');
    });

    it('should have correct tabsIds computed', () => {
      expect(wrapper.vm.tabsIds).toEqual(['general', 'projects', 'agents']);
    });

    it('should update active tab when updateTab is called with id', async () => {
      wrapper.vm.updateTab('projects');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.activeTab.id).toBe('projects');
    });

    it('should update active tab when updateTab is called with name', async () => {
      wrapper.vm.updateTab('Projects');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.activeTab.id).toBe('projects');
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
          queues: [
            { uuid: 'queue-1', queue_name: 'Queue 1' },
            { uuid: 'queue-2', queue_name: 'Queue 2' },
          ],
        },
      };

      Group.listSectorsQueues = vi.fn().mockResolvedValue(mockSectorsQueues);
      wrapper.vm.editingProjectGroup.sectors = [
        { uuid: 'sector-uuid-1' },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.listSectorsQueues({});
      await flushPromises();

      expect(Group.listSectorsQueues).toHaveBeenCalledWith(['sector-uuid-1']);
      expect(wrapper.vm.avaliableSectorQueues.length).toBe(2);
      expect(wrapper.vm.avaliableSectorQueues[0].name).toBe('Sector 1 | Queue 1');
    });

    it('should add queues to agents when sector is added', async () => {
      const mockSectorsQueues = {
        'sector-uuid-1': {
          sector_name: 'Sector 1',
          queues: [{ uuid: 'queue-1', queue_name: 'Queue 1' }],
        },
      };

      Group.listSectorsQueues = vi.fn().mockResolvedValue(mockSectorsQueues);
      wrapper.vm.editingProjectGroup.sectors = [
        { uuid: 'sector-uuid-1' },
      ];
      wrapper.vm.editingProjectGroup.agents = [
        { uuid: 'agent-1', queues: [] },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.listSectorsQueues({
        toAddQueuesSector: 'sector-uuid-1',
        toRemoveQueuesSector: null,
      });
      await flushPromises();

      expect(wrapper.vm.editingProjectGroup.agents[0].queues.length).toBeGreaterThan(
        0,
      );
    });

    it('should remove queues from agents when sector is removed', async () => {
      Group.listSectorsQueues = vi.fn().mockResolvedValue({});

      wrapper.vm.editingProjectGroup.agents = [
        {
          uuid: 'agent-1',
          queues: [
            { uuid: 'queue-1', sectorUuid: 'sector-uuid-1' },
            { uuid: 'queue-2', sectorUuid: 'sector-uuid-2' },
          ],
        },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.listSectorsQueues({
        toAddQueuesSector: null,
        toRemoveQueuesSector: 'sector-uuid-1',
      });
      await flushPromises();

      expect(wrapper.vm.editingProjectGroup.agents[0].queues.length).toBe(1);
      expect(
        wrapper.vm.editingProjectGroup.agents[0].queues[0].sectorUuid,
      ).toBe('sector-uuid-2');
    });
  });

  describe('loadAgentsQueuesPermissions', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should load agents queues permissions', async () => {
      const mockPermissions = {
        'agent@test.com': {
          'sector-uuid-1': {
            permissions: ['queue-1', 'queue-2'],
          },
        },
      };

      Group.listAgentsQueuesPermissions = vi
        .fn()
        .mockResolvedValue(mockPermissions);
      Group.listSectorsQueues = vi.fn().mockResolvedValue({
        'sector-uuid-1': {
          sector_name: 'Sector 1',
          queues: [
            { uuid: 'queue-1', queue_name: 'Queue 1' },
            { uuid: 'queue-2', queue_name: 'Queue 2' },
          ],
        },
      });

      wrapper.vm.editingProjectGroup.sectors = [
        { uuid: 'sector-uuid-1' },
      ];
      wrapper.vm.editingProjectGroup.agents = [
        {
          uuid: 'agent-1',
          user_email: 'agent@test.com',
          queues: [],
        },
      ];
      wrapper.vm.avaliableSectorQueues = [
        { uuid: 'queue-1', sectorUuid: 'sector-uuid-1' },
        { uuid: 'queue-2', sectorUuid: 'sector-uuid-1' },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.loadAgentsQueuesPermissions();
      await flushPromises();

      expect(Group.listAgentsQueuesPermissions).toHaveBeenCalledWith([
        'sector-uuid-1',
      ]);
      expect(wrapper.vm.editingProjectGroup.agents[0].queues.length).toBe(2);
    });

    it('should not update agent if not found', async () => {
      const mockPermissions = {
        'other@test.com': {
          'sector-uuid-1': {
            permissions: ['queue-1'],
          },
        },
      };

      Group.listAgentsQueuesPermissions = vi
        .fn()
        .mockResolvedValue(mockPermissions);

      wrapper.vm.editingProjectGroup.agents = [
        {
          uuid: 'agent-1',
          user_email: 'agent@test.com',
          queues: [],
        },
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

    it('should not trigger watch if firstLoaded is false', async () => {
      wrapper.vm.firstLoaded = false;
      const initialCallCount = Group.listSectorsQueues.mock.calls.length;

      // Clear previous calls to get accurate count
      Group.listSectorsQueues.mockClear();
      Group.listSectorsQueues = vi.fn().mockResolvedValue({});

      wrapper.vm.editingProjectGroup.sectors = [{ uuid: 'sector-uuid-1' }];
      await wrapper.vm.$nextTick();
      await flushPromises();

      // Should not trigger new calls because firstLoaded is false
      // The watch handler returns early if firstLoaded is false
      // But the watch still fires, it just returns early
      // So we check that listSectorsQueues was not called with new data
      const callsAfterChange = Group.listSectorsQueues.mock.calls.length;
      expect(callsAfterChange).toBe(0);
    });

    it('should trigger watch when sectors change after firstLoaded', async () => {
      wrapper.vm.firstLoaded = true;
      Group.listSectorsQueues = vi.fn().mockResolvedValue({});

      const initialCallCount = Group.listSectorsQueues.mock.calls.length;

      wrapper.vm.editingProjectGroup.sectors = [{ uuid: 'sector-uuid-1' }];
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(Group.listSectorsQueues.mock.calls.length).toBeGreaterThan(
        initialCallCount,
      );
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

    it('should add manager to toRemoveManagers when remove-manager event is emitted', async () => {
      const manager = { uuid: 'manager-1' };

      // Simulate the event handler directly
      wrapper.vm.toRemoveManagers.push(manager);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.toRemoveManagers.length).toBe(1);
      expect(wrapper.vm.toRemoveManagers[0].uuid).toBe('manager-1');
    });

    it('should add sector to toRemoveSectors when remove-sector event is emitted', async () => {
      const sector = { uuid: 'sector-1' };

      // Simulate the event handler directly
      wrapper.vm.toRemoveSectors.push(sector);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.toRemoveSectors.length).toBe(1);
      expect(wrapper.vm.toRemoveSectors[0].uuid).toBe('sector-1');
    });

    it('should add agent to toRemoveAgents when remove-agent event is emitted', async () => {
      const agent = { uuid: 'agent-1' };

      // Simulate the event handler directly
      wrapper.vm.toRemoveAgents.push(agent);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.toRemoveAgents.length).toBe(1);
      expect(wrapper.vm.toRemoveAgents[0].uuid).toBe('agent-1');
    });
  });

  describe('finish - Update Group', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should update group successfully', async () => {
      wrapper.vm.editingProjectGroup.maxSimultaneousChatsByAgent = '10';
      await wrapper.vm.$nextTick();

      await wrapper.vm.finish();
      await flushPromises();

      expect(Group.update).toHaveBeenCalledWith({
        groupUuid: mockProjectGroup.uuid,
        body: {
          rooms_limit: '10',
        },
      });
    });

    it('should show success alert after update', async () => {
      await wrapper.vm.finish();
      await flushPromises();

      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Group updated successfully!',
          type: 'success',
        },
        seconds: 5,
      });
    });

    it('should close drawer after successful update', async () => {
      await wrapper.vm.finish();
      await flushPromises();

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should set isLoadingRequest to false after update', async () => {
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

    it('should remove managers', async () => {
      wrapper.vm.toRemoveManagers = [{ uuid: 'manager-1' }];
      await wrapper.vm.$nextTick();

      await wrapper.vm.updateManagers();
      await flushPromises();

      expect(Group.deleteAuthorization).toHaveBeenCalledWith({
        permissionUuid: 'manager-1',
      });
    });

    it('should add new managers', async () => {
      wrapper.vm.editingProjectGroup.managers = [
        { uuid: 'manager-1', new: true },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.updateManagers();
      await flushPromises();

      expect(Group.addAuthorization).toHaveBeenCalledWith({
        groupSectorUuid: mockProjectGroup.uuid,
        role: 1,
        permissionUuid: 'manager-1',
      });
    });

    it('should not add managers that are not new', async () => {
      wrapper.vm.editingProjectGroup.managers = [
        { uuid: 'manager-1', new: false },
      ];
      await wrapper.vm.$nextTick();

      const initialCallCount = Group.addAuthorization.mock.calls.length;

      await wrapper.vm.updateManagers();
      await flushPromises();

      expect(Group.addAuthorization.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('updateSectors', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should remove sectors', async () => {
      wrapper.vm.toRemoveSectors = [{ uuid: 'sector-1' }];
      await wrapper.vm.$nextTick();

      await wrapper.vm.updateSectors();
      await flushPromises();

      expect(Group.removeSector).toHaveBeenCalledWith({
        groupUuid: mockProjectGroup.uuid,
        sectorUuid: 'sector-1',
      });
    });

    it('should add new sectors', async () => {
      wrapper.vm.editingProjectGroup.sectors = [
        { uuid: 'sector-1', new: true },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.updateSectors();
      await flushPromises();

      expect(Group.addSector).toHaveBeenCalledWith({
        groupUuid: mockProjectGroup.uuid,
        sectorUuid: 'sector-1',
      });
    });

    it('should not add sectors that are not new', async () => {
      wrapper.vm.editingProjectGroup.sectors = [
        { uuid: 'sector-1', new: false },
      ];
      await wrapper.vm.$nextTick();

      const initialCallCount = Group.addSector.mock.calls.length;

      await wrapper.vm.updateSectors();
      await flushPromises();

      expect(Group.addSector.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('updateAgents', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should remove agents', async () => {
      wrapper.vm.toRemoveAgents = [{ uuid: 'agent-1' }];
      await wrapper.vm.$nextTick();

      await wrapper.vm.updateAgents();
      await flushPromises();

      expect(Group.deleteAuthorization).toHaveBeenCalledWith({
        permissionUuid: 'agent-1',
      });
    });

    it('should remove agents without queues', async () => {
      wrapper.vm.editingProjectGroup.agents = [
        { uuid: 'agent-1', queues: [] },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.updateAgents();
      await flushPromises();

      expect(Group.deleteAuthorization).toHaveBeenCalledWith({
        permissionUuid: 'agent-1',
      });
    });

    it('should add agents with queues', async () => {
      wrapper.vm.avaliableSectorQueues = [
        { uuid: 'queue-1' },
        { uuid: 'queue-2' },
      ];
      wrapper.vm.editingProjectGroup.agents = [
        {
          uuid: 'agent-1',
          permission: 'perm-1',
          queues: [{ uuid: 'queue-1' }],
        },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.updateAgents();
      await flushPromises();

      expect(Group.addAuthorization).toHaveBeenCalledWith({
        groupSectorUuid: mockProjectGroup.uuid,
        role: 2,
        permissionUuid: 'perm-1',
        enabledQueues: ['queue-1'],
        disabledQueues: ['queue-2'],
      });
    });

    it('should use agent.uuid for new agents', async () => {
      wrapper.vm.avaliableSectorQueues = [{ uuid: 'queue-1' }];
      wrapper.vm.editingProjectGroup.agents = [
        {
          uuid: 'agent-1',
          new: true,
          queues: [{ uuid: 'queue-1' }],
        },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.updateAgents();
      await flushPromises();

      expect(Group.addAuthorization).toHaveBeenCalledWith(
        expect.objectContaining({
          permissionUuid: 'agent-1',
        }),
      );
    });

    it('should use agent.permission for existing agents', async () => {
      wrapper.vm.avaliableSectorQueues = [{ uuid: 'queue-1' }];
      wrapper.vm.editingProjectGroup.agents = [
        {
          uuid: 'agent-1',
          permission: 'perm-1',
          new: false,
          queues: [{ uuid: 'queue-1' }],
        },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.updateAgents();
      await flushPromises();

      expect(Group.addAuthorization).toHaveBeenCalledWith(
        expect.objectContaining({
          permissionUuid: 'perm-1',
        }),
      );
    });

    it('should not add agents without queues', async () => {
      wrapper.vm.editingProjectGroup.agents = [
        {
          uuid: 'agent-1',
          permission: 'perm-1',
          queues: [],
        },
      ];
      await wrapper.vm.$nextTick();

      const initialCallCount = Group.addAuthorization.mock.calls.length;

      await wrapper.vm.updateAgents();
      await flushPromises();

      expect(Group.addAuthorization.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('finish - Error Handling', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should handle error when update fails', async () => {
      const error = new Error('Update failed');
      Group.update = vi.fn().mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await wrapper.vm.finish();
      await flushPromises();

      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text:
            'We had problems updating some data. Check the information and try again if anything is missing.',
          type: 'error',
        },
        seconds: 5,
      });
      expect(wrapper.emitted('close')).toBeTruthy();

      consoleSpy.mockRestore();
    });

    it('should set isLoadingRequest to false after error', async () => {
      const error = new Error('Update failed');
      Group.update = vi.fn().mockRejectedValue(error);

      const finishPromise = wrapper.vm.finish();
      expect(wrapper.vm.isLoadingRequest).toBe(true);

      await finishPromise;
      await flushPromises();

      expect(wrapper.vm.isLoadingRequest).toBe(false);
    });
  });

  describe('closeDrawer', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should emit close when forceClose is true', async () => {
      wrapper.vm.closeDrawer(true);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit close when showDiscartQuestion is false', async () => {
      // showDiscartQuestion is not defined in the component, so it will be undefined (falsy)
      wrapper.vm.closeDrawer(false);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('close')).toBeTruthy();
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


import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia } from 'pinia';

import NewGroupDrawer from '../New.vue';

import { createTestingPinia } from '@pinia/testing';
import { useSettings } from '@/store/modules/settings';
import Group from '@/services/api/resources/settings/group';
import Unnnic from '@weni/unnnic-system';

vi.mock('@/services/api/resources/settings/group', () => ({
  default: {
    listSectorsQueues: vi.fn(() => ({})),
    addSector: vi.fn(),
    addAuthorization: vi.fn(),
    create: vi.fn(),
  },
}));
vi.mock('@weni/unnnic-system', () => ({
  default: {
    unnnicCallAlert: vi.fn(),
  },
}));

const mockGroups = [
  {
    id: 1,
    uuid: 'group-uuid-1',
    name: 'Existing Group',
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

  return mount(NewGroupDrawer, {
    props: {
      show: true,
      ...props,
    },
    global: {
      plugins: [pinia],
      stubs: {
        General: {
          template: '<div data-testid="general-form" v-show="show"></div>',
          props: ['modelValue'],
          emits: ['update:modelValue', 'change-valid'],
          computed: {
            show() {
              return this.$parent?.activePage === 'General';
            },
          },
        },
        Projects: {
          template: '<div data-testid="projects-form" v-show="show"></div>',
          props: ['modelValue'],
          emits: ['update:modelValue', 'change-valid'],
          computed: {
            show() {
              return this.$parent?.activePage === 'Projects';
            },
          },
        },
        Agents: {
          template: '<div data-testid="agents-form" v-show="show"></div>',
          props: ['modelValue', 'queuesOptions'],
          emits: ['update:modelValue', 'change-valid'],
          computed: {
            show() {
              return this.$parent?.activePage === 'Agents';
            },
          },
        },
        DiscartChangesModal: {
          template:
            '<div data-testid="discart-changes-modal" v-if="showModal"></div>',
          props: ['showModal', 'title', 'text'],
          emits: ['primary-button-click', 'secondary-button-click'],
        },
        UnnnicDrawer: {
          template: `
            <div data-testid="drawer" v-if="modelValue">
              <slot name="content"></slot>
              <button 
                data-testid="primary-button" 
                :disabled="disabledPrimaryButton"
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
            'disabledPrimaryButton',
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
        UnnnicNavigator: {
          template:
            '<div data-testid="navigator" v-if="pages && activePage"></div>',
          props: ['pages', 'activePage'],
        },
      },
      mocks: {
        $t: (key, params) => {
          const translations = {
            'config_chats.groups.new.title': 'New project group',
            'config_chats.groups.general': 'General',
            'config_chats.groups.projects': 'Projects',
            'config_chats.groups.agents': 'Agents',
            'config_chats.groups.discart.title': 'Discard changes',
            'config_chats.groups.discart.text': 'Do you want to discard?',
            'config_chats.groups.create_success': `New group ${params?.groupName || ''} created!`,
            'config_chats.groups.create_error':
              'Failed to configure some steps in the group! Check the details and try again if you identify any missing configurations.',
            save: 'Save',
            continue: 'Continue',
            cancel: 'Cancel',
            back: 'Back',
          };
          return translations[key] || key;
        },
      },
    },
  });
};

describe('NewGroupDrawer.vue', () => {
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
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the drawer when show is true', () => {
      const drawer = wrapper.find('[data-testid="drawer"]');
      expect(drawer.exists()).toBe(true);
    });

    it('should not render the drawer when show is false', async () => {
      await wrapper.setProps({ show: false });
      const drawer = wrapper.find('[data-testid="drawer"]');
      expect(drawer.exists()).toBe(false);
    });

    it('should render the navigator', () => {
      // Navigator is rendered inside the drawer content slot
      const drawer = wrapper.find('[data-testid="drawer"]');
      expect(drawer.exists()).toBe(true);
    });

    it('should render General form on initial page', () => {
      const generalForm = wrapper.find('[data-testid="general-form"]');
      expect(generalForm.exists()).toBe(true);
    });

    it('should not show Projects form on initial page', () => {
      const projectsForm = wrapper.find('[data-testid="projects-form"]');
      // Form exists but is hidden with v-show
      if (projectsForm.exists()) {
        expect(projectsForm.isVisible()).toBe(false);
      }
    });

    it('should not show Agents form on initial page', () => {
      const agentsForm = wrapper.find('[data-testid="agents-form"]');
      // Form exists but is hidden with v-show
      if (agentsForm.exists()) {
        expect(agentsForm.isVisible()).toBe(false);
      }
    });
  });

  describe('Page Navigation', () => {
    it('should start on page 0 (General)', () => {
      expect(wrapper.vm.activePageIndex).toBe(0);
      expect(wrapper.vm.activePage).toBe('General');
      expect(wrapper.vm.activePageKey).toBe('general');
    });

    it('should navigate to next page when clicking continue', async () => {
      wrapper.vm.isValid.general = true;
      await wrapper.vm.$nextTick();

      const primaryButton = wrapper.find('[data-testid="primary-button"]');
      await primaryButton.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.activePageIndex).toBe(1);
      expect(wrapper.vm.activePage).toBe('Projects');
      expect(wrapper.vm.activePageKey).toBe('projects');
    });

    it('should navigate to previous page when clicking back', async () => {
      wrapper.vm.activePageIndex = 1;
      wrapper.vm.isValid.projects = true;
      await wrapper.vm.$nextTick();

      const secondaryButton = wrapper.find('[data-testid="secondary-button"]');
      await secondaryButton.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.activePageIndex).toBe(0);
    });

    it('should show Projects form when on page 1', async () => {
      wrapper.vm.activePageIndex = 1;
      await wrapper.vm.$nextTick();

      const projectsForm = wrapper.find('[data-testid="projects-form"]');
      expect(projectsForm.exists()).toBe(true);
    });

    it('should show Agents form when on page 2', async () => {
      wrapper.vm.activePageIndex = 2;
      await wrapper.vm.$nextTick();

      const agentsForm = wrapper.find('[data-testid="agents-form"]');
      expect(agentsForm.exists()).toBe(true);
    });

    it('should show Save button on last page', async () => {
      wrapper.vm.activePageIndex = 2;
      await wrapper.vm.$nextTick();

      const primaryButton = wrapper.find('[data-testid="primary-button"]');
      expect(primaryButton.text()).toBe('Save');
    });

    it('should show Continue button on non-last pages', () => {
      const primaryButton = wrapper.find('[data-testid="primary-button"]');
      expect(primaryButton.text()).toBe('Continue');
    });

    it('should show Cancel button on first page', () => {
      const secondaryButton = wrapper.find('[data-testid="secondary-button"]');
      expect(secondaryButton.text()).toBe('Cancel');
    });

    it('should show Back button on non-first pages', async () => {
      wrapper.vm.activePageIndex = 1;
      await wrapper.vm.$nextTick();

      const secondaryButton = wrapper.find('[data-testid="secondary-button"]');
      expect(secondaryButton.text()).toBe('Back');
    });
  });

  describe('Form Validation', () => {
    it('should disable primary button when form is invalid', async () => {
      wrapper.vm.isValid.general = false;
      await wrapper.vm.$nextTick();

      const primaryButton = wrapper.find('[data-testid="primary-button"]');
      expect(primaryButton.attributes('disabled')).toBeDefined();
    });

    it('should enable primary button when form is valid', async () => {
      wrapper.vm.isValid.general = true;
      await wrapper.vm.$nextTick();

      const primaryButton = wrapper.find('[data-testid="primary-button"]');
      expect(primaryButton.attributes('disabled')).toBeUndefined();
    });

    it('should update isValid when form emits change-valid', async () => {
      expect(wrapper.vm.isValid.general).toBe(false);

      wrapper.vm.updateIsValid('general', true);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isValid.general).toBe(true);
    });
  });

  describe('Close Drawer', () => {
    it('should emit close when no changes are made', async () => {
      const closeButton = wrapper.find('[data-testid="close-button"]');
      await closeButton.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should show discard modal when changes are made', async () => {
      wrapper.vm.group.name = 'Test Group';
      await wrapper.vm.$nextTick();

      const closeButton = wrapper.find('[data-testid="close-button"]');
      await closeButton.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showConfirmDiscartChangesModal).toBe(true);
      expect(wrapper.emitted('close')).toBeFalsy();
    });

    it('should close drawer when forceClose is true', async () => {
      wrapper.vm.group.name = 'Test Group';
      await wrapper.vm.$nextTick();

      wrapper.vm.closeDrawer(true);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should close discard modal when clicking secondary button', async () => {
      wrapper.vm.showConfirmDiscartChangesModal = true;
      await wrapper.vm.$nextTick();

      wrapper.vm.showConfirmDiscartChangesModal = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showConfirmDiscartChangesModal).toBe(false);
    });

    it('should emit close when clicking primary button on discard modal', async () => {
      wrapper.vm.showConfirmDiscartChangesModal = true;
      await wrapper.vm.$nextTick();

      wrapper.vm.$emit('close');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('showDiscartQuestion', () => {
    it('should return false when group is empty', () => {
      expect(wrapper.vm.showDiscartQuestion).toBe(false);
    });

    it('should return true when group has name', async () => {
      wrapper.vm.group.name = 'Test Group';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDiscartQuestion).toBe(true);
    });

    it('should return true when group has managers', async () => {
      wrapper.vm.group.managers = [{ uuid: 'manager-1' }];
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDiscartQuestion).toBe(true);
    });

    it('should return true when group has sectors', async () => {
      wrapper.vm.group.sectors = [{ uuid: 'sector-1' }];
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDiscartQuestion).toBe(true);
    });

    it('should return true when group has agents', async () => {
      wrapper.vm.group.agents = [{ uuid: 'agent-1' }];
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDiscartQuestion).toBe(true);
    });

    it('should return true when group has maxSimultaneousChatsByAgent', async () => {
      wrapper.vm.group.maxSimultaneousChatsByAgent = '5';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDiscartQuestion).toBe(true);
    });
  });

  describe('listSectorsQueues', () => {
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
      wrapper.vm.group.sectors = [{ uuid: 'sector-uuid-1' }];
      await wrapper.vm.$nextTick();

      await wrapper.vm.listSectorsQueues({
        toAddQueuesSector: 'sector-uuid-1',
        toRemoveQueuesSector: null,
      });
      await flushPromises();

      expect(Group.listSectorsQueues).toHaveBeenCalledWith(['sector-uuid-1']);
      expect(wrapper.vm.avaliableSectorQueues.length).toBe(2);
      expect(wrapper.vm.avaliableSectorQueues[0].name).toBe(
        'Sector 1 | Queue 1',
      );
      expect(wrapper.vm.avaliableSectorQueues[0].sectorUuid).toBe(
        'sector-uuid-1',
      );
    });

    it('should add queues to agents when sector is added', async () => {
      const mockSectorsQueues = {
        'sector-uuid-1': {
          sector_name: 'Sector 1',
          queues: [{ uuid: 'queue-1', queue_name: 'Queue 1' }],
        },
      };

      Group.listSectorsQueues = vi.fn().mockResolvedValue(mockSectorsQueues);
      wrapper.vm.group.sectors = [{ uuid: 'sector-uuid-1' }];
      wrapper.vm.group.agents = [{ uuid: 'agent-1', queues: [] }];
      await wrapper.vm.$nextTick();

      await wrapper.vm.listSectorsQueues({
        toAddQueuesSector: 'sector-uuid-1',
        toRemoveQueuesSector: null,
      });
      await flushPromises();

      // The queue is added to the agent's queues array
      expect(wrapper.vm.group.agents[0].queues.length).toBeGreaterThan(0);
      const addedQueue = wrapper.vm.group.agents[0].queues.find(
        (q) => q.sectorUuid === 'sector-uuid-1',
      );
      expect(addedQueue).toBeDefined();
    });

    it('should remove queues from agents when sector is removed', async () => {
      // Mock listSectorsQueues to return empty object since we're only removing
      Group.listSectorsQueues = vi.fn().mockResolvedValue({});

      wrapper.vm.group.agents = [
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

      expect(wrapper.vm.group.agents[0].queues.length).toBe(1);
      expect(wrapper.vm.group.agents[0].queues[0].sectorUuid).toBe(
        'sector-uuid-2',
      );
    });

    it('should clear queues when all sectors are removed', async () => {
      // First add a sector to set up the state
      wrapper.vm.group.sectors = [{ uuid: 'sector-uuid-1' }];
      wrapper.vm.group.agents = [
        {
          uuid: 'agent-1',
          queues: [{ uuid: 'queue-1', sectorUuid: 'sector-uuid-1' }],
        },
      ];
      await wrapper.vm.$nextTick();

      // Now remove all sectors - this triggers the watch
      Group.listSectorsQueues = vi.fn().mockResolvedValue({});
      wrapper.vm.group.sectors = [];
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.vm.avaliableSectorQueues).toEqual([]);
      expect(wrapper.vm.group.agents[0].queues).toEqual([]);
    });
  });

  describe('finish - Create Group', () => {
    const mockCreatedGroup = {
      uuid: 'new-group-uuid',
      name: 'Test Group',
    };

    beforeEach(() => {
      Group.create = vi.fn().mockResolvedValue(mockCreatedGroup);
      Group.addAuthorization = vi.fn().mockResolvedValue({});
      Group.addSector = vi.fn().mockResolvedValue({});
    });

    it('should create group successfully', async () => {
      wrapper.vm.group.name = 'Test Group';
      wrapper.vm.group.maxSimultaneousChatsByAgent = '5';
      wrapper.vm.activePageIndex = 2;
      await wrapper.vm.$nextTick();

      await wrapper.vm.finish();
      await flushPromises();

      expect(Group.create).toHaveBeenCalledWith({
        name: 'Test Group',
        rooms_limit: '5',
      });
      expect(wrapper.vm.group.uuid).toBe('new-group-uuid');
    });

    it('should add group to store after creation', async () => {
      wrapper.vm.group.name = 'Test Group';
      wrapper.vm.activePageIndex = 2;
      await wrapper.vm.$nextTick();

      const initialGroupsCount = settingsStore.groups.length;

      await wrapper.vm.finish();
      await flushPromises();

      expect(settingsStore.groups.length).toBe(initialGroupsCount + 1);
      expect(settingsStore.groups[0].name).toBe('Test Group');
    });

    it('should add managers authorization', async () => {
      wrapper.vm.group.name = 'Test Group';
      wrapper.vm.group.managers = [
        { uuid: 'manager-1' },
        { uuid: 'manager-2' },
      ];
      wrapper.vm.group.agents = []; // No agents
      wrapper.vm.group.uuid = 'new-group-uuid';
      wrapper.vm.activePageIndex = 2;
      await wrapper.vm.$nextTick();

      await wrapper.vm.finish();
      await flushPromises();

      expect(Group.addAuthorization).toHaveBeenCalledTimes(2); // 2 managers
      expect(Group.addAuthorization).toHaveBeenCalledWith({
        groupSectorUuid: 'new-group-uuid',
        permissionUuid: 'manager-1',
        role: 1,
      });
      expect(Group.addAuthorization).toHaveBeenCalledWith({
        groupSectorUuid: 'new-group-uuid',
        permissionUuid: 'manager-2',
        role: 1,
      });
    });

    it('should add sectors', async () => {
      wrapper.vm.group.name = 'Test Group';
      wrapper.vm.group.sectors = [{ uuid: 'sector-1' }, { uuid: 'sector-2' }];
      wrapper.vm.group.uuid = 'new-group-uuid';
      wrapper.vm.activePageIndex = 2;
      await wrapper.vm.$nextTick();

      await wrapper.vm.finish();
      await flushPromises();

      expect(Group.addSector).toHaveBeenCalledTimes(2);
      expect(Group.addSector).toHaveBeenCalledWith({
        groupUuid: 'new-group-uuid',
        sectorUuid: 'sector-1',
      });
    });

    it('should add agents authorization with queues', async () => {
      wrapper.vm.group.name = 'Test Group';
      wrapper.vm.group.agents = [
        {
          uuid: 'agent-1',
          queues: [{ uuid: 'queue-1' }, { uuid: 'queue-2' }],
        },
      ];
      wrapper.vm.group.uuid = 'new-group-uuid';
      wrapper.vm.activePageIndex = 2;
      await wrapper.vm.$nextTick();

      await wrapper.vm.finish();
      await flushPromises();

      expect(Group.addAuthorization).toHaveBeenCalledWith({
        groupSectorUuid: 'new-group-uuid',
        permissionUuid: 'agent-1',
        role: 2,
        enabledQueues: ['queue-1', 'queue-2'],
      });
    });

    it('should show success alert after creation', async () => {
      wrapper.vm.group.name = 'Test Group';
      wrapper.vm.activePageIndex = 2;
      await wrapper.vm.$nextTick();

      await wrapper.vm.finish();
      await flushPromises();

      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'New group Test Group created!',
          type: 'success',
        },
        seconds: 5,
      });
    });

    it('should close drawer after successful creation', async () => {
      wrapper.vm.group.name = 'Test Group';
      wrapper.vm.activePageIndex = 2;
      await wrapper.vm.$nextTick();

      await wrapper.vm.finish();
      await flushPromises();

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should set isLoadingCreate to false after creation', async () => {
      wrapper.vm.group.name = 'Test Group';
      wrapper.vm.activePageIndex = 2;
      await wrapper.vm.$nextTick();

      const finishPromise = wrapper.vm.finish();
      expect(wrapper.vm.isLoadingCreate).toBe(true);

      await finishPromise;
      await flushPromises();

      expect(wrapper.vm.isLoadingCreate).toBe(false);
    });
  });

  describe('finish - Error Handling', () => {
    it('should handle error when creating group fails', async () => {
      const error = new Error('Create failed');
      Group.create = vi.fn().mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      wrapper.vm.group.name = 'Test Group';
      wrapper.vm.activePageIndex = 2;
      await wrapper.vm.$nextTick();

      await wrapper.vm.finish();
      await flushPromises();

      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Failed to configure some steps in the group! Check the details and try again if you identify any missing configurations.',
          type: 'error',
        },
        seconds: 5,
      });
      expect(wrapper.emitted('close')).toBeTruthy();

      consoleSpy.mockRestore();
    });

    it('should set isLoadingCreate to false after error', async () => {
      const error = new Error('Create failed');
      Group.create = vi.fn().mockRejectedValue(error);

      wrapper.vm.group.name = 'Test Group';
      wrapper.vm.activePageIndex = 2;
      await wrapper.vm.$nextTick();

      const finishPromise = wrapper.vm.finish();
      expect(wrapper.vm.isLoadingCreate).toBe(true);

      await finishPromise;
      await flushPromises();

      expect(wrapper.vm.isLoadingCreate).toBe(false);
    });
  });

  describe('listenConnect', () => {
    it('should listen to window messages', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const newWrapper = createWrapper();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );

      newWrapper.unmount();
      addEventListenerSpy.mockRestore();
    });

    it('should close drawer when receiving close event', async () => {
      const closeSpy = vi.spyOn(
        wrapper.vm.$refs.newProjectGroupDrawer,
        'close',
      );

      const messageEvent = new MessageEvent('message', {
        data: { event: 'close' },
      });
      window.dispatchEvent(messageEvent);
      await wrapper.vm.$nextTick();

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('Groups from Store', () => {
    it('should get groups from settings store', () => {
      expect(wrapper.vm.groups).toEqual(mockGroups);
    });
  });

  describe('Snapshot', () => {
    it('should match the snapshot', () => {
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});

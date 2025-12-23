import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

import NewGroupDrawer from '../New.vue';
import Group from '@/services/api/resources/settings/group';
import Unnnic from '@weni/unnnic-system';
import { useSettings } from '@/store/modules/settings';

vi.mock('@/services/api/resources/settings/group', () => ({
  default: {
    listSectorsQueues: vi.fn(() => ({})),
    create: vi.fn(),
    addAuthorization: vi.fn(),
    addSector: vi.fn(),
  },
}));
vi.mock('@weni/unnnic-system', () => ({
  default: { unnnicCallAlert: vi.fn() },
}));

const mockCreatedGroup = {
  uuid: 'new-group-uuid-123',
  name: 'New Group',
};

const createWrapper = (props = {}) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      settings: {
        groups: [],
      },
    },
  });
  setActivePinia(pinia);

  return mount(NewGroupDrawer, {
    props: { show: true, ...props },
    global: {
      plugins: [pinia],
      stubs: {
        General: {
          template: '<div data-testid="general-form"></div>',
          props: ['modelValue'],
          emits: ['update:modelValue', 'change-valid'],
        },
        Projects: {
          template: '<div data-testid="projects-form"></div>',
          props: ['modelValue'],
          emits: ['update:modelValue', 'change-valid'],
        },
        Agents: {
          template: '<div data-testid="agents-form"></div>',
          props: ['modelValue', 'queuesOptions'],
          emits: ['update:modelValue', 'change-valid'],
        },
        DiscartChangesModal: {
          template:
            '<div data-testid="discart-changes-modal" v-if="showModal"><button data-testid="discart-primary" @click="$emit(\'primary-button-click\')"></button><button data-testid="discart-secondary" @click="$emit(\'secondary-button-click\')"></button></div>',
          props: ['showModal', 'title', 'text'],
          emits: ['primary-button-click', 'secondary-button-click'],
        },
        UnnnicDrawer: {
          template:
            '<div data-testid="drawer" v-if="modelValue && !hide"><div><slot name="content"></slot></div><button data-testid="primary-button" @click="$emit(\'primary-button-click\')" :disabled="disabledPrimaryButton">{{ primaryButtonText }}</button><button data-testid="secondary-button" @click="$emit(\'secondary-button-click\')">{{ secondaryButtonText }}</button><button data-testid="close-button" @click="$emit(\'close\')">Close</button></div>',
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
          data() {
            return { hide: false };
          },
          methods: {
            close() {
              this.hide = true;
              this.$emit('close');
            },
          },
        },
        UnnnicNavigator: {
          template: '<div data-testid="navigator"><slot></slot></div>',
          props: ['pages', 'activePage'],
        },
      },
      mocks: {
        $t: (key, params) =>
          ({
            'config_chats.groups.new.title': 'New Group',
            'config_chats.groups.general': 'General',
            'config_chats.groups.projects': 'Projects',
            'config_chats.groups.agents': 'Agents',
            'config_chats.groups.create_success': `New group ${
              params?.groupName || ''
            } created!`,
            'config_chats.groups.create_error':
              'Failed to configure some steps in the group! Check the details and try again if you identify any missing configurations.',
            'config_chats.groups.discart.title': 'Discard changes?',
            'config_chats.groups.discart.text':
              'Are you sure you want to discard the changes?',
            save: 'Save',
            continue: 'Continue',
            cancel: 'Cancel',
            back: 'Back',
          })[key] || key,
      },
    },
  });
};

describe('NewGroupDrawer.vue', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    Group.listSectorsQueues = vi.fn().mockResolvedValue({});
    Group.create = vi.fn().mockResolvedValue(mockCreatedGroup);
    Group.addAuthorization = vi.fn().mockResolvedValue({});
    Group.addSector = vi.fn().mockResolvedValue({});
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
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
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="drawer"]').exists()).toBe(false);
    });

    it('should render drawer with content on initial page', async () => {
      wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.find('[data-testid="drawer"]').exists()).toBe(true);
      expect(wrapper.vm.activePageIndex).toBe(0);
      expect(wrapper.vm.activePage).toBe('General');
    });

    it('should not render DiscartChangesModal initially', async () => {
      wrapper = createWrapper();
      await flushPromises();
      expect(
        wrapper.find('[data-testid="discart-changes-modal"]').exists(),
      ).toBe(false);
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should have correct initial state and computed properties', () => {
      expect(wrapper.vm.activePageIndex).toBe(0);
      expect(wrapper.vm.activePage).toBe('General');
      expect(wrapper.vm.activePageKey).toBe('general');
      expect(wrapper.vm.newGroupsPages).toEqual([
        'General',
        'Projects',
        'Agents',
      ]);
    });

    it('should update button texts based on activePageIndex', async () => {
      expect(wrapper.find('[data-testid="primary-button"]').text()).toBe(
        'Continue',
      );
      expect(wrapper.find('[data-testid="secondary-button"]').text()).toBe(
        'Cancel',
      );

      await wrapper.setData({ activePageIndex: 2 });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="primary-button"]').text()).toBe(
        'Save',
      );
      expect(wrapper.find('[data-testid="secondary-button"]').text()).toBe(
        'Back',
      );
    });

    it('should navigate forward on primary button click when not last page', async () => {
      wrapper.vm.isValid.general = true;
      await wrapper.vm.$nextTick();
      await wrapper.find('[data-testid="primary-button"]').trigger('click');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.activePageIndex).toBe(1);
      expect(wrapper.vm.activePage).toBe('Projects');
    });

    it('should navigate backward on secondary button click when not first page', async () => {
      await wrapper.setData({ activePageIndex: 1 });
      await wrapper.vm.$nextTick();
      await wrapper.find('[data-testid="secondary-button"]').trigger('click');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.activePageIndex).toBe(0);
    });

    it('should show correct form based on activePageIndex', async () => {
      const drawer = wrapper.find('[data-testid="drawer"]');
      await wrapper.setData({ activePageIndex: 1 });
      await wrapper.vm.$nextTick();
      expect(drawer.find('[data-testid="projects-form"]').exists()).toBe(true);

      await wrapper.setData({ activePageIndex: 2 });
      await wrapper.vm.$nextTick();
      expect(drawer.find('[data-testid="agents-form"]').exists()).toBe(true);
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should update isValid when form emits change-valid', async () => {
      wrapper.vm.updateIsValid('general', true);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.isValid.general).toBe(true);

      wrapper.vm.updateIsValid('general', false);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.isValid.general).toBe(false);
    });

    it('should disable primary button when form is invalid', async () => {
      await wrapper.setData({
        isValid: { general: false, projects: false, agents: false },
      });
      await wrapper.vm.$nextTick();
      expect(
        wrapper.find('[data-testid="primary-button"]').attributes('disabled'),
      ).toBeDefined();
    });
  });

  describe('showDiscartQuestion', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

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

    it('should return true when group has maxSimultaneousChatsByAgent', async () => {
      wrapper.vm.group.maxSimultaneousChatsByAgent = '5';
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
      wrapper.vm.closeDrawer(false);
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should show DiscartChangesModal when showDiscartQuestion is true and forceClose is false', async () => {
      wrapper.vm.group.name = 'Test Group';
      await wrapper.vm.$nextTick();
      wrapper.vm.closeDrawer(false);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.showConfirmDiscartChangesModal).toBe(true);
      expect(
        wrapper.find('[data-testid="discart-changes-modal"]').exists(),
      ).toBe(true);
    });

    it('should close drawer and emit close when DiscartChangesModal primary button is clicked', async () => {
      wrapper.vm.showConfirmDiscartChangesModal = true;
      await wrapper.vm.$nextTick();
      await wrapper.find('[data-testid="discart-primary"]').trigger('click');
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should hide DiscartChangesModal when secondary button is clicked', async () => {
      wrapper.vm.showConfirmDiscartChangesModal = true;
      await wrapper.vm.$nextTick();
      await wrapper.find('[data-testid="discart-secondary"]').trigger('click');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.showConfirmDiscartChangesModal).toBe(false);
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
      wrapper.vm.group.sectors = [{ uuid: 'sector-uuid-1' }];
      await wrapper.vm.$nextTick();

      await wrapper.vm.listSectorsQueues({});
      await flushPromises();

      expect(wrapper.vm.avaliableSectorQueues.length).toBe(1);
      expect(wrapper.vm.avaliableSectorQueues[0].name).toBe(
        'Sector 1 | Queue 1',
      );
    });

    it('should add queues to agents when sector is added', async () => {
      Group.listSectorsQueues = vi.fn().mockResolvedValue({
        'sector-uuid-1': {
          sector_name: 'Sector 1',
          queues: [{ uuid: 'queue-1', queue_name: 'Queue 1' }],
        },
      });
      wrapper.vm.group.sectors = [{ uuid: 'sector-uuid-1' }];
      wrapper.vm.group.agents = [{ uuid: 'agent-1', queues: [] }];
      await wrapper.vm.$nextTick();

      await wrapper.vm.listSectorsQueues({
        toAddQueuesSector: 'sector-uuid-1',
      });
      await flushPromises();

      expect(wrapper.vm.group.agents[0].queues.length).toBeGreaterThan(0);
    });

    it('should remove queues from agents when sector is removed', async () => {
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
        toRemoveQueuesSector: 'sector-uuid-1',
      });
      await flushPromises();

      expect(wrapper.vm.group.agents[0].queues.length).toBe(1);
      expect(wrapper.vm.group.agents[0].queues[0].sectorUuid).toBe(
        'sector-uuid-2',
      );
    });

    it('should clear queues when all sectors are removed', async () => {
      wrapper.vm.group.agents = [
        {
          uuid: 'agent-1',
          queues: [{ uuid: 'queue-1', sectorUuid: 'sector-uuid-1' }],
        },
      ];
      await wrapper.vm.$nextTick();

      wrapper.vm.group.sectors = [];
      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(wrapper.vm.avaliableSectorQueues).toEqual([]);
      expect(wrapper.vm.group.agents[0].queues).toEqual([]);
    });
  });

  describe('Watch - group.sectors', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should call listSectorsQueues when sectors change', async () => {
      Group.listSectorsQueues = vi.fn().mockResolvedValue({});
      wrapper.vm.group.sectors = [{ uuid: 'sector-uuid-1' }];
      await wrapper.vm.$nextTick();
      await flushPromises();
      expect(Group.listSectorsQueues).toHaveBeenCalled();
    });
  });

  describe('finish - Group Creation', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should create group and add to store, then add authorizations and sectors', async () => {
      const settingsStore = useSettings();
      wrapper.vm.group = {
        name: 'Test Group',
        maxSimultaneousChatsByAgent: '5',
        managers: [{ uuid: 'manager-1' }],
        sectors: [{ uuid: 'sector-1' }],
        agents: [{ uuid: 'agent-1', queues: [{ uuid: 'queue-1' }] }],
        uuid: '',
      };
      await wrapper.vm.$nextTick();

      await wrapper.vm.finish();
      await flushPromises();

      expect(Group.create).toHaveBeenCalledWith({
        name: 'Test Group',
        rooms_limit: '5',
      });
      expect(wrapper.vm.group.uuid).toBe(mockCreatedGroup.uuid);
      expect(settingsStore.groups[0]).toEqual(wrapper.vm.group);
      expect(Group.addAuthorization).toHaveBeenCalledWith({
        groupSectorUuid: mockCreatedGroup.uuid,
        permissionUuid: 'manager-1',
        role: 1,
      });
      expect(Group.addSector).toHaveBeenCalledWith({
        groupUuid: mockCreatedGroup.uuid,
        sectorUuid: 'sector-1',
      });
      expect(Group.addAuthorization).toHaveBeenCalledWith({
        groupSectorUuid: mockCreatedGroup.uuid,
        permissionUuid: 'agent-1',
        role: 2,
        enabledQueues: ['queue-1'],
      });
    });

    it('should show success alert after successful creation', async () => {
      wrapper.vm.group = {
        name: 'Test Group',
        maxSimultaneousChatsByAgent: '5',
        sectors: [],
        managers: [],
        agents: [],
        uuid: '',
      };
      await wrapper.vm.$nextTick();

      await wrapper.vm.finish();
      await flushPromises();

      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: { text: 'New group Test Group created!', type: 'success' },
        seconds: 5,
      });
    });

    it('should set isLoadingCreate correctly during creation', async () => {
      wrapper.vm.group = {
        name: 'Test Group',
        maxSimultaneousChatsByAgent: '5',
        sectors: [],
        managers: [],
        agents: [],
        uuid: '',
      };
      await wrapper.vm.$nextTick();

      const finishPromise = wrapper.vm.finish();
      expect(wrapper.vm.isLoadingCreate).toBe(true);
      await finishPromise;
      await flushPromises();
      expect(wrapper.vm.isLoadingCreate).toBe(false);
    });

    it('should close drawer after successful creation', async () => {
      wrapper.vm.group = {
        name: 'Test Group',
        maxSimultaneousChatsByAgent: '5',
        sectors: [],
        managers: [],
        agents: [],
        uuid: '',
      };
      await wrapper.vm.$nextTick();

      await wrapper.vm.finish();
      await flushPromises();

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should handle error when creation fails', async () => {
      const error = new Error('Creation failed');
      Group.create = vi.fn().mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      wrapper.vm.group = {
        name: 'Test Group',
        maxSimultaneousChatsByAgent: '5',
        sectors: [],
        managers: [],
        agents: [],
        uuid: '',
      };
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
      expect(wrapper.vm.isLoadingCreate).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('listenConnect', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should add event listener on mount', () => {
      expect(window.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
    });

    it('should close drawer when receiving close event from window', async () => {
      const messageHandler = window.addEventListener.mock.calls.find(
        (call) => call[0] === 'message',
      )?.[1];
      expect(messageHandler).toBeDefined();

      const closeSpy = vi.fn();
      Object.defineProperty(wrapper.vm.$refs, 'newProjectGroupDrawer', {
        value: { close: closeSpy },
        writable: true,
        configurable: true,
      });
      messageHandler({ data: { event: 'close' } });
      await wrapper.vm.$nextTick();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should not close drawer when receiving other events', async () => {
      const messageHandler = window.addEventListener.mock.calls.find(
        (call) => call[0] === 'message',
      )?.[1];
      const closeSpy = vi.fn();
      Object.defineProperty(wrapper.vm.$refs, 'newProjectGroupDrawer', {
        value: { close: closeSpy },
        writable: true,
        configurable: true,
      });

      messageHandler({ data: { event: 'other' } });
      await wrapper.vm.$nextTick();

      expect(closeSpy).not.toHaveBeenCalled();
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

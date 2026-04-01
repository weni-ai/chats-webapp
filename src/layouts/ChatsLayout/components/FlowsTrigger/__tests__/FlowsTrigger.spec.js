import { flushPromises, mount, config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import i18n from '@/plugins/i18n';
import { useConfig } from '@/store/modules/config';
import { useRooms } from '@/store/modules/chats/rooms';

import FlowsTrigger from '../index.vue';

import Group from '@/services/api/resources/settings/group.js';
import FlowsAPI from '@/services/api/resources/flows/flowsTrigger.js';
import FlowsTriggerService from '@/services/api/resources/chats/flowsTrigger.js';

vi.mock('@/utils/callUnnnicAlert', () => ({
  default: vi.fn(),
}));

vi.mock('is-mobile', () => ({
  default: vi.fn(() => false),
}));

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

vi.mock('@/services/api/resources/settings/group.js', () => ({
  default: {
    listProjects: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/flows/flowsTrigger.js', () => ({
  default: {
    getContacts: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/chats/flowsTrigger.js', () => ({
  default: {
    getListOfGroups: vi.fn(),
    checkContact: vi.fn(),
    sendFlow: vi.fn(),
  },
}));

import callUnnnicAlert from '@/utils/callUnnnicAlert';

const defaultStubs = {
  AsideSlotTemplate: {
    template:
      '<div data-testid="flows-trigger-aside-root"><slot name="header" /><slot /><slot name="modals" /></div>',
  },
  AsideSlotTemplateSection: {
    template: '<div data-testid="flows-trigger-aside-section"><slot /></div>',
  },
  UnnnicChatsHeader: true,
  SendFlow: true,
  SelectedContactsSection: true,
  UnnnicButton: true,
  UnnnicInput: true,
  UnnnicCollapse: true,
  UnnnicChatsContact: true,
  UnnnicIcon: true,
  FlowsContactsLoading: true,
  UnnnicSkeletonLoading: {
    template: '<div class="unnnic-skeleton-loading-stub" />',
    inheritAttrs: false,
  },
  ModalListTriggeredFlows: true,
  ModalAddNewContact: true,
  ModalSendFlow: true,
  ModalRemoveSelectedContacts: true,
  ModalProgressBarFalse: true,
};

const setupDefaultApiMocks = () => {
  Group.listProjects.mockResolvedValue({ results: [] });
  FlowsAPI.getContacts.mockResolvedValue({
    data: { results: [] },
    next: null,
  });
  FlowsTriggerService.getListOfGroups.mockResolvedValue({ results: [] });
  FlowsTriggerService.checkContact.mockResolvedValue({ show_warning: false });
  FlowsTriggerService.sendFlow.mockResolvedValue(undefined);
};

const createWrapper = (props = {}) => {
  const pinia = createPinia();
  setActivePinia(pinia);

  const configStore = useConfig();
  configStore.project = {
    name: 'Test project',
    org: 'org-uuid',
    uuid: 'project-uuid',
  };

  const roomsStore = useRooms();
  roomsStore.activeRoom = { uuid: 'room-uuid' };

  return mount(FlowsTrigger, {
    props: {
      selectedContact: null,
      ...props,
    },
    global: {
      plugins: [pinia],
      mocks: {
        $t: (key) => key,
      },
      stubs: defaultStubs,
    },
  });
};

describe('FlowsTrigger (index.vue)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultApiMocks();
  });

  it('renders aside root after layout stubs', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    expect(
      wrapper.find('[data-testid="flows-trigger-aside-root"]').exists(),
    ).toBe(true);
    expect(wrapper.vm.isLoadingCheckProjectPrincipal).toBe(false);
  });

  it('calls listProjects on created to resolve principal project', async () => {
    createWrapper();
    await flushPromises();

    expect(Group.listProjects).toHaveBeenCalledWith({
      orgUuid: 'org-uuid',
      limit: 1,
      offset: 0,
      params: { its_principal: true },
    });
  });

  it('loads contacts and groups when project is not principal', async () => {
    createWrapper();
    await flushPromises();
    await flushPromises();

    expect(FlowsAPI.getContacts).toHaveBeenCalled();
    expect(FlowsTriggerService.getListOfGroups).toHaveBeenCalled();
  });

  it('getContactUrn returns scheme:path when urns exist', () => {
    const wrapper = createWrapper();

    expect(
      wrapper.vm.getContactUrn({
        urns: [{ scheme: 'whatsapp', path: '5511999999999' }],
      }),
    ).toBe('whatsapp:5511999999999');
    expect(wrapper.vm.getContactUrn({ urns: [] })).toBe('');
  });

  it('setContacts adds contact and calls checkContact when project flow is set', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    wrapper.vm.projectUuidFlow = 'flow-project-uuid';
    const contact = {
      uuid: 'c-1',
      name: 'Ada',
      urns: [{ scheme: 'tel', path: '1' }],
    };

    wrapper.vm.setContacts(contact);

    expect(wrapper.vm.selected).toHaveLength(1);
    expect(wrapper.vm.selected[0]).toEqual(contact);
    expect(FlowsTriggerService.checkContact).toHaveBeenCalledWith(
      'c-1',
      'flow-project-uuid',
    );

    await flushPromises();
  });

  it('setContacts removes contact when already selected', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    wrapper.vm.projectUuidFlow = 'flow-p';
    const contact = {
      uuid: 'c-2',
      name: 'Bob',
      urns: [{ scheme: 'tel', path: '2' }],
    };

    wrapper.vm.setContacts(contact);
    await flushPromises();
    FlowsTriggerService.checkContact.mockClear();

    wrapper.vm.setContacts(contact);

    expect(wrapper.vm.selected).toHaveLength(0);
  });

  it('groups contacts by first letter in letters computed', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    wrapper.vm.listOfContacts = [
      {
        uuid: '1',
        name: 'Zara',
        urns: [{ scheme: 'wa', path: 'z' }],
      },
      {
        uuid: '2',
        name: 'Anna',
        urns: [{ scheme: 'wa', path: 'a' }],
      },
    ];
    wrapper.vm.search = '';
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.letters.Z?.map((c) => c.uuid)).toEqual(['1']);
    expect(wrapper.vm.letters.A?.map((c) => c.uuid)).toEqual(['2']);
  });

  it('openSendFlow and closeSendFlow toggle showSendFlow', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.vm.showSendFlow).toBe(false);
    wrapper.vm.openSendFlow();
    expect(wrapper.vm.showSendFlow).toBe(true);
    wrapper.vm.closeSendFlow();
    expect(wrapper.vm.showSendFlow).toBe(false);
  });

  it('opens send flow on mount when selectedContact prop is set', async () => {
    const contact = {
      uuid: 'pre',
      name: 'Pre',
      urns: [{ scheme: 'x', path: 'y' }],
    };
    const wrapper = createWrapper({ selectedContact: contact });
    await flushPromises();

    expect(wrapper.vm.showSendFlow).toBe(true);
  });

  it('updateSelectedFlow and updateProjectUuidFlow update state', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    wrapper.vm.updateSelectedFlow('flow-abc');
    wrapper.vm.updateProjectUuidFlow('proj-flow-uuid');

    expect(wrapper.vm.selectedFlow).toBe('flow-abc');
    expect(wrapper.vm.projectUuidFlow).toBe('proj-flow-uuid');
  });

  it('sendFlowToContacts calls sendFlow and emits close', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    const contact = {
      uuid: 'ext-1',
      name: 'C',
      external_id: 'ext-1',
      urns: [{ scheme: 'wa', path: '1' }],
    };
    wrapper.vm.selected = [contact];
    wrapper.vm.selectedFlow = 'flow-def';
    wrapper.vm.projectUuidFlow = 'pf-1';

    await wrapper.vm.sendFlowToContacts();

    expect(FlowsTriggerService.sendFlow).toHaveBeenCalledWith(
      {
        flow: 'flow-def',
        contacts: ['ext-1'],
        room: 'room-uuid',
        contact_name: 'C',
      },
      'pf-1',
    );
    expect(callUnnnicAlert).toHaveBeenCalled();
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

import FlowsTrigger from '../index.vue';

import callUnnnicAlert from '@/utils/callUnnnicAlert';
import Group from '@/services/api/resources/settings/group';
import FlowsTriggerService from '@/services/api/resources/chats/flowsTrigger.js';
import FlowsAPI from '@/services/api/resources/flows/flowsTrigger.js';
import i18n from '@/plugins/i18n';

vi.mock('is-mobile', () => ({
  default: vi.fn(() => false),
}));

vi.mock('@/utils/callUnnnicAlert');

vi.mock('@/services/api/resources/settings/group', () => ({
  default: {
    listProjects: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/chats/flowsTrigger.js', () => ({
  default: {
    getListOfGroups: vi.fn(),
    checkContact: vi.fn(),
    sendFlow: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/flows/flowsTrigger.js', () => ({
  default: {
    getContacts: vi.fn(),
  },
}));

const mockContacts = [
  {
    uuid: 'contact-1',
    name: 'Alice',
    urns: [{ scheme: 'tel', path: '+5511999999999' }],
  },
  {
    uuid: 'contact-2',
    name: 'Bob',
    urns: [{ scheme: 'tel', path: '+5511888888888' }],
  },
  {
    uuid: 'contact-3',
    name: '',
    urns: [{ scheme: 'tel', path: '+5511777777777' }],
  },
];

const mockGroups = [{ uuid: 'group-1', name: 'Group A' }];

const segmentedControlStub = {
  name: 'UnnnicSegmentedControl',
  props: ['modelValue', 'defaultValue'],
  emits: ['update:modelValue'],
  template: '<div class="unnnic-segmented-control"><slot /></div>',
};

const segmentedControlListStub = {
  name: 'UnnnicSegmentedControlList',
  template: '<div class="unnnic-segmented-control-list"><slot /></div>',
};

const segmentedControlTriggerStub = {
  name: 'UnnnicSegmentedControlTrigger',
  props: ['value', 'disabled'],
  inheritAttrs: false,
  template:
    '<button class="unnnic-segmented-control-trigger" :data-testid="$attrs[\'data-testid\']"><slot /></button>',
};

const createStubs = () => ({
  AsideSlotTemplate: {
    template: `
      <div>
        <slot name="header" />
        <slot />
        <slot name="modals" />
      </div>
    `,
  },
  AsideSlotTemplateSection: {
    template: '<section><slot /></section>',
  },
  UnnnicPageHeader: {
    props: ['title'],
    template: '<div><slot name="actions" /><span>{{ title }}</span></div>',
  },
  UnnnicButton: {
    props: [
      'text',
      'type',
      'size',
      'iconCenter',
      'iconLeft',
      'ariaLabel',
      'disabled',
      'loading',
    ],
    template: `
      <button
        v-bind="$attrs"
        :disabled="disabled"
        @click="$emit('click')"
      >
        {{ text }}
      </button>
    `,
  },
  UnnnicInput: {
    props: ['modelValue', 'placeholder', 'iconLeft'],
    inheritAttrs: false,
    template: `
      <input
        :data-testid="$attrs['data-testid']"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    `,
  },
  UnnnicCollapse: {
    props: ['modelValue', 'title'],
    template: '<section><p>{{ title }}</p><slot /></section>',
  },
  UnnnicDisclaimer: {
    props: ['description', 'type'],
    template:
      '<div data-testid="flows-trigger-already-open">{{ description }}</div>',
  },
  UnnnicSkeletonLoading: {
    template: '<div data-testid="flows-trigger-skeleton" />',
  },
  UnnnicTabs: segmentedControlStub,
  UnnnicSegmentedControl: segmentedControlStub,
  SegmentedControlList: segmentedControlListStub,
  UnnnicSegmentedControlList: segmentedControlListStub,
  SegmentedControlTrigger: segmentedControlTriggerStub,
  UnnnicSegmentedControlTrigger: segmentedControlTriggerStub,
  SelectedContactsSection: {
    props: ['contacts'],
    template: `
      <div data-testid="selected-contacts-section">
        {{ contacts.length }}
      </div>
    `,
  },
  FlowsContactCard: {
    name: 'FlowsContactCard',
    props: ['name', 'subtitle', 'selected', 'unnamed'],
    template: `
      <button
        data-testid="flows-contact-card"
        :data-name="name"
        @click="$emit('toggle')"
      >
        {{ name }}
      </button>
    `,
  },
  FlowsContactsLoading: {
    template: '<div data-testid="flows-contacts-loading" />',
  },
  SendFlow: {
    props: ['contacts', 'groups', 'selectedContact', 'isProjectPrincipal'],
    template: `
      <div data-testid="send-flow-step">
        <button data-testid="send-flow-back" @click="$emit('back')">back</button>
      </div>
    `,
  },
  ModalListTriggeredFlows: {
    template: '<div data-testid="modal-triggered-flows" />',
  },
  ModalAddNewContact: {
    props: ['projectUuidFlow'],
    template: '<div data-testid="modal-add-new-contact" />',
  },
  ModalSendFlow: {
    props: ['contacts', 'isProjectPrincipal'],
    template: '<div data-testid="modal-send-flow" />',
  },
  ModalRemoveSelectedContacts: {
    props: ['contacts'],
    template: '<div data-testid="modal-remove-selected-contacts" />',
  },
  ModalVariableMapping: {
    props: ['templates', 'totalTemplateQty', 'localVariables', 'isLoading'],
    template: '<div data-testid="modal-variable-mapping" />',
  },
  ModalProgressBarFalse: {
    props: ['title'],
    template: '<div data-testid="modal-progress-bar">{{ title }}</div>',
  },
});

const setupDefaultMocks = () => {
  Group.listProjects.mockResolvedValue({
    results: [{ uuid: 'other-project-uuid' }],
  });
  FlowsAPI.getContacts.mockResolvedValue({
    data: { results: mockContacts },
    next: null,
  });
  FlowsTriggerService.getListOfGroups.mockResolvedValue({
    results: mockGroups,
  });
  FlowsTriggerService.checkContact.mockResolvedValue({ show_warning: false });
  FlowsTriggerService.sendFlow.mockResolvedValue({});
};

const createWrapper = async ({
  props = {},
  piniaState = {},
  waitForInit = true,
} = {}) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      config: {
        project: {
          uuid: 'project-uuid-1',
          org: 'org-uuid-1',
        },
      },
      rooms: {
        activeRoom: { uuid: 'room-uuid-1' },
      },
      profile: {
        me: { email: 'agent@test.com', name: 'Agent Name' },
      },
      featureFlag: {
        featureFlags: { active_features: [] },
      },
      ...piniaState,
    },
  });

  setActivePinia(pinia);

  const wrapper = mount(FlowsTrigger, {
    props,
    global: {
      plugins: [pinia],
      stubs: createStubs(),
    },
  });

  if (waitForInit) {
    await flushPromises();
  }

  return wrapper;
};

describe('FlowsTrigger/index.vue', () => {
  const { t } = i18n.global;

  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should show skeleton while checking if project is principal', async () => {
      let resolveProjects;
      Group.listProjects.mockReturnValue(
        new Promise((resolve) => {
          resolveProjects = resolve;
        }),
      );

      const wrapper = await createWrapper({ waitForInit: false });

      expect(
        wrapper.find('[data-testid="flows-trigger-skeleton"]').exists(),
      ).toBe(true);

      resolveProjects({ results: [] });
      await flushPromises();

      expect(
        wrapper.find('[data-testid="flows-trigger-skeleton"]').exists(),
      ).toBe(false);
    });

    it('should load contacts and groups when project is not principal', async () => {
      const wrapper = await createWrapper();

      expect(Group.listProjects).toHaveBeenCalledWith({
        orgUuid: 'org-uuid-1',
        limit: 1,
        offset: 0,
        params: { its_principal: true },
      });
      expect(FlowsAPI.getContacts).toHaveBeenCalledWith('', '');
      expect(FlowsTriggerService.getListOfGroups).toHaveBeenCalledWith('');
      expect(wrapper.vm.isProjectPrincipal).toBe(false);
      expect(
        wrapper.findAll('[data-testid="flows-contact-card"]'),
      ).toHaveLength(3);
      expect(wrapper.vm.listOfGroups).toEqual(mockGroups);
    });

    it('should open send flow step when current project is principal', async () => {
      Group.listProjects.mockResolvedValue({
        results: [{ uuid: 'project-uuid-1' }],
      });

      const wrapper = await createWrapper();

      expect(wrapper.vm.isProjectPrincipal).toBe(true);
      expect(wrapper.find('[data-testid="send-flow-step"]').exists()).toBe(
        true,
      );
    });

    it('should set isProjectPrincipal to false when check fails', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      Group.listProjects.mockRejectedValueOnce(new Error('API error'));

      const wrapper = await createWrapper();

      expect(wrapper.vm.isProjectPrincipal).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('rendering', () => {
    it('should render grouped contacts and unnamed contacts section', async () => {
      const wrapper = await createWrapper();

      expect(
        wrapper.findAll('[data-testid="flows-contact-card"]'),
      ).toHaveLength(3);
      expect(wrapper.text()).toContain(
        `[${t('flows_trigger.unnamed_contact')}]`,
      );
    });

    it('should show no results message when search returns empty list', async () => {
      vi.useFakeTimers();
      const wrapper = await createWrapper();

      FlowsAPI.getContacts.mockResolvedValue({
        data: { results: [] },
        next: null,
      });

      await wrapper
        .find('[data-testid="flows-trigger-search"]')
        .setValue('xyz');
      await vi.advanceTimersByTimeAsync(500);
      await flushPromises();

      expect(wrapper.find('.flows-trigger__groups__no-results').exists()).toBe(
        true,
      );
      expect(wrapper.text()).toContain(t('without_results'));
    });
  });

  describe('contact selection', () => {
    it('should add and remove contacts from selected list', async () => {
      const wrapper = await createWrapper();
      const contact = mockContacts[0];

      wrapper.vm.setContacts(contact);
      expect(wrapper.vm.selected).toEqual([contact]);

      wrapper.vm.setContacts(contact);
      expect(wrapper.vm.selected).toEqual([]);
    });

    it('should show alert when contact already has an open room', async () => {
      FlowsTriggerService.checkContact.mockResolvedValueOnce({
        show_warning: true,
        queue: 'Support',
        agent: 'John',
      });

      const wrapper = await createWrapper();
      wrapper.vm.setContacts(mockContacts[0]);
      await flushPromises();

      expect(FlowsTriggerService.checkContact).toHaveBeenCalledWith(
        'contact-1',
        '',
      );
      expect(wrapper.vm.openedRoomsAlerts).toEqual([
        {
          contactName: 'Alice',
          queue: 'Support',
          agent: 'John',
        },
      ]);
      expect(
        wrapper.find('[data-testid="flows-trigger-already-open"]').exists(),
      ).toBe(true);
    });
  });

  describe('search', () => {
    it('should debounce contact search when searchUrn changes', async () => {
      vi.useFakeTimers();

      const wrapper = await createWrapper();
      FlowsAPI.getContacts.mockClear();

      await wrapper
        .find('[data-testid="flows-trigger-search"]')
        .setValue('ali');
      expect(FlowsAPI.getContacts).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(500);
      await flushPromises();

      expect(FlowsAPI.getContacts).toHaveBeenCalledWith('ali', '');
    });
  });

  describe('send flow', () => {
    it('should open send flow step when continue button is clicked', async () => {
      const wrapper = await createWrapper();

      wrapper.vm.setContacts(mockContacts[0]);
      await wrapper.vm.$nextTick();

      const continueButton = wrapper
        .findAll('button')
        .find((button) => button.text() === t('continue'));

      await continueButton.trigger('click');

      expect(wrapper.find('[data-testid="send-flow-step"]').exists()).toBe(
        true,
      );
    });

    it('should close send flow step when back is emitted', async () => {
      const wrapper = await createWrapper();

      wrapper.vm.openSendFlow();
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="send-flow-step"]').exists()).toBe(
        true,
      );

      await wrapper.find('[data-testid="send-flow-back"]').trigger('click');

      expect(wrapper.find('[data-testid="send-flow-step"]').exists()).toBe(
        false,
      );
    });

    it('should send flow to selected contacts and show success alert', async () => {
      const wrapper = await createWrapper();
      wrapper.vm.selected = [mockContacts[0]];
      wrapper.vm.selectedFlow = 'flow-uuid-1';
      wrapper.vm.projectUuidFlow = 'project-uuid-1';

      await wrapper.vm.sendFlowToContacts();
      await flushPromises();

      expect(FlowsTriggerService.sendFlow).toHaveBeenCalledWith(
        {
          flow: 'flow-uuid-1',
          contacts: ['contact-1'],
          room: 'room-uuid-1',
          contact_name: 'Alice',
        },
        'project-uuid-1',
      );
      expect(callUnnnicAlert).toHaveBeenCalledWith({
        props: {
          text: t('flows_trigger.successfully_triggered'),
          type: 'success',
        },
        seconds: 5,
      });
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should disable primary action when cached template has variables', async () => {
      const wrapper = await createWrapper();

      wrapper.vm.selected = [mockContacts[0]];
      wrapper.vm.cachedTemplate = {
        templates: [{ variables: ['nomecontato'] }],
      };
      await wrapper.vm.$nextTick();

      const primaryButton = wrapper
        .findAll('button')
        .find((button) => [t('continue'), t('send')].includes(button.text()));

      expect(primaryButton.attributes('disabled')).toBeDefined();
    });

    it('should open variable mapping modal when cached template has variables', async () => {
      const wrapper = await createWrapper();

      wrapper.vm.updateCachedTemplate({
        templates: [{ variables: ['nomecontato'] }],
        total_template_qty: 1,
      });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showInlineVariableModal).toBe(true);
      expect(
        wrapper.find('[data-testid="modal-variable-mapping"]').exists(),
      ).toBe(true);
    });
  });

  describe('modals', () => {
    it('should open triggered flows modal', async () => {
      const wrapper = await createWrapper();

      const triggeredFlowsButton = wrapper.find(
        '[data-testid="flows-trigger-history"]',
      );

      await triggeredFlowsButton.trigger('click');

      expect(
        wrapper.find('[data-testid="modal-triggered-flows"]').exists(),
      ).toBe(true);
    });

    it('should open and close new contact modal', async () => {
      const wrapper = await createWrapper();

      wrapper.vm.openNewContactModal();
      await wrapper.vm.$nextTick();

      expect(
        wrapper.find('[data-testid="modal-add-new-contact"]').exists(),
      ).toBe(true);

      await wrapper.vm.closeNewContactModal(mockContacts[0]);
      await flushPromises();

      expect(
        wrapper.find('[data-testid="modal-add-new-contact"]').exists(),
      ).toBe(false);
      expect(wrapper.vm.selected).toEqual([mockContacts[0]]);
    });
  });

  describe('views', () => {
    it('should keep an independent search field on each view', async () => {
      const wrapper = await createWrapper({
        piniaState: {
          featureFlag: {
            featureFlags: { active_features: ['weniChatsFlow24hWindow'] },
          },
        },
      });

      expect(
        wrapper.find('[data-testid="flows-trigger-expired-window"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="flows-trigger-search"]').exists(),
      ).toBe(false);

      await wrapper
        .find('[data-testid="flows-trigger-expired-search"]')
        .setValue('expired');

      const segmented = wrapper.findComponent({
        name: 'UnnnicSegmentedControl',
      });
      segmented.vm.$emit('update:modelValue', 'all_contacts');
      await flushPromises();

      expect(wrapper.find('[data-testid="flows-contact-card"]').exists()).toBe(
        true,
      );
      expect(
        wrapper.find('[data-testid="flows-trigger-search"]').element.value,
      ).toBe('');
      expect(
        wrapper.find('[data-testid="flows-trigger-expired-search"]').exists(),
      ).toBe(false);

      await wrapper
        .find('[data-testid="flows-trigger-search"]')
        .setValue('alice');

      segmented.vm.$emit('update:modelValue', 'expired_window');
      await wrapper.vm.$nextTick();

      expect(
        wrapper.find('[data-testid="flows-trigger-expired-search"]').element
          .value,
      ).toBe('');
      expect(
        wrapper.find('[data-testid="flows-trigger-search"]').exists(),
      ).toBe(false);
    });
  });

  describe('helpers and computed', () => {
    it('should build contact urn subtitle', async () => {
      const wrapper = await createWrapper();
      const alice = wrapper
        .findAllComponents({ name: 'FlowsContactCard' })
        .find((card) => card.props('name') === 'Alice');

      expect(alice.props('subtitle')).toBe('tel:+5511999999999');
    });

    it('should build already open room message with agent', async () => {
      const wrapper = await createWrapper();

      await wrapper.setData({
        openedRoomsAlerts: [
          {
            contactName: 'Alice',
            queue: 'Support',
            agent: 'John',
          },
        ],
      });

      const message = wrapper
        .find('[data-testid="flows-trigger-already-open"]')
        .text();

      expect(message).toContain('Alice');
      expect(message).toContain('John');
      expect(message).toContain('Support');
    });

    it('should build already open room message without agent', async () => {
      const wrapper = await createWrapper();

      await wrapper.setData({
        openedRoomsAlerts: [
          {
            contactName: 'Alice',
            queue: 'Support',
          },
        ],
      });

      const message = wrapper
        .find('[data-testid="flows-trigger-already-open"]')
        .text();

      expect(message).toContain('Alice');
      expect(message).toContain('Support');
      expect(message).not.toContain('John');
    });

    it('should open send flow when selectedContact prop is provided', async () => {
      const wrapper = await createWrapper({
        props: {
          selectedContact: mockContacts[0],
        },
      });

      expect(wrapper.find('[data-testid="send-flow-step"]').exists()).toBe(
        true,
      );
    });
  });
});

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ExpiredWindow from '../ExpiredWindow.vue';
import FlowsTriggerService from '@/services/api/resources/chats/flowsTrigger.js';
import QueueService from '@/services/api/resources/settings/queue';
import SectorService from '@/services/api/resources/settings/sector';
import i18n from '@/plugins/i18n';

const infiniteScroll = vi.hoisted(() => ({
  onLoadMore: null,
  canLoadMore: null,
}));

vi.mock('@vueuse/core', () => ({
  useInfiniteScroll: (_element, onLoadMore, options) => {
    infiniteScroll.onLoadMore = onLoadMore;
    infiniteScroll.canLoadMore = options.canLoadMore;
  },
}));

vi.mock('@/services/api/resources/chats/flowsTrigger.js', () => ({
  default: {
    listOutOfWhatsappWindowContacts: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    list: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    listAllQueues: vi.fn(),
  },
}));

const nextPageUrl =
  'https://api.example.com/v1/contacts/out_off_whatsapp_response_window/?limit=20&offset=20';

const firstPage = {
  count: 8,
  next: nextPageUrl,
  previous: null,
  results: [
    {
      uuid: 'contact-1',
      name: 'Ana',
      urns: [{ scheme: 'ext', path: '111' }],
    },
    {
      uuid: 'contact-2',
      name: '',
      urns: [{ scheme: 'tel', path: '222' }],
    },
  ],
};

const stubs = {
  UnnnicInput: {
    props: ['modelValue'],
    inheritAttrs: false,
    template: `
      <input
        :data-testid="$attrs['data-testid']"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    `,
  },
  UnnnicButton: {
    props: ['text', 'disabled'],
    inheritAttrs: false,
    template: `
      <button
        :data-testid="$attrs['data-testid']"
        :disabled="disabled"
        @click="$emit('click')"
      >
        {{ text }}
      </button>
    `,
  },
  UnnnicPopover: { template: '<div><slot /></div>' },
  UnnnicPopoverTrigger: { template: '<div><slot /></div>' },
  PopoverTrigger: { template: '<div><slot /></div>' },
  UnnnicPopoverContent: { template: '<div><slot /></div>' },
  PopoverContent: { template: '<div><slot /></div>' },
  UnnnicPopoverFooter: { template: '<div><slot /></div>' },
  PopoverFooter: { template: '<div><slot /></div>' },
  UnnnicMultiSelect: {
    name: 'UnnnicMultiSelect',
    props: ['modelValue', 'disabled'],
    emits: ['update:model-value', 'scroll-end'],
    template: '<div />',
  },
  UnnnicDisclaimer: {
    props: ['description', 'type'],
    template:
      '<p data-testid="flows-trigger-expired-disclaimer">{{ description }}</p>',
  },
  FlowsContactsLoading: {
    template: '<div data-testid="flows-trigger-expired-loading" />',
  },
  FlowsContactCard: {
    name: 'FlowsContactCard',
    props: ['name', 'subtitle', 'selected', 'unnamed'],
    template: `
      <button
        data-testid="flows-contact-card"
        :data-selected="selected ? 'true' : 'false'"
        :data-name="name"
        :data-subtitle="subtitle"
        @click="$emit('toggle')"
      >
        {{ name }}
      </button>
    `,
  },
};

const createWrapper = async () => {
  const wrapper = mount(ExpiredWindow, {
    global: { stubs },
  });
  await flushPromises();
  return wrapper;
};

describe('FlowsTriggerExpiredWindow', () => {
  const { t } = i18n.global;

  beforeEach(() => {
    vi.clearAllMocks();
    infiniteScroll.onLoadMore = null;
    infiniteScroll.canLoadMore = null;
    FlowsTriggerService.listOutOfWhatsappWindowContacts.mockResolvedValue(
      firstPage,
    );
    SectorService.list.mockResolvedValue({ results: [], next: null });
    QueueService.listAllQueues.mockResolvedValue({ results: [], next: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads the first page with every contact selected', async () => {
    const wrapper = await createWrapper();
    const cards = wrapper.findAll('[data-testid="flows-contact-card"]');

    expect(
      FlowsTriggerService.listOutOfWhatsappWindowContacts,
    ).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      sectors: undefined,
      queues: undefined,
      search: undefined,
    });
    expect(cards).toHaveLength(2);
    expect(cards[0].attributes('data-selected')).toBe('true');
    expect(cards[0].attributes('data-subtitle')).toBe('ext:111');
    expect(cards[1].attributes('data-selected')).toBe('true');
    expect(cards[1].attributes('data-name')).toBe(
      `[${t('flows_trigger.unnamed_contact')}]`,
    );
    expect(
      wrapper.find('[data-testid="flows-trigger-expired-disclaimer"]').text(),
    ).toBe(t('flows_trigger.expired_window_disclaimer', { count: 8 }));
    expect(wrapper.emitted('update:selection').at(-1)[0]).toEqual({
      sendToAll: true,
      ignoredContacts: [],
      includedContacts: [],
      selectedCount: 8,
    });
  });

  it('tracks unchecked contacts as ignored and selects them again', async () => {
    const wrapper = await createWrapper();
    const cards = wrapper.findAll('[data-testid="flows-contact-card"]');

    await cards[0].trigger('click');

    expect(cards[0].attributes('data-selected')).toBe('false');
    expect(wrapper.emitted('update:selection').at(-1)[0]).toEqual({
      sendToAll: true,
      ignoredContacts: ['contact-1'],
      includedContacts: [],
      selectedCount: 7,
    });

    await cards[0].trigger('click');

    expect(cards[0].attributes('data-selected')).toBe('true');
    expect(wrapper.emitted('update:selection').at(-1)[0]).toEqual({
      sendToAll: true,
      ignoredContacts: [],
      includedContacts: [],
      selectedCount: 8,
    });
  });

  it('loads the next page through infinite scroll with new contacts selected', async () => {
    const wrapper = await createWrapper();

    await wrapper
      .findAll('[data-testid="flows-contact-card"]')[0]
      .trigger('click');

    FlowsTriggerService.listOutOfWhatsappWindowContacts.mockResolvedValueOnce({
      count: 8,
      next: null,
      previous: nextPageUrl,
      results: [
        {
          uuid: 'contact-3',
          name: 'Bia',
          urns: [{ scheme: 'ext', path: '333' }],
        },
      ],
    });

    expect(infiniteScroll.canLoadMore()).toBe(true);
    await infiniteScroll.onLoadMore();
    await flushPromises();

    expect(
      FlowsTriggerService.listOutOfWhatsappWindowContacts,
    ).toHaveBeenLastCalledWith({ nextReq: nextPageUrl });

    const cards = wrapper.findAll('[data-testid="flows-contact-card"]');
    expect(cards).toHaveLength(3);
    expect(cards[0].attributes('data-selected')).toBe('false');
    expect(cards[2].attributes('data-selected')).toBe('true');
    expect(cards[2].attributes('data-name')).toBe('Bia');
    expect(wrapper.emitted('update:selection').at(-1)[0]).toEqual({
      sendToAll: true,
      ignoredContacts: ['contact-1'],
      includedContacts: [],
      selectedCount: 7,
    });
  });

  it('resets the ignored contacts when the search changes', async () => {
    vi.useFakeTimers();
    const wrapper = await createWrapper();

    await wrapper
      .findAll('[data-testid="flows-contact-card"]')[0]
      .trigger('click');
    FlowsTriggerService.listOutOfWhatsappWindowContacts.mockClear();

    await wrapper
      .find('[data-testid="flows-trigger-expired-search"]')
      .setValue('ana');
    await vi.advanceTimersByTimeAsync(500);
    await flushPromises();

    expect(
      FlowsTriggerService.listOutOfWhatsappWindowContacts,
    ).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      sectors: undefined,
      queues: undefined,
      search: 'ana',
    });
    expect(wrapper.emitted('update:selection').at(-1)[0]).toEqual({
      sendToAll: false,
      ignoredContacts: [],
      includedContacts: ['contact-1', 'contact-2'],
      selectedCount: 2,
    });
    expect(
      wrapper.find('[data-testid="flows-trigger-expired-disclaimer"]').text(),
    ).toBe(t('flows_trigger.expired_window_disclaimer', { count: 2 }));
  });

  it('sends loaded selected contacts when a search is applied', async () => {
    vi.useFakeTimers();
    const wrapper = await createWrapper();

    await wrapper
      .find('[data-testid="flows-trigger-expired-search"]')
      .setValue('ana');
    await vi.advanceTimersByTimeAsync(500);
    await flushPromises();

    await wrapper
      .findAll('[data-testid="flows-contact-card"]')[0]
      .trigger('click');

    expect(wrapper.emitted('update:selection').at(-1)[0]).toEqual({
      sendToAll: false,
      ignoredContacts: [],
      includedContacts: ['contact-2'],
      selectedCount: 1,
    });
  });

  it('resets the ignored contacts when filters are applied', async () => {
    const wrapper = await createWrapper();

    await wrapper
      .findAll('[data-testid="flows-contact-card"]')[0]
      .trigger('click');
    FlowsTriggerService.listOutOfWhatsappWindowContacts.mockClear();

    const sectorsSelect = wrapper.findAllComponents({
      name: 'UnnnicMultiSelect',
    })[0];
    sectorsSelect.vm.$emit('update:model-value', ['sector-1', 'sector-2']);
    await flushPromises();

    await wrapper
      .find('[data-testid="flows-trigger-expired-filters-apply"]')
      .trigger('click');
    await flushPromises();

    expect(
      FlowsTriggerService.listOutOfWhatsappWindowContacts,
    ).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      sectors: 'sector-1,sector-2',
      queues: undefined,
      search: undefined,
    });
    expect(wrapper.emitted('update:selection').at(-1)[0]).toEqual({
      sendToAll: true,
      ignoredContacts: [],
      includedContacts: [],
      selectedCount: 8,
    });
  });

  it('shows an empty state when the request returns no contacts', async () => {
    FlowsTriggerService.listOutOfWhatsappWindowContacts.mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    const wrapper = await createWrapper();

    expect(
      wrapper.find('[data-testid="flows-trigger-expired-empty"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="flows-trigger-expired-disclaimer"]').exists(),
    ).toBe(false);
    expect(infiniteScroll.canLoadMore()).toBe(false);
  });
});

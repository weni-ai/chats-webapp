import { mount, flushPromises, config } from '@vue/test-utils';
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';

import RepresentativeService from '@/services/api/resources/settings/representative';

import BulkChatsLimitModal from '../BulkChatsLimitModal.vue';

vi.mock('@/services/api/resources/settings/representative', () => ({
  default: {
    updateRepresentativeQueuePermission: vi.fn(),
  },
}));

vi.mock('@/utils/overlay', () => ({
  handleConnectOverlay: vi.fn(),
}));

vi.mock('@weni/unnnic-system', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    UnnnicCallAlert: vi.fn(),
    UnnnicToastManager: {
      ...mod.UnnnicToastManager,
      error: vi.fn(),
    },
  };
});

let savedGlobalMocks;

beforeAll(() => {
  savedGlobalMocks = { ...config.global.mocks };
  config.global.mocks = {};
});

afterAll(() => {
  config.global.mocks = savedGlobalMocks;
});

const representative = (overrides = {}) => ({
  name: 'Jane',
  email: 'jane@example.com',
  status: 'online',
  chats_limit: { active: false, total: null },
  sector: [],
  sector_chats_total_limit: 0,
  ...overrides,
});

describe('BulkChatsLimitModal.vue', () => {
  let wrapper;

  const representativesFixture = [
    representative(),
    representative({ name: 'Bob', email: 'bob@example.com' }),
  ];

  const mountComponent = (props = {}) => {
    return mount(BulkChatsLimitModal, {
      attachTo: document.body,
      props: {
        modelValue: true,
        representatives: representativesFixture,
        ...props,
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(
      RepresentativeService.updateRepresentativeQueuePermission,
    ).mockResolvedValue({});
    wrapper = mountComponent();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it('renders modal content when modelValue is true', () => {
    expect(
      wrapper.find('[data-testid="bulk-chats-limit-modal-content"]').exists(),
    ).toBe(true);
  });

  it('disables save while the limit is empty', () => {
    expect(
      wrapper
        .find('[data-testid="bulk-chats-limit-save-button"]')
        .attributes('disabled'),
    ).toBeDefined();
  });

  it('enables save when a valid limit is entered', async () => {
    await wrapper
      .find('[data-testid="bulk-chats-limit-input"]')
      .find('input')
      .setValue('10');

    expect(
      wrapper
        .find('[data-testid="bulk-chats-limit-save-button"]')
        .attributes('disabled'),
    ).toBeUndefined();
  });

  it('calls the API and emits success when save succeeds', async () => {
    await wrapper
      .find('[data-testid="bulk-chats-limit-input"]')
      .find('input')
      .setValue('15');

    await wrapper
      .find('[data-testid="bulk-chats-limit-save-button"]')
      .trigger('click');
    await flushPromises();

    expect(
      RepresentativeService.updateRepresentativeQueuePermission,
    ).toHaveBeenCalledWith({
      representatives: ['jane@example.com', 'bob@example.com'],
      toRemove: [],
      toAdd: [],
      chatsLimit: {
        is_active: true,
        total: 15,
      },
    });
    expect(wrapper.emitted('success')).toBeTruthy();
  });

  it('emits update:modelValue false when cancel is clicked', async () => {
    await wrapper
      .find('[data-testid="bulk-chats-limit-cancel-button"]')
      .trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    const emits = wrapper.emitted('update:modelValue');
    expect(emits[emits.length - 1][0]).toBe(false);
  });

  it('calls toast error when save fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { UnnnicToastManager } = await import('@weni/unnnic-system');
    vi.mocked(
      RepresentativeService.updateRepresentativeQueuePermission,
    ).mockRejectedValueOnce(new Error('network'));

    await wrapper
      .find('[data-testid="bulk-chats-limit-input"]')
      .find('input')
      .setValue('8');
    await wrapper
      .find('[data-testid="bulk-chats-limit-save-button"]')
      .trigger('click');
    await flushPromises();

    expect(UnnnicToastManager.error).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

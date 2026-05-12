import { mount, config } from '@vue/test-utils';
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

import RepresentativeCard from '../RepresentativeCard.vue';

let savedGlobalMocks;

beforeAll(() => {
  savedGlobalMocks = { ...config.global.mocks };
  config.global.mocks = {};

  global.ResizeObserver = class {
    observe() {}

    unobserve() {}

    disconnect() {}
  };
});

afterAll(() => {
  config.global.mocks = savedGlobalMocks;
});

const representative = (overrides = {}) => ({
  name: 'Jane Doe',
  email: 'jane@example.com',
  status: 'online',
  chats_limit: { active: false, total: null },
  sector: [],
  sector_chats_total_limit: 10,
  ...overrides,
});

describe('RepresentativeCard.vue', () => {
  let wrapper;

  const mountComponent = (props = {}) => {
    return mount(RepresentativeCard, {
      attachTo: document.body,
      props: {
        selected: false,
        representative: representative(),
        ...props,
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = mountComponent();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it('renders representative name and email', () => {
    expect(
      wrapper.find('[data-testid="representative-card-name"]').text(),
    ).toBe('Jane Doe');
    expect(
      wrapper.find('[data-testid="representative-card-email"]').text(),
    ).toBe('jane@example.com');
  });

  it('emits update:selected when the checkbox is toggled', async () => {
    await wrapper
      .find('[data-testid="representative-card-checkbox"]')
      .find('input[type="checkbox"]')
      .setValue(true);

    expect(wrapper.emitted('update:selected')).toBeTruthy();
    expect(wrapper.emitted('update:selected')[0]).toEqual([true]);
  });

  it('shows empty sectors message when there are no sectors', async () => {
    await wrapper.setProps({
      representative: representative({ sector: [] }),
    });

    expect(
      wrapper
        .find('[data-testid="representative-card-sectors-empty"]')
        .exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="representative-sector-list"]').exists(),
    ).toBe(false);
  });

  it('renders sector list when sectors exist', async () => {
    await wrapper.setProps({
      representative: representative({
        sector: [{ name: 'Sales', queues: ['q1'] }],
      }),
    });

    expect(
      wrapper
        .find('[data-testid="representative-card-sectors-empty"]')
        .exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="representative-sector-list"]').exists(),
    ).toBe(true);
  });

  it('shows chats limit tag when sectors exist', async () => {
    await wrapper.setProps({
      representative: representative({
        sector: [{ name: 'Sales', queues: ['q1'] }],
      }),
    });

    expect(
      wrapper.find('[data-testid="representative-card-chats-limit"]').exists(),
    ).toBe(true);
  });

  it('hides chats limit tag when there are no sectors', async () => {
    await wrapper.setProps({
      representative: representative({
        sector: [{ name: 'Sales', queues: ['q1'] }],
      }),
    });

    await wrapper.setProps({
      representative: representative({ sector: [] }),
    });

    expect(
      wrapper.find('[data-testid="representative-card-chats-limit"]').exists(),
    ).toBe(false);
  });

  it('maps status to the status icon scheme', async () => {
    await wrapper.setProps({
      representative: representative({ status: 'online' }),
    });
    expect(wrapper.findComponent({ name: 'UnnnicIcon' }).props('scheme')).toBe(
      'green-400',
    );

    await wrapper.setProps({
      representative: representative({ status: 'offline' }),
    });
    expect(wrapper.findComponent({ name: 'UnnnicIcon' }).props('scheme')).toBe(
      'gray-300',
    );

    await wrapper.setProps({
      representative: representative({ status: 'Custom break' }),
    });
    expect(wrapper.findComponent({ name: 'UnnnicIcon' }).props('scheme')).toBe(
      'orange-400',
    );
  });
});

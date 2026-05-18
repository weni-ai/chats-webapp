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
import { nextTick } from 'vue';

import SectorList from '../SectorList.vue';

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

const sectorsFixture = [
  { name: 'Sales', queues: ['queue-a', 'queue-b'] },
  { name: 'Support', queues: ['queue-c'] },
];

describe('SectorList.vue', () => {
  let wrapper;

  const mountComponent = (props = {}) => {
    return mount(SectorList, {
      attachTo: document.body,
      props: {
        sectors: sectorsFixture,
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

  it('renders the list root', () => {
    expect(
      wrapper.find('[data-testid="representative-sector-list"]').exists(),
    ).toBe(true);
  });

  it('renders a tooltip item per visible sector with tag text equal to sector name', async () => {
    await flushPromises();
    await nextTick();

    expect(
      wrapper.findAll('[data-testid^="representative-sector-list-item"]'),
    ).toHaveLength(2);

    const tags = wrapper.findAllComponents({ name: 'UnnnicTag' });
    expect(tags.length).toBeGreaterThanOrEqual(2);
    expect(tags[0].props('text')).toBe('Sales');
    expect(tags[1].props('text')).toBe('Support');
  });

  it('renders no sector items when sectors is empty', async () => {
    await wrapper.setProps({ sectors: [] });
    await flushPromises();
    await nextTick();

    expect(
      wrapper.findAll('[data-testid^="representative-sector-list-item"]'),
    ).toHaveLength(0);
    expect(
      wrapper
        .find('[data-testid="representative-sector-list-overflow"]')
        .exists(),
    ).toBe(false);
  });
});

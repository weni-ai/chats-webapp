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
import SectorQueuesCheckbox from '../SectorQueuesCheckbox.vue';

let savedGlobalMocks;

beforeAll(() => {
  savedGlobalMocks = { ...config.global.mocks };
  config.global.mocks = {};
});

afterAll(() => {
  config.global.mocks = savedGlobalMocks;
});

const sectorsFixture = [
  {
    name: 'Sector A',
    queues: [
      { uuid: 'queue-uuid-1', name: 'Queue A1' },
      { uuid: 'queue-uuid-2', name: 'Queue A2' },
    ],
  },
  {
    name: 'Sector B',
    queues: [{ uuid: 'queue-uuid-3', name: 'Queue B1' }],
  },
];

describe('SectorQueuesCheckbox.vue', () => {
  let wrapper;

  const defaultProps = () => ({
    selectedQueues: [],
    sectors: sectorsFixture,
    isBulk: false,
  });

  const mountComponent = (props = {}) => {
    return mount(SectorQueuesCheckbox, {
      attachTo: document.body,
      props: {
        ...defaultProps(),
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

  it('renders title when isBulk is false', async () => {
    await wrapper.setProps({ isBulk: false });

    expect(
      wrapper.find('[data-testid="sector-queues-checkbox-title"]').exists(),
    ).toBe(true);
    expect(
      wrapper
        .find('[data-testid="sector-queues-checkbox-bulk-description"]')
        .exists(),
    ).toBe(false);
  });

  it('renders bulk description when isBulk is true', async () => {
    await wrapper.setProps({ isBulk: true });

    expect(
      wrapper
        .find('[data-testid="sector-queues-checkbox-bulk-description"]')
        .exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="sector-queues-checkbox-title"]').exists(),
    ).toBe(false);
  });

  it('omits sectors without queues', async () => {
    await wrapper.setProps({
      sectors: [{ name: 'Empty', queues: [] }, ...sectorsFixture],
    });

    expect(
      wrapper.findAll('[data-testid^="sector-queues-checkbox-sector-block"]'),
    ).toHaveLength(2);
  });

  it('checks sector checkbox when every queue in the sector is selected', async () => {
    await wrapper.setProps({
      selectedQueues: ['queue-uuid-1', 'queue-uuid-2'],
    });

    expect(
      wrapper
        .find('[data-testid="sector-queues-checkbox-sector-toggle-0"]')
        .find('input[type="checkbox"]').element.checked,
    ).toBe(true);
  });

  it('unchecks sector checkbox when any queue in the sector is missing', async () => {
    await wrapper.setProps({
      selectedQueues: ['queue-uuid-1'],
    });

    expect(
      wrapper
        .find('[data-testid="sector-queues-checkbox-sector-toggle-0"]')
        .find('input[type="checkbox"]').element.checked,
    ).toBe(false);
  });

  it('emits update:selectedQueues when selecting a sector', async () => {
    await wrapper.setProps({ selectedQueues: [] });

    await wrapper
      .find('[data-testid="sector-queues-checkbox-sector-toggle-0"]')
      .find('input[type="checkbox"]')
      .setValue(true);

    expect(wrapper.emitted('update:selectedQueues')).toBeTruthy();
    expect(wrapper.emitted('update:selectedQueues')[0][0]).toEqual({
      currentQueues: ['queue-uuid-1', 'queue-uuid-2'],
      queuesToAdd: ['queue-uuid-1', 'queue-uuid-2'],
      queuesToRemove: [],
    });
  });

  it('emits update:selectedQueues when deselecting a sector', async () => {
    await wrapper.setProps({
      selectedQueues: ['queue-uuid-1', 'queue-uuid-2', 'queue-uuid-3'],
    });

    await wrapper
      .find('[data-testid="sector-queues-checkbox-sector-toggle-0"]')
      .find('input[type="checkbox"]')
      .setValue(false);

    expect(wrapper.emitted('update:selectedQueues')[0][0]).toEqual({
      currentQueues: ['queue-uuid-3'],
      queuesToAdd: [],
      queuesToRemove: ['queue-uuid-1', 'queue-uuid-2'],
    });
  });

  it('emits update:selectedQueues when selecting a single queue', async () => {
    await wrapper.setProps({ selectedQueues: [] });

    await wrapper
      .find('[data-testid="sector-queues-checkbox-queue-queue-uuid-1"]')
      .find('input[type="checkbox"]')
      .setValue(true);

    expect(wrapper.emitted('update:selectedQueues')[0][0]).toEqual({
      currentQueues: ['queue-uuid-1'],
      queuesToAdd: ['queue-uuid-1'],
      queuesToRemove: [],
    });
  });

  it('emits update:selectedQueues when deselecting a single queue', async () => {
    await wrapper.setProps({
      selectedQueues: ['queue-uuid-1', 'queue-uuid-2'],
    });

    await wrapper
      .find('[data-testid="sector-queues-checkbox-queue-queue-uuid-1"]')
      .find('input[type="checkbox"]')
      .setValue(false);

    expect(wrapper.emitted('update:selectedQueues')[0][0]).toEqual({
      currentQueues: ['queue-uuid-2'],
      queuesToAdd: [],
      queuesToRemove: ['queue-uuid-1'],
    });
  });

  it('renders a divider between sectors but not after the last', () => {
    expect(
      wrapper.findAll('[data-testid^="sector-queues-checkbox-divider"]'),
    ).toHaveLength(1);
    expect(
      wrapper.find('[data-testid="sector-queues-checkbox-divider-0"]').exists(),
    ).toBe(true);
  });
});

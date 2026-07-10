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

import RepresentativesList from '../index.vue';

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

describe('RepresentativesList/index.vue', () => {
  let wrapper;

  const repOne = representative();
  const repTwo = representative({
    name: 'Bob',
    email: 'bob@example.com',
  });

  const mountComponent = (props = {}) => {
    return mount(RepresentativesList, {
      attachTo: document.body,
      props: {
        representatives: [repOne, repTwo],
        selectedRepresentatives: [],
        emptyRepresentatives: false,
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

  it('renders one RepresentativeCard per representative', () => {
    expect(wrapper.findAll('[data-testid="representative-card"]')).toHaveLength(
      2,
    );
    expect(wrapper.find('[data-testid="representatives-list"]').exists()).toBe(
      true,
    );
  });

  it('reflects selection from selectedRepresentatives on each card', async () => {
    await wrapper.setProps({
      selectedRepresentatives: [repOne],
    });

    const firstCheckbox = wrapper
      .findAll('[data-testid="representative-card"]')[0]
      .find('[data-testid="representative-card-checkbox"]')
      .find('input[type="checkbox"]');
    const secondCheckbox = wrapper
      .findAll('[data-testid="representative-card"]')[1]
      .find('[data-testid="representative-card-checkbox"]')
      .find('input[type="checkbox"]');

    expect(firstCheckbox.element.checked).toBe(true);
    expect(secondCheckbox.element.checked).toBe(false);
  });

  it('emits update:selectedRepresentatives when a card checkbox is checked', async () => {
    await wrapper
      .findAll('[data-testid="representative-card"]')[0]
      .find('[data-testid="representative-card-checkbox"]')
      .find('input[type="checkbox"]')
      .setValue(true);

    expect(wrapper.emitted('update:selectedRepresentatives')).toBeTruthy();
    expect(wrapper.emitted('update:selectedRepresentatives')[0][0]).toEqual([
      repOne,
    ]);
  });

  it('emits update:selectedRepresentatives when a card checkbox is unchecked', async () => {
    await wrapper.setProps({
      selectedRepresentatives: [repOne, repTwo],
    });

    await wrapper
      .findAll('[data-testid="representative-card"]')[0]
      .find('[data-testid="representative-card-checkbox"]')
      .find('input[type="checkbox"]')
      .setValue(false);

    expect(wrapper.emitted('update:selectedRepresentatives')[0][0]).toEqual([
      repTwo,
    ]);
  });

  it('emits click:representative when a card is clicked', async () => {
    await wrapper
      .findAll('[data-testid="representative-card"]')[0]
      .trigger('click');

    expect(wrapper.emitted('click:representative')).toBeTruthy();
    expect(wrapper.emitted('click:representative')[0]).toEqual([repOne]);
  });

  it('shows empty state when there are no representatives and emptyRepresentatives is true', async () => {
    await wrapper.setProps({
      representatives: [],
      emptyRepresentatives: true,
    });

    expect(
      wrapper.find('[data-testid="representatives-list-empty"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="representatives-list-empty-message"]').text(),
    ).toContain('There are no members with human support permissions');
  });

  it('shows empty state when there are no representatives and emptyRepresentatives is false', async () => {
    await wrapper.setProps({
      representatives: [],
      emptyRepresentatives: false,
    });

    expect(
      wrapper.find('[data-testid="representatives-list-empty"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="representatives-list-empty-message"]').text(),
    ).toContain('No representatives found');
  });
});

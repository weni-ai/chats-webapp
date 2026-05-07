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

import RepresentativesActions from '../Actions.vue';

let savedGlobalMocks;

beforeAll(() => {
  savedGlobalMocks = { ...config.global.mocks };
  config.global.mocks = {};
});

afterAll(() => {
  config.global.mocks = savedGlobalMocks;
});

describe('Representatives/Actions.vue', () => {
  let wrapper;

  const mountComponent = (props = {}) => {
    return mount(RepresentativesActions, {
      attachTo: document.body,
      props: {
        selectedCount: 0,
        selectAll: false,
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

  it('renders root and select-all region', () => {
    expect(
      wrapper.find('[data-testid="representatives-actions"]').exists(),
    ).toBe(true);
    expect(
      wrapper
        .find('[data-testid="representatives-actions-select-all"]')
        .exists(),
    ).toBe(true);
  });

  it('reflects selectAll on the checkbox', async () => {
    await wrapper.setProps({ selectAll: true });

    expect(
      wrapper
        .find('[data-testid="representatives-actions-select-all-checkbox"]')
        .find('input[type="checkbox"]').element.checked,
    ).toBe(true);
  });

  it('emits update:selectAll when the checkbox changes', async () => {
    await wrapper
      .find('[data-testid="representatives-actions-select-all-checkbox"]')
      .find('input[type="checkbox"]')
      .setValue(true);

    expect(wrapper.emitted('update:selectAll')).toBeTruthy();
    expect(wrapper.emitted('update:selectAll')[0]).toEqual([true]);
  });

  it('hides selection count and action buttons when selectedCount is 0', () => {
    expect(
      wrapper
        .find('[data-testid="representatives-actions-select-count"]')
        .exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="representatives-actions-buttons"]').exists(),
    ).toBe(false);
  });

  it('shows selection count and action buttons when selectedCount is greater than zero', async () => {
    await wrapper.setProps({ selectedCount: 3 });

    expect(
      wrapper
        .find('[data-testid="representatives-actions-select-count"]')
        .text(),
    ).toContain('3 selected');
    expect(
      wrapper.find('[data-testid="representatives-actions-buttons"]').exists(),
    ).toBe(true);
    expect(
      wrapper
        .find('[data-testid="representatives-actions-queue-button"]')
        .exists(),
    ).toBe(true);
    expect(
      wrapper
        .find('[data-testid="representatives-actions-chats-limit-button"]')
        .exists(),
    ).toBe(true);
  });

  it('emits open-queue-management when the queue button is clicked', async () => {
    await wrapper.setProps({ selectedCount: 1 });

    await wrapper
      .find('[data-testid="representatives-actions-queue-button"]')
      .trigger('click');

    expect(wrapper.emitted('open-queue-management')).toBeTruthy();
  });

  it('emits open-chats-limit-management when the chats limit button is clicked', async () => {
    await wrapper.setProps({ selectedCount: 1 });

    await wrapper
      .find('[data-testid="representatives-actions-chats-limit-button"]')
      .trigger('click');

    expect(wrapper.emitted('open-chats-limit-management')).toBeTruthy();
  });
});

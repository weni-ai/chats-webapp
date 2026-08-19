import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import moment from 'moment';
import { createTestingPinia } from '@pinia/testing';
import { ref } from 'vue';

import ConnectedProjectCard from '../ConnectedProjectCard.vue';
import i18n from '@/plugins/i18n';
import UnnnicSystemPlugin from '@/plugins/UnnnicSystem.js';

const hasMultipleProjects = ref(true);

vi.mock('@/utils/copilotProject', () => ({
  buildCopilotProjectUrl: vi.fn(
    (uuid) => `https://dash.stg.cloud.weni.ai/projects/${uuid}`,
  ),
}));

vi.mock('@/composables/useCopilotProjectsList', () => ({
  useCopilotProjectsList: () => ({
    hasMultipleProjects,
  }),
}));

beforeAll(() => {
  config.global.plugins = (config.global.plugins || []).filter(
    (plugin) => plugin !== i18n && plugin !== UnnnicSystemPlugin,
  );
});

afterAll(() => {
  if (config.global.plugins && !config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
  if (
    UnnnicSystemPlugin &&
    config.global.plugins &&
    !config.global.plugins.includes(UnnnicSystemPlugin)
  ) {
    config.global.plugins.push(UnnnicSystemPlugin);
  }
});

const linkedProject = {
  name: 'Sales 123',
  assignedAgents: 3,
  createdOn: '2026-07-30T00:00:00Z',
  connectedOn: '2026-07-30T00:00:00Z',
  uuid: 'copilot-uuid',
  connectedBy: 'edu',
};

const createWrapper = () =>
  mount(ConnectedProjectCard, {
    props: { linkedProject },
    global: {
      plugins: [createTestingPinia()],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicPopover: {
          name: 'UnnnicPopover',
          template:
            '<div data-testid="desk-copilot-more-popover"><slot /></div>',
        },
        UnnnicPopoverTrigger: {
          name: 'UnnnicPopoverTrigger',
          template: '<div><slot /></div>',
        },
        UnnnicPopoverContent: {
          name: 'UnnnicPopoverContent',
          template: '<div><slot /></div>',
        },
        UnnnicPopoverOption: {
          name: 'UnnnicPopoverOption',
          template:
            '<button data-testid="desk-copilot-change-option" @click="$emit(\'click\')">{{ label }}</button>',
          props: ['label', 'icon'],
        },
      },
    },
  });

describe('DeskCopilot ConnectedProjectCard', () => {
  let wrapper;
  const originalOpen = window.open;

  beforeEach(() => {
    window.open = vi.fn();
    hasMultipleProjects.value = true;
    wrapper = createWrapper();
  });

  afterEach(() => {
    window.open = originalOpen;
    wrapper?.unmount();
  });

  it('renders the linked project details', () => {
    expect(
      wrapper.find('[data-testid="desk-copilot-connected-name"]').text(),
    ).toBe('Sales 123');
    expect(
      wrapper.find('[data-testid="desk-copilot-connected-by"]').text(),
    ).toBe('edu');
    expect(
      wrapper.find('[data-testid="desk-copilot-assigned-agents"]').text(),
    ).toBe('3');
    expect(wrapper.find('[data-testid="desk-copilot-created-on"]').text()).toBe(
      moment(linkedProject.createdOn).format('L'),
    );
  });

  it('opens the copilot project in a new tab', async () => {
    await wrapper
      .find('[data-testid="desk-copilot-open-button"]')
      .trigger('click');

    expect(window.open).toHaveBeenCalledWith(
      'https://dash.stg.cloud.weni.ai/projects/copilot-uuid',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('shows the change option when there are multiple projects', () => {
    expect(
      wrapper.find('[data-testid="desk-copilot-more-popover"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-change-option"]').exists(),
    ).toBe(true);
  });

  it('hides the popover when there is a single project', async () => {
    hasMultipleProjects.value = false;
    wrapper.unmount();
    wrapper = createWrapper();
    await wrapper.vm.$nextTick();

    expect(
      wrapper.find('[data-testid="desk-copilot-more-popover"]').exists(),
    ).toBe(false);
  });

  it('emits open-change-modal when change is clicked', async () => {
    await wrapper
      .find('[data-testid="desk-copilot-change-option"]')
      .trigger('click');

    expect(wrapper.emitted('open-change-modal')).toBeTruthy();
  });
});

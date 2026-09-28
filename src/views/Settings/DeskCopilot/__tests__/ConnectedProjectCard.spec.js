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

import ConnectedProjectCard from '../ConnectedProjectCard.vue';
import i18n from '@/plugins/i18n';
import UnnnicSystemPlugin from '@/plugins/UnnnicSystem.js';

vi.mock('@/utils/copilotProject', () => ({
  buildCopilotProjectUrl: vi.fn(
    (uuid) => `https://dash.stg.cloud.weni.ai/projects/${uuid}`,
  ),
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
  projectUuid: 'desk-uuid',
  connectedBy: 'edu',
  isConnected: true,
};

const disconnectedProject = {
  ...linkedProject,
  isConnected: false,
  disconnectedBy: 'ana',
  disconnectedOn: '2026-09-10T00:00:00Z',
};

const createWrapper = (project = linkedProject, readOnly = false) =>
  mount(ConnectedProjectCard, {
    props: { linkedProject: project, readOnly },
    global: {
      plugins: [createTestingPinia()],
      mocks: {
        $t: (key) => key,
      },
    },
  });

describe('DeskCopilot ConnectedProjectCard', () => {
  let wrapper;
  const originalOpen = window.open;

  beforeEach(() => {
    window.open = vi.fn();
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
    expect(
      wrapper.find('[data-testid="desk-copilot-connected-on"]').text(),
    ).toBe(moment(linkedProject.connectedOn).format('L'));
  });

  it('opens the copilot project in a new tab', async () => {
    await wrapper
      .find('[data-testid="desk-copilot-open-button"]')
      .trigger('click');

    expect(window.open).toHaveBeenCalledWith(
      'https://dash.stg.cloud.weni.ai/projects/desk-uuid',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('shows open and disconnect actions when connected', () => {
    expect(
      wrapper.find('[data-testid="desk-copilot-open-button"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-disconnect-button"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-reconnect-button"]').exists(),
    ).toBe(false);
  });

  it('emits open-disconnect-modal when disconnect is clicked', async () => {
    await wrapper
      .find('[data-testid="desk-copilot-disconnect-button"]')
      .trigger('click');

    expect(wrapper.emitted('open-disconnect-modal')).toBeTruthy();
  });

  it('shows reconnect and disconnect metadata when disconnected', async () => {
    wrapper.unmount();
    wrapper = createWrapper(disconnectedProject);
    await wrapper.vm.$nextTick();

    expect(
      wrapper.find('[data-testid="desk-copilot-reconnect-button"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-open-button"]').exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="desk-copilot-disconnect-button"]').exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="desk-copilot-disconnected-by"]').text(),
    ).toBe('ana');
    expect(
      wrapper.find('[data-testid="desk-copilot-disconnected-on"]').text(),
    ).toBe(moment(disconnectedProject.disconnectedOn).format('L'));
  });

  it('emits open-reconnect-modal when reconnect is clicked', async () => {
    wrapper.unmount();
    wrapper = createWrapper(disconnectedProject);
    await wrapper.vm.$nextTick();

    await wrapper
      .find('[data-testid="desk-copilot-reconnect-button"]')
      .trigger('click');

    expect(wrapper.emitted('open-reconnect-modal')).toBeTruthy();
  });

  it('hides actions in readOnly mode', async () => {
    wrapper.unmount();
    wrapper = createWrapper(linkedProject, true);
    await wrapper.vm.$nextTick();

    expect(
      wrapper.find('[data-testid="desk-copilot-open-button"]').exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="desk-copilot-disconnect-button"]').exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="desk-copilot-reconnect-button"]').exists(),
    ).toBe(false);
  });
});

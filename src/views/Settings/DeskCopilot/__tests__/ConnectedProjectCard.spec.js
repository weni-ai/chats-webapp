import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import moment from 'moment';

import ConnectedProjectCard from '../ConnectedProjectCard.vue';

vi.mock('@/utils/copilotProject', () => ({
  buildCopilotProjectUrl: vi.fn(
    (uuid) => `https://dash.stg.cloud.weni.ai/projects/${uuid}`,
  ),
}));

const linkedProject = {
  name: 'Sales 123',
  assigned_agents: 3,
  created_on: '2026-07-30T00:00:00Z',
  connected_on: '2026-07-30T00:00:00Z',
  uuid: 'copilot-uuid',
  connected_by: 'edu',
};

const createWrapper = () =>
  mount(ConnectedProjectCard, {
    props: { linkedProject },
    global: {
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
      moment(linkedProject.created_on).format('L'),
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
});

import { beforeEach, describe, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import DiscussionAbout from '../DiscussionAbout.vue';

import { useDiscussions } from '@/store/modules/chats/discussions';
import { createTestingPinia } from '@pinia/testing';

import Project from '@/services/api/resources/settings/project';
import Discussion from '@/services/api/resources/chats/discussion';

vi.mock('@/services/api/resources/settings/project', () => ({
  default: { allUsers: vi.fn() },
}));

vi.mock('@/services/api/resources/chats/discussion', () => ({
  default: { getDiscussionAgents: vi.fn(), addAgent: vi.fn() },
}));

vi.spyOn(Discussion, 'getDiscussionAgents').mockResolvedValue({
  results: [
    {
      uuid: '1',
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      role: 1,
    },
  ],
});

vi.spyOn(Project, 'allUsers').mockResolvedValue({
  results: [
    {
      first_name: 'Jane',
      last_name: 'Doe',
      role: 1,
      email: 'jane@example.com',
    },
  ],
});

const detailsMock = {
  contact: 'John Doe',
  created_on: '2024-11-01T10:00:00Z',
};

const createWrapper = () => {
  return mount(DiscussionAbout, {
    props: { details: detailsMock },
    global: {
      plugins: [
        createTestingPinia({
          stubActions: false,
          initialState: {
            profile: { me: { email: 'user@example.com' } },
            discussions: {
              activeDiscussion: {
                uuid: '1',
                room: '123',
                contact: 'Contact',
                created_by: { email: 'user@example.com' },
              },
            },
          },
        }),
      ],
    },
  });
};

describe('DiscussionAbout', () => {
  let wrapper;
  let discussionStore;

  beforeEach(() => {
    wrapper = createWrapper();
    discussionStore = useDiscussions();
  });

  it('renders the component correctly with provided details', () => {
    const title = wrapper.find('.discussion-about__section__title');
    expect(title.text()).toContain(
      `${wrapper.vm.$tc('discussions.title')} ${wrapper.vm.$t('about')} ${wrapper.vm.details?.contact}`,
    );
    const date = wrapper.text();
    expect(date).toContain(
      `${wrapper.vm.$t('discussions.about.started_in')} ${wrapper.vm.discussionStartDate}`,
    );
  });

  it('loads agents involved when details are set', async () => {
    await flushPromises();
    expect(wrapper.vm.agentsInvolved).toHaveLength(1);
    expect(wrapper.vm.agentsInvolved[0].first_name).toBe('Jane');
  });

  it('opens and closes the add agent modal', async () => {
    const addAgentButton = wrapper.find('[data-testid="add-agent-button"]');

    await addAgentButton.trigger('click');

    expect(wrapper.vm.isAddAgentModalOpen).toBe(true);

    expect(wrapper.find('[data-testid="add-agent-modal"]').exists()).toBe(true);

    const cancelAddAgentModalButton = wrapper.find(
      '[data-testid="cancel-add-agent-modal-button"]',
    );
    await cancelAddAgentModalButton.trigger('click');

    expect(wrapper.vm.isAddAgentModalOpen).toBe(false);
  });

  it('adds an agent successfully', async () => {
    await wrapper.setData({ isAddAgentModalOpen: true });
    wrapper.vm.agentSelected = [
      { value: 'agent.smith@example.com', label: 'Agent Smith' },
    ];

    discussionStore.addAgent.mockResolvedValue({
      first_name: 'Agent',
      last_name: 'Smith',
      email: 'agent.smith@example.com',
    });

    await wrapper.vm.handlingAddAgent();

    expect(wrapper.vm.agentsInvolved).toHaveLength(2);
    expect(wrapper.vm.agentsInvolved[1].first_name).toBe('Agent');
    expect(wrapper.vm.isAddAgentModalOpen).toBe(false);
    expect(wrapper.vm.addAgentLoading).toBe(false);
  });

  it('handles error when adding an agent fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    wrapper.vm.agentSelected = [
      { value: 'agent.smith@example.com', label: 'Agent Smith' },
    ];
    discussionStore.addAgent.mockRejectedValue(new Error('Test error'));

    await wrapper.vm.handlingAddAgent();

    expect(consoleSpy).toHaveBeenCalledWith(
      'An error occurred when trying to add agent to discussion:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});

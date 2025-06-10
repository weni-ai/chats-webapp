import { expect, describe, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import TableMetrics from '../TableMetrics.vue';

const mockRouter = {
  push: vi.fn(),
};

const createWrapper = (
  props = {},
  profileState = { me: { email: 'test@example.com' } },
) => {
  return mount(TableMetrics, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: { profile: profileState },
        }),
      ],
      mocks: {
        $router: mockRouter,
      },
    },
    props,
  });
};

describe('TableMetrics Component', () => {
  it('renders correctly with given props', () => {
    const wrapper = createWrapper({
      title: 'Test Title',
      icon: 'test-icon',
      headers: 'Opened',
      items: [
        {
          email: 'agent@example.com',
          first_name: 'John',
          last_name: 'Doe',
          opened_rooms: 5,
          closed_rooms: 3,
          agent_status: 'Online',
        },
      ],
    });

    expect(wrapper.text()).toContain('Test Title');
    expect(wrapper.text()).toContain('Opened');
    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('5');
    expect(wrapper.text()).toContain('3');
  });

  it('renders correctly with given props with default items', () => {
    const wrapper = createWrapper({
      title: 'Test Title',
      icon: 'test-icon',
      headers: 'Opened',
    });

    expect(wrapper.text()).toContain('Test Title');
    expect(wrapper.text()).toContain('Opened');
  });

  it('navigates to home when user clicks on their own email', async () => {
    const wrapper = createWrapper({
      items: [
        {
          email: 'test@example.com',
          first_name: 'User',
          last_name: 'Test',
          opened_rooms: 2,
          closed_rooms: 1,
          agent_status: 'Online',
        },
      ],
    });

    await wrapper.find('.item').trigger('click');
    expect(mockRouter.push).toHaveBeenCalledWith({ name: 'home' });
  });

  it('navigates to view mode when clicking on another agent', async () => {
    const wrapper = createWrapper({
      items: [
        {
          email: 'other@example.com',
          first_name: 'Agent',
          last_name: 'X',
          opened_rooms: 4,
          closed_rooms: 2,
          agent_status: 'Offline',
        },
      ],
    });

    await wrapper.find('.item').trigger('click');
    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'dashboard.view-mode',
      params: { viewedAgent: 'other@example.com' },
    });
  });

  it('navigates using keyboard enter key press', async () => {
    const wrapper = createWrapper({
      items: [
        {
          email: 'other@example.com',
          first_name: 'Agent',
          last_name: 'X',
          opened_rooms: 4,
          closed_rooms: 2,
          agent_status: 'Offline',
        },
      ],
    });

    await wrapper.find('.item').trigger('keypress.enter');
    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'dashboard.view-mode',
      params: { viewedAgent: 'other@example.com' },
    });
  });
});

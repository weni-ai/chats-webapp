import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import ListAgents from '../Agents.vue';

describe('ListAgents', () => {
  it('should render with default props', () => {
    const wrapper = mount(ListAgents);

    expect(wrapper.props().agents).toEqual([]);
    expect(wrapper.props().actionText).toBe('');
    expect(wrapper.props().title).toBe('');
  });

  it('should render the title if provided', () => {
    const title = 'Test Agents';
    const wrapper = mount(ListAgents, {
      props: { title },
    });

    const titleElement = wrapper.find('[data-testid="title"]');
    expect(titleElement.text()).toBe(title);
  });

  it('should not render the title if not provided', () => {
    const wrapper = mount(ListAgents);

    const titleElement = wrapper.find('[data-testid="title"]');
    expect(titleElement.exists()).toBe(false);
  });

  it('should compute tableHeaders correctly', () => {
    const wrapper = mount(ListAgents);

    const headers = wrapper.vm.tableHeaders;

    expect(headers).toEqual([
      { id: 'name', text: 'Name', flex: 3 },
      { id: 'additionDate', text: 'Date of addition', flex: 3 },
      { id: 'visualize', text: 'View', flex: 2 },
    ]);
  });

  it('should render the table rows correctly', () => {
    const agents = [
      { name: 'Agent 1', additionDate: '2022-01-01' },
      { name: 'Agent 2', additionDate: '2022-01-02' },
    ];
    const wrapper = mount(ListAgents, {
      props: { agents },
    });

    const rows = wrapper.findAllComponents({ name: 'UnnnicTableRow' });
    expect(rows).toHaveLength(3); // One row for each agent + header

    const row = rows[1];
    expect(row.text()).toContain('Agent 1');
    expect(row.text()).toContain('2022-01-01');
  });

  it('should emit select event when action button is clicked', async () => {
    const agents = [{ name: 'Agent 1', additionDate: '2022-01-01' }];
    const wrapper = mount(ListAgents, {
      props: { agents },
    });

    const button = wrapper.findComponent({ name: 'UnnnicButton' });
    await button.trigger('click');

    expect(wrapper.emitted().select).toBeTruthy();
    expect(wrapper.emitted().select[0]).toEqual([agents[0]]);
  });

  it('should render actionText when provided', () => {
    const agents = [{ name: 'Agent 1', additionDate: '2022-01-01' }];
    const actionText = 'View Details';
    const wrapper = mount(ListAgents, {
      props: { agents, actionText },
    });

    const button = wrapper.findComponent({ name: 'UnnnicButton' });
    expect(button.props().text).toBe(actionText);
  });

  it('should render default action text when actionText is not provided', () => {
    const agents = [{ name: 'Agent 1', additionDate: '2022-01-01' }];
    const wrapper = mount(ListAgents, {
      props: { agents },
    });

    const button = wrapper.findComponent({ name: 'UnnnicButton' });
    expect(button.props().text).toBe('Details');
  });
});

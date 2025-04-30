import { setActivePinia, createPinia } from 'pinia';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { useDashboard } from '../dashboard';
import Dasboard from '@/services/api/resources/dashboard/dashboardManager';

vi.mock('@/services/api/resources/dashboard/dashboardManager', () => ({
  default: { getViewedAgentData: vi.fn() },
}));

describe('useDashboard Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with default state', () => {
    const dashboard = useDashboard();

    expect(dashboard.viewedAgent).toEqual({ email: '', name: '' });
    expect(dashboard.showModalAssumedChat).toBe(false);
    expect(dashboard.assumedChatContactName).toBe('');
  });

  it('should set viewed agent', () => {
    const dashboard = useDashboard();
    const agent = { email: 'test@example.com', name: 'Test Agent' };

    dashboard.setViewedAgent(agent);

    expect(dashboard.viewedAgent).toEqual(agent);
  });

  it('should set showModalAssumedChat', () => {
    const dashboard = useDashboard();

    dashboard.setShowModalAssumedChat(true);

    expect(dashboard.showModalAssumedChat).toBe(true);
  });

  it('should set assumedChatContactName', () => {
    const dashboard = useDashboard();

    dashboard.setAssumedChatContactName('John Doe');

    expect(dashboard.assumedChatContactName).toBe('John Doe');
  });

  it('should fetch viewed agent data and update state', async () => {
    Dasboard.getViewedAgentData.mockResolvedValue({
      first_name: 'Jane',
      last_name: 'Doe',
    });

    const dashboard = useDashboard();
    const agentEmail = 'jane.doe@example.com';

    const result = await dashboard.getViewedAgentData(agentEmail);

    expect(Dasboard.getViewedAgentData).toHaveBeenCalledWith(agentEmail);
    expect(dashboard.viewedAgent).toEqual({
      name: 'Jane Doe',
      email: agentEmail,
    });
    expect(result).toEqual({
      name: 'Jane Doe',
      email: agentEmail,
    });
  });

  it('should return viewed agent from getter', () => {
    const dashboard = useDashboard();
    dashboard.viewedAgent = { email: 'agent@example.com', name: 'Agent' };

    expect(dashboard.getViewedAgent).toEqual({
      email: 'agent@example.com',
      name: 'Agent',
    });
  });

  it('should return showModalAssumedChat from getter', () => {
    const dashboard = useDashboard();
    dashboard.showModalAssumedChat = true;

    expect(dashboard.getShowModalAssumedChat).toBe(true);
  });

  it('should return assumedChatContactName from getter', () => {
    const dashboard = useDashboard();
    dashboard.assumedChatContactName = 'Alice';

    expect(dashboard.getAssumedChatContactName).toBe('Alice');
  });
});

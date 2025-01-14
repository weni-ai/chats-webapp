import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import http from '@/services/api/http';
import DashboardManagerApi from '../dashboardManager';
import { getProject } from '@/utils/config';
import { useProfile } from '@/store/modules/profile';

vi.mock('@/services/api/http');
vi.mock('@/utils/config');
vi.mock('@/store/modules/profile');

describe('DashboardManagerApi', () => {
  const params = {
    sector: '1',
    agent: 'agent',
    tag: 'tag',
    start_date: '2025-01-08',
    end_date: '2025-01-09',
  };
  beforeEach(() => {
    getProject.mockReturnValue('project-uuid');
    useProfile.mockReturnValue({ me: { email: 'me@email.com' } });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return room info', async () => {
    http.get.mockReturnValue({ data: {} });

    DashboardManagerApi.getRoomInfo(
      params.sector,
      params.agent,
      params.tag,
      params.start_date,
      params.end_date,
    );

    expect(http.get).toHaveBeenCalledWith('/dashboard/project-uuid/general/', {
      params,
    });
  });

  it('should return agent info', async () => {
    http.get.mockReturnValue({ data: {} });

    DashboardManagerApi.getAgentInfo(
      params.sector,
      params.agent,
      params.tag,
      params.start_date,
      params.end_date,
    );

    expect(http.get).toHaveBeenCalledWith('dashboard/project-uuid/agent/', {
      params,
    });
  });

  it('should return sector info', async () => {
    http.get.mockReturnValue({ data: {} });

    DashboardManagerApi.getSectorInfo(
      params.sector,
      params.agent,
      params.tag,
      params.start_date,
      params.end_date,
    );

    expect(http.get).toHaveBeenCalledWith('dashboard/project-uuid/division/', {
      params,
    });
  });

  it('should return raw info', async () => {
    http.get.mockReturnValue({ data: {} });

    DashboardManagerApi.getRawInfo(
      params.sector,
      params.agent,
      params.tag,
      params.start_date,
      params.end_date,
    );

    expect(http.get).toHaveBeenCalledWith('dashboard/project-uuid/raw_data/', {
      params,
    });
  });

  it('should return viewed agent data', async () => {
    http.get.mockReturnValue({ data: {} });

    DashboardManagerApi.getViewedAgentData('email@email.com');

    expect(http.get).toHaveBeenCalledWith('/accounts/userdata/', {
      params: { user_email: 'email@email.com' },
    });
  });

  it('should download XLS data when option is "metrics_xls"', async () => {
    const mockResponse = {
      status: 200,
      data: { path_file: '/mock/path/to/file.xlsx' },
      headers: {
        'content-type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    };

    http.get.mockResolvedValueOnce(mockResponse);

    await DashboardManagerApi.downloadMetricData(
      params.sector,
      params.agent,
      params.tag,
      params.start_date,
      params.end_date,
      'metrics_xls',
    );

    expect(http.get).toHaveBeenCalledWith(
      'dashboard/project-uuid/export/?xls=on',
      {
        params,
      },
    );
  });

  it('should download XLS data when option is "metrics_xls"', async () => {
    const mockResponse = {
      status: 200,
      data: { path_file: '/mock/path/to/file.xlsx' },
      headers: {
        'content-type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    };

    http.get.mockResolvedValueOnce(mockResponse);

    await DashboardManagerApi.downloadAllData(
      params.sector,
      params.agent,
      params.tag,
      params.start_date,
      params.end_date,
      'metrics_xls',
    );

    expect(http.get).toHaveBeenCalledWith(
      'dashboard/project-uuid/export_dashboard/',
      {
        params: {
          ...params,
          user_request: 'me@email.com',
        },
      },
    );
  });
});

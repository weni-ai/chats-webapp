import http from '@/services/api/http';

import { useProfile } from '@/store/modules/profile';

import { getProject } from '@/utils/config';

async function downloadFileXlsx(path, filename) {
  try {
    const response = await fetch(path);
    const blob = await response.blob();
    const link = document.createElement('a');

    link.href = window.URL.createObjectURL(blob);
    link.download = filename;

    link.click();

    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error(error);
  }
}

export default {
  async getRoomInfo(idSector, agent, tag, startDate, endDate) {
    const idProject = getProject();
    const response = await http.get(`/dashboard/${idProject}/general/`, {
      params: {
        sector: idSector,
        agent,
        tag,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },
  async getAgentInfo(idSector, agent, tag, startDate, endDate) {
    const idProject = getProject();
    const response = await http.get(`dashboard/${idProject}/agent/`, {
      params: {
        sector: idSector,
        agent,
        tag,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },
  async getSectorInfo(idSector, agent, tag, startDate, endDate) {
    const idProject = getProject();
    const response = await http.get(`dashboard/${idProject}/division/`, {
      params: {
        sector: idSector,
        agent,
        tag,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },
  async getRawInfo(idSector, agent, tag, startDate, endDate) {
    const idProject = getProject();
    const response = await http.get(`dashboard/${idProject}/raw_data/`, {
      params: {
        sector: idSector,
        agent,
        tag,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },
  async downloadMetricData(idSector, agent, tag, startDate, endDate, option) {
    const idProject = getProject();
    const downloadOption = option === 'metrics_xls' ? `?xls=on` : '';
    const response = await http.get(
      `dashboard/${idProject}/export/${downloadOption}`,
      {
        params: {
          sector: idSector,
          agent,
          tag,
          start_date: startDate,
          end_date: endDate,
        },
      },
    );
    if (response.status === 200) {
      const { data, headers } = response;

      if (option.includes('xls') && data.path_file) {
        downloadFileXlsx(data.path_file, 'chats_dashboard_metrics.xlsx');
        return;
      }

      const blob = new Blob([data], { type: headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'download_metric';
      link.click();
    }
  },
  async downloadAllData(idSector, agent, tag, startDate, endDate, option) {
    const profileStore = useProfile();
    const idProject = getProject();
    const downloadOption = option === 'all_xls' ? `?xls=on` : '';
    const { me } = profileStore;
    const response = await http.get(
      `dashboard/${idProject}/export_dashboard/${downloadOption}`,
      {
        params: {
          sector: idSector,
          agent,
          tag,
          start_date: startDate,
          end_date: endDate,
          user_request: me?.email,
        },
      },
    );
    if (response.status === 200) {
      const { data, headers } = response;

      if (option.includes('xls') && data.path_file) {
        downloadFileXlsx(data.path_file, 'chats_dashboard_all.xlsx');
        return;
      }

      const blob = new Blob([data], { type: headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'dashboard';
      link.click();
    }
  },
  async getViewedAgentData(agentEmail) {
    const response = await http.get('/accounts/userdata/', {
      params: { user_email: agentEmail },
    });
    return response.data;
  },
};

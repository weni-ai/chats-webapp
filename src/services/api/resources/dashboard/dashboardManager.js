import http from '@/services/api/http';
import { getProject } from '@/utils/config';

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
  async getProjectInfo() {
    const idProject = getProject();
    const response = await http.get(`/project/${idProject}/`);
    return response;
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
    const response = await http.get(`dashboard/${idProject}/export/${downloadOption}`, {
      params: {
        sector: idSector,
        agent,
        tag,
        start_date: startDate,
        end_date: endDate,
      },
    });
    if (response.status === 200) {
      const { headers } = response;
      const blob = new Blob([response.data], { type: headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'download_metric';
      link.click();
    }
  },
  async downloadAllData(idSector, agent, tag, startDate, endDate, option) {
    const idProject = getProject();
    const downloadOption = option === 'all_xls' ? `?xls=on` : '';
    const response = await http.get(`dashboard/${idProject}/export_dashboard/${downloadOption}`, {
      params: {
        sector: idSector,
        agent,
        tag,
        start_date: startDate,
        end_date: endDate,
      },
    });
    if (response.status === 200) {
      const { headers } = response;
      const blob = new Blob([response.data], { type: headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'dashboard';
      link.click();
    }
  },
  async getViewedAgentData(agentEmail) {
    const response = await http.get('/accounts/userdata/', { params: { user_email: agentEmail } });
    return response.data;
  },
};

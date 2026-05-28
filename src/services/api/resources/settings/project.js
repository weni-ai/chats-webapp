import axios from 'axios';
import http from '@/services/api/http';

import env from '@/utils/env';
import { getProject, getToken } from '@/utils/config';

const weniApiV1 = axios.create({
  baseURL: `${env('WENI_API_URL')}/v1`,
});

weniApiV1.interceptors.request.use((config) => {
  // eslint-disable-next-line no-param-reassign
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

export const Permissions = Object.freeze({
  Admin: 1,
  Agent: 2,
  Manager: 3,
});

export default {
  async admins() {
    const response = await http.get(`/permission/project/`, {
      params: {
        project: getProject(),
        // role: Permissions.Admin,
        limit: 9999,
      },
    });
    return response.data;
  },

  async managers(offset, limit = 20) {
    const response = await http.get(`/permission/project/`, {
      params: {
        project: getProject(),
        offset,
        // role: Permissions.Manager,
        limit,
      },
    });
    return response.data;
  },

  async agents(offset, limit = 20) {
    const response = await http.get(`/permission/project/`, {
      params: {
        project: getProject(),
        offset,
        // role: Permissions.Agent,
        limit,
      },
    });
    return response.data;
  },

  async allUsers() {
    const response = await http.get(`/project/${getProject()}/list_users`, {
      params: {
        limit: 9999,
      },
    });
    return response.data;
  },

  async getRepresentatives({ offset, limit = 20 }) {
    const response = await http.get(`/permission/project/`, {
      params: {
        project: getProject(),
        offset,
        limit,
        role: 2, // Agent
      },
    });
    return response.data;
  },

  async getInfo() {
    const projectUuid = getProject();
    const response = await http.get(`/project/${projectUuid}/`);
    return response;
  },

  async getProjectLanguage() {
    const projectUuid = getProject();
    const endpoint = `/organization/project/${projectUuid}/`;
    const response = await weniApiV1.get(endpoint);
    return response.data?.language || 'en-us';
  },

  async update(data) {
    const projectUuid = getProject();
    const body = {
      config: JSON.stringify(data),
    };

    const response = await http
      .patch(`/project/${projectUuid}/`, body)
      .then((response) => response.data)
      .catch((error) => error.response);
    return response;
  },
};

import axios from 'axios';
import env from '@/utils/env';
import { getProject, getToken } from '@/utils/config';

const http = axios.create({
  baseURL: env('VUE_APP_FLOWS_API_URL'),
  headers: { Authorization: `Bearer ${getToken()}` },
});

export default {
  async getContacts(search) {
    const searchStartsWithNumber = /^[0-9]/.test(search);
    const params = {
      project_uuid: getProject(),
      ...(searchStartsWithNumber ? { number: search } : { name: search }),
      page_size: 100,
    };

    const response = await http.get(`/contacts_elastic.json/`, { params });
    return response.data;
  },
};

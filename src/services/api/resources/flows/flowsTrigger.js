import axios from 'axios';
import env from '@/utils/env';
import { getProject, getToken } from '@/utils/config';

const http = axios.create({
  baseURL: env('VUE_APP_FLOWS_API_URL'),
  headers: { Authorization: `Bearer ${getToken()}` },
});

let cancelTokenSource = null;

export default {
  async getContacts(search) {
    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }

    cancelTokenSource = axios.CancelToken.source();

    const searchStartsWithNumber = /^[0-9]/.test(search);
    const params = {
      project_uuid: getProject(),
      ...(searchStartsWithNumber ? { number: search } : { name: search }),
      page_size: search ? 10 : 100,
    };

    try {
      const response = await http.get(`/contacts_elastic.json/`, {
        params,
        cancelToken: cancelTokenSource.token,
      });

      const resultsResponse = {
        results: response.results
      };

      console.log(resultsResponse);

      return { data: resultsResponse, status: 'success' };
    } catch (error) {
      if (axios.isCancel(error)) {
        return { status: 'canceled' };
      }

      return { status: 'error', error };
    }
  },
};

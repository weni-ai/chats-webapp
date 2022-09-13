import axios from 'axios';

const client = axios.create();

export default {
  /**
   *
   * @param {string} url
   * @returns {Promise<Blob>}
   */
  async get(url) {
    const response = await client.get(url, {
      responseType: 'blob',
    });
    console.log(response.data);
    return response.data;
  },
};

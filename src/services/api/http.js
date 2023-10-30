import axios from 'axios';
import env from '@/utils/env';
import { getToken } from '@/utils/config';

const isProduction = process.env.NODE_ENV === 'production';
const protocol = isProduction ? 'https' : 'https';

const client = axios.create({
  baseURL: `${protocol}://${env('CHATS_API_URL')}/v1`,
});

client.interceptors.request.use((config) => {
  // eslint-disable-next-line no-param-reassign
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

export default client;

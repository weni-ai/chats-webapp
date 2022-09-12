import axios from 'axios';
import { getToken } from '@/utils/config';
import env from '@/utils/env';

const isProduction = process.env.NODE_ENV === 'production';
const protocol = isProduction ? 'https' : 'http';

const client = axios.create({
  baseURL: `${protocol}://${env('CHATS_API_URL')}/v1`,
});

client.interceptors.request.use((config) => {
  const token = getToken();
  // eslint-disable-next-line no-param-reassign
  if (token) config.headers.Authorization = isProduction ? token : `Token ${token}`;
  return config;
});

export default client;

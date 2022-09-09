import axios from 'axios';
import { getToken } from '@/utils/config';
import env from '@/utils/env';

const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

const client = axios.create({
  baseURL: `${protocol}://${env('CHATS_API_URL')}/v1`,
});

client.interceptors.request.use((config) => {
  const token = getToken();
  // eslint-disable-next-line no-param-reassign
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export default client;

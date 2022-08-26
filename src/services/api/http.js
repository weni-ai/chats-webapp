import axios from 'axios';
import { get } from '@/utils/token';
import env from '@/utils/env';

const client = axios.create({
  baseURL: `https://${env('CHATS_API_URL')}/v1`,
});

client.interceptors.request.use((config) => {
  const token = get();
  // eslint-disable-next-line no-param-reassign
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export default client;

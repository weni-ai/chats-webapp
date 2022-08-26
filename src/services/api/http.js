import axios from 'axios';
import { get } from '@/utils/token';
import env from '@/utils/env';

const client = axios.create({
  baseURL: env('CHATS_API_URL'),
});

const isProduction = process.env.NODE_ENV === 'production';

client.interceptors.request.use((config) => {
  const token = get();
  // eslint-disable-next-line no-param-reassign
  if (token) config.headers.Authorization = `${isProduction ? 'Bearer' : 'Token'} ${token}`;
  return config;
});

export default client;

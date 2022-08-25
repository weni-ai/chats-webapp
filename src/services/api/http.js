import axios from 'axios';
import { get } from '@/utils/token';

const client = axios.create({
  baseURL: process.env.VUE_APP_CHATS_API_URL,
});

const isProduction = process.env.NODE_ENV === 'production';

client.interceptors.request.use((config) => {
  const token = get();
  // eslint-disable-next-line no-param-reassign
  if (token) config.headers.Authorization = `${isProduction ? 'Bearer' : 'Token'} ${token}`;
  return config;
});

export default client;

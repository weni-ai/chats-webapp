import axios from 'axios';

const client = axios.create({
  baseURL: process.env.VUE_APP_CHATS_API_URL,
});

const token = process.env.VUE_APP_CHATS_API_TOKEN;
const isProduction = process.env.NODE_ENV === 'production';

if (token) client.defaults.headers.Authorization = `${isProduction ? 'Bearer' : 'Token'} ${token}`;

export default client;

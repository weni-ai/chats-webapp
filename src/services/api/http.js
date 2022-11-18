import axios from 'axios';
import env from '@/utils/env';

const isProduction = process.env.NODE_ENV === 'production';
const protocol = isProduction ? 'https' : 'https';

const client = axios.create({
  baseURL: `${protocol}://${env('CHATS_API_URL')}/v1`,
});

export default client;

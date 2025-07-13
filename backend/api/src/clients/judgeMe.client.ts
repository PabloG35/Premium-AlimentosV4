import axios from 'axios';

export const judgeMeApi = axios.create({
  baseURL: 'https://api.judge.me/',
  params: {
    api_token: process.env.JUDGEME_API_TOKEN,
    shop_domain: process.env.JUDGEME_SHOP_DOMAIN,
  },
});
import axios from 'axios';
import Cookies from 'js-cookie';

const API = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api' });

API.interceptors.request.use(cfg => {
  const token = Cookies.get('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const auth = {
  login: (d) => API.post('/auth/login', d),
  register: (d) => API.post('/auth/register', d),
};

export const company = {
  getProfile: () => API.get('/companies/profile'),
  updateProfile: (d) => API.put('/companies/profile', d),
  getAnalytics: () => API.get('/companies/analytics'),
};

export const messages = {
  list: () => API.get('/messages'),
  send: (id) => API.put(`/messages/${id}/send`),
  updateReply: (id, reply) => API.put(`/messages/${id}/reply`, { reply }),
};

export const chatbot = {
  chat: (text) => API.post('/chatbot/chat', { text }),
};

export const sources = {
  getAll: () => API.get('/sources'),
  addFaq: (d) => API.post('/sources/faq', d),
  deleteFaq: (id) => API.delete(`/sources/faq/${id}`),
  addUrl: (url) => API.post('/sources/url', { url }),
  deleteSource: (id) => API.delete(`/sources/${id}`),
};

export const platforms = {
  getAll: () => API.get('/platforms'),
  save: (d) => API.post('/platforms', d),
};

export const superadmin = {
  getCompanies: () => API.get('/admin/companies'),
  updateCompany: (id, d) => API.put(`/admin/companies/${id}`, d),
  deleteCompany: (id) => API.delete(`/admin/companies/${id}`),
  getStats: () => API.get('/admin/stats'),
  getConfig: () => API.get('/admin/config'),
  saveConfig: (d) => API.put('/admin/config', d),
};

export default API;

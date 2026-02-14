import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Handle 401 responses
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const updatePassword = (data) => API.put('/auth/password', data);
export const updateKhataName = (data) => API.put('/auth/khata-name', data);

// Customers
export const getCustomers = (params) => API.get('/customers', { params });
export const getCustomer = (id) => API.get(`/customers/${id}`);
export const createCustomer = (data) => API.post('/customers', data);
export const updateCustomer = (id, data) => API.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => API.delete(`/customers/${id}`);

// Transactions
export const getTransactions = (customerId, params) =>
  API.get(`/customers/${customerId}/transactions`, { params });
export const addTransaction = (customerId, data) =>
  API.post(`/customers/${customerId}/transactions`, data);
export const deleteTransaction = (id) => API.delete(`/transactions/${id}`);
export const addSharedExpense = (data) => API.post('/transactions/shared-expense', data);
export const replyToNote = (noteId, data) => API.put(`/transactions/notes/${noteId}/reply`, data);

// Dashboard
export const getDashboard = () => API.get('/dashboard');
export const getMonthlySummary = (params) => API.get('/dashboard/monthly', { params });

// Reports
export const getCustomerPDF = (customerId) =>
  API.get(`/reports/customer/${customerId}/pdf`, { responseType: 'blob' });
export const getCustomerCSV = (customerId) =>
  API.get(`/reports/customer/${customerId}/csv`, { responseType: 'blob' });
export const getAllCustomersCSV = () =>
  API.get('/reports/all/csv', { responseType: 'blob' });

// Admin
export const getAdminUsers = () => API.get('/admin/users');
export const deleteAdminUser = (id) => API.delete(`/admin/users/${id}`);
export const getAdminStats = () => API.get('/admin/stats');

// Share
export const getShareToken = (customerId) => API.get(`/customers/${customerId}/share`);

export default API;

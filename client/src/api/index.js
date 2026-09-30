import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
});

// Request interceptor to attach authorization token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mams_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users')
};

export const dashboardAPI = {
  getMetrics: (filters) => api.get('/dashboard/metrics', { params: filters }),
  getBreakdown: (filters) => api.get('/dashboard/breakdown', { params: filters })
};

export const purchasesAPI = {
  getPurchases: (params) => api.get('/purchases', { params }),
  createPurchase: (data) => api.post('/purchases', data)
};

export const transfersAPI = {
  getTransfers: (params) => api.get('/transfers', { params }),
  createTransfer: (data) => api.post('/transfers', data),
  updateStatus: (id, status) => api.patch(`/transfers/${id}/status`, { status })
};

export const assignmentsAPI = {
  getAssignments: (params) => api.get('/assignments', { params }),
  createAssignment: (data) => api.post('/assignments', data),
  returnAssignment: (id) => api.patch(`/assignments/${id}/return`)
};

export const expendituresAPI = {
  getExpenditures: (params) => api.get('/expenditures', { params }),
  createExpenditure: (data) => api.post('/expenditures', data)
};

export const basesAPI = {
  getBases: () => api.get('/bases')
};

export const assetsAPI = {
  getAssets: (params) => api.get('/assets', { params }),
  getEquipmentTypes: () => api.get('/assets/types'),
  getInventory: (params) => api.get('/assets/inventory', { params })
};

export const auditAPI = {
  getAuditLogs: (params) => api.get('/audit', { params })
};

export default api;

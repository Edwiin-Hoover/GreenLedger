import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse, CarbonCredit, User, DashboardStats } from '@/types';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API functions
export const api = {
  get: <T>(url: string, params?: any): Promise<ApiResponse<T>> =>
    apiClient.get(url, { params }).then(res => res.data),
  
  post: <T>(url: string, data?: any): Promise<ApiResponse<T>> =>
    apiClient.post(url, data).then(res => res.data),
  
  put: <T>(url: string, data?: any): Promise<ApiResponse<T>> =>
    apiClient.put(url, data).then(res => res.data),
  
  delete: <T>(url: string): Promise<ApiResponse<T>> =>
    apiClient.delete(url).then(res => res.data),
};

// Carbon Credit API functions
export const carbonCreditApi = {
  // Get all carbon credits
  getCredits: (params?: {
    page?: number;
    limit?: number;
    owner?: string;
    issuer?: string;
    projectType?: string;
    status?: string;
  }): Promise<PaginatedResponse<CarbonCredit>> =>
    api.get('/carbon-credits', params),
  
  // Get credit by ID
  getCreditById: (id: string): Promise<ApiResponse<CarbonCredit>> =>
    api.get(`/carbon-credits/${id}`),
  
  // Get credits by owner
  getCreditsByOwner: (owner: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<CarbonCredit>> =>
    api.get(`/carbon-credits/owner/${owner}`, params),
  
  // Get credits by issuer
  getCreditsByIssuer: (issuer: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<CarbonCredit>> =>
    api.get(`/carbon-credits/issuer/${issuer}`, params),
  
  // Issue new credit
  issueCredit: (data: {
    projectName: string;
    description: string;
    amount: number;
    projectType: string;
    location: string;
    methodology: string;
    verificationBody: string;
    metadataHash: string;
    expiryDate?: string;
  }): Promise<ApiResponse<CarbonCredit>> =>
    api.post('/carbon-credits/issue', data),
  
  // Transfer credit
  transferCredit: (data: {
    tokenId: number;
    to: string;
    amount: number;
  }): Promise<ApiResponse<any>> =>
    api.post('/carbon-credits/transfer', data),
  
  // Burn credit
  burnCredit: (tokenId: number, amount: number): Promise<ApiResponse<any>> =>
    api.post('/carbon-credits/burn', { tokenId, amount }),
  
  // Verify credit
  verifyCredit: (tokenId: number, verified: boolean): Promise<ApiResponse<any>> =>
    api.post('/carbon-credits/verify', { tokenId, verified }),
};

// User API functions
export const userApi = {
  // Get user profile
  getUser: (address: string): Promise<ApiResponse<User>> =>
    api.get(`/users/${address}`),
  
  // Update user profile
  updateUser: (address: string, data: Partial<User>): Promise<ApiResponse<User>> =>
    api.put(`/users/${address}`, data),
  
  // Start KYC process
  startKYC: (address: string, data: {
    name: string;
    email: string;
    organization?: string;
    documents: string[]; // IPFS hashes
  }): Promise<ApiResponse<any>> =>
    api.post(`/users/${address}/kyc`, data),
  
  // Get KYC status
  getKYCStatus: (address: string): Promise<ApiResponse<{ status: string; message?: string }>> =>
    api.get(`/users/${address}/kyc`),
  
  // Register as issuer
  registerIssuer: (address: string, data: {
    organizationName: string;
    description: string;
    website: string;
    documents: string[]; // IPFS hashes
  }): Promise<ApiResponse<any>> =>
    api.post(`/users/${address}/issuer`, data),
};

// Dashboard API functions
export const dashboardApi = {
  // Get dashboard stats
  getStats: (address: string): Promise<ApiResponse<DashboardStats>> =>
    api.get(`/dashboard/stats/${address}`),
  
  // Get reduction history
  getReductionHistory: (address: string, period: 'week' | 'month' | 'year'): Promise<ApiResponse<any[]>> =>
    api.get(`/dashboard/reductions/${address}`, { period }),
  
  // Get credit history
  getCreditHistory: (address: string, period: 'week' | 'month' | 'year'): Promise<ApiResponse<any[]>> =>
    api.get(`/dashboard/credits/${address}`, { period }),
};

// Project API functions
export const projectApi = {
  // Get all projects
  getProjects: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    location?: string;
  }): Promise<PaginatedResponse<any>> =>
    api.get('/projects', params),
  
  // Get project by ID
  getProject: (id: string): Promise<ApiResponse<any>> =>
    api.get(`/projects/${id}`),
  
  // Create project
  createProject: (data: {
    name: string;
    description: string;
    type: string;
    location: string;
    methodology: string;
    estimatedReduction: number;
    documents: string[]; // IPFS hashes
  }): Promise<ApiResponse<any>> =>
    api.post('/projects', data),
  
  // Update project
  updateProject: (id: string, data: any): Promise<ApiResponse<any>> =>
    api.put(`/projects/${id}`, data),
  
  // Submit project for verification
  submitForVerification: (id: string): Promise<ApiResponse<any>> =>
    api.post(`/projects/${id}/verify`),
};

// Analytics API functions
export const analyticsApi = {
  // Get global stats
  getGlobalStats: (): Promise<ApiResponse<any>> =>
    api.get('/analytics/global'),
  
  // Get market data
  getMarketData: (): Promise<ApiResponse<any>> =>
    api.get('/analytics/market'),
  
  // Get trending projects
  getTrendingProjects: (): Promise<ApiResponse<any[]>> =>
    api.get('/analytics/trending'),
};

// Utility functions
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const isApiError = (response: any): response is { error: string } => {
  return response && typeof response.error === 'string';
};

// File upload utility
export const uploadFile = async (file: File, endpoint: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.data.url;
};

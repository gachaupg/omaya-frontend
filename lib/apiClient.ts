/**
 * apiClient.ts – auto‑generated placeholder
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { storage } from '../features/auth/utils/storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if(!API_BASE_URL){
    throw new Error('NEXT_PUBLIC_BASE_URL is not defined in environment variables');
}

const createAxiosInstance = (): AxiosInstance => {
    const instance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return instance;


}

const addAuthInterceptor = (instance: AxiosInstance): AxiosInstance => {
    instance.interceptors.request.use(
        (config) => {
            const profile = storage.getProfile();
            if(profile?.tokens?.access){
                config.headers.Authorization = `Bearer ${profile.tokens.access}`;
            }
            return config ;
        },
        (error) => Promise.reject(error)
    )
    return instance;
}

const addRefreshTokenInterceptor = (instance: AxiosInstance): AxiosInstance => {
    instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        const profile = storage.getProfile();
  
        if (
          error.response?.status === 401 &&
          profile?.tokens?.refresh &&
          originalRequest &&
          !(originalRequest as any)._retry
        ) {
          (originalRequest as any)._retry = true;
          try {
            const response = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
              refresh: profile.tokens.refresh,
            });
            
            const newAccessToken = response.data.access;
            storage.setProfile({
              ...profile,
              tokens: {
                ...profile.tokens,
                access: newAccessToken,
              },
            });
  
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return instance(originalRequest);
          } catch (refreshError) {
            storage.removeProfile();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
    return instance;
  };

  const createApiClient = (): AxiosInstance => {
    const instance = createAxiosInstance();
    const withAuth = addAuthInterceptor(instance);
    const withRefresh = addRefreshTokenInterceptor(withAuth);
    return withRefresh;
  };

  const apiClient = createApiClient();

  export const get = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config);
  };
  
  export const post = <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config);
  };
  
  export const put = <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config);
  };
  
  export const del = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config);
  };
  
  // Export the raw instance if needed for custom configurations
  export { apiClient, AxiosError };
  

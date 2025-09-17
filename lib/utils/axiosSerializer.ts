/**
 * AxiosResponse Serializer/Deserializer for IndexedDB storage
 * 
 * AxiosResponse objects contain functions and circular references that cannot be stored in IndexedDB.
 * This utility provides serialization and deserialization functions to convert AxiosResponse
 * to plain objects and back.
 */

import { AxiosResponse } from 'axios';

/**
 * Serialized version of AxiosResponse that can be stored in IndexedDB
 */
export interface SerializedAxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: {
    url?: string;
    method?: string;
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, any>;
    params?: any;
    data?: any;
  };
  request?: any;
}

/**
 * Serialize AxiosResponse to a plain object that can be stored in IndexedDB
 */
export function serializeAxiosResponse<T>(response: AxiosResponse<T>): SerializedAxiosResponse<T> {
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers as Record<string, string>,
    config: {
      url: response.config.url,
      method: response.config.method,
      baseURL: response.config.baseURL,
      timeout: response.config.timeout,
      headers: response.config.headers as Record<string, any>,
      params: response.config.params,
      data: response.config.data,
    },
    request: response.request,
  };
}

/**
 * Deserialize a plain object back to an AxiosResponse-like object
 */
export function deserializeAxiosResponse<T>(serialized: SerializedAxiosResponse<T>): AxiosResponse<T> {
  // Create a new AxiosResponse-like object
  const response = {
    data: serialized.data,
    status: serialized.status,
    statusText: serialized.statusText,
    headers: serialized.headers,
    config: {
      ...serialized.config,
      // Add default values for required AxiosRequestConfig properties
      headers: serialized.config.headers || {},
      timeout: serialized.config.timeout || 0,
    },
    request: serialized.request,
  } as AxiosResponse<T>;

  // Add common AxiosResponse methods
  response.statusText = serialized.statusText;
  
  return response;
}

/**
 * Check if an object is a valid AxiosResponse
 */
export function isAxiosResponse(obj: any): obj is AxiosResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.status === 'number' &&
    typeof obj.statusText === 'string' &&
    obj.headers &&
    obj.config
  );
}

/**
 * Check if an object is a serialized AxiosResponse
 */
export function isSerializedAxiosResponse(obj: any): obj is SerializedAxiosResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.status === 'number' &&
    typeof obj.statusText === 'string' &&
    obj.headers &&
    obj.config &&
    !obj.transformRequest && // Serialized responses don't have these methods
    !obj.transformResponse
  );
}









import { request } from "http";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
    body?: any
};

async function apiRequest<T>(endpoint: string, method: string, options: RequestOptions = {}): Promise<T> {
   if(API_BASE_URL == null || API_BASE_URL == undefined) {
      throw new Error('API_BASE_URL is not defined');
   }
   else if (API_BASE_URL == 'http://localhost:3000') {
      console.warn('NEXT_PUBLIC_API_BASE_URL is not set. Using default value: http://localhost:3000');
   }

   const headers = new Headers(options.headers)
   const url = `${API_BASE_URL}${endpoint}`;
   let body: BodyInit | undefined;

   if (options.body != undefined){
        if(options.body instanceof FormData || typeof options.body === 'string') {
            body = options.body;
        }
        else {
            headers.set('Content-Type', 'application/json');
            body = JSON.stringify(options.body);
        }
   }

   const response = await fetch(url, {
        ...options,
        headers,
        body
   });

   if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
   }

   if (response.status === 204) {
        return undefined as T;
   }

   return (await response.json()) as T;
}


export const api = {
    get: <T>(endpoint: string) => apiRequest<T>(endpoint, 'GET'),
    post: <T>(endpoint: string, body?: any) => apiRequest<T>(endpoint, 'POST', { body }),
    put: <T>(endpoint: string, body?: any) => apiRequest<T>(endpoint, 'PUT', { body }),
    delete: <T>(endpoint: string) => apiRequest<T>(endpoint, 'DELETE'),
}
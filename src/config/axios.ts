import axios, { AxiosRequestConfig } from "axios";
import store from "../store";
import { IApiResponseError, IResponse } from "../types/responseType";
import { login as companyLogin, logout as companyLogout } from "../features/company/companySlice";
import { login as employeeLogin, logout as employeeLogout, setAccessToken as setEmployeeAccessToken } from "../features/employee/employeeSlice";
import { login as adminLogin, logout as adminLogout } from "../features/admin/adminSlice";
import { BACKEND_BASE_URL } from "../constants";
import { errorPopup } from "../utils/popup";
import { refreshApi } from "./axiosRefresh";
import { jwtDecode } from "jwt-decode"; 


/**
 * Check if a token is valid (not expired)
 */
const isTokenValid = (token: string | null | undefined): boolean => {
  if (!token) return false;
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp < currentTime) {
      return false; // Token expired
    }
    return true; // Token is valid
  } catch (error) {
    return false; // Token is invalid/malformed
  }
};

const getErrorMessage = (errData: any): string => {
  if (!errData) return "Some error occurred";
  const raw = errData.error || errData.message || errData;


  if (typeof raw === "string") {
    try {
      
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const messages = parsed
          .map((e: any) => e?.message)
          .filter(Boolean)
          .join(", ");
        return messages || raw;
      }
      return parsed?.message || raw;
    } catch {
      return raw;
    }
  }


  if (Array.isArray(raw)) {
    const messages = raw
      .map((e: any) => e?.message)
      .filter(Boolean)
      .join(", ");
    return messages || "Validation failed";
  }

  if (typeof raw === "object" && raw.message) return raw.message as string;

  return "Some error occurred";
};

export const appApi = axios.create({
  baseURL: BACKEND_BASE_URL + "/api",
  withCredentials: true,
});

appApi.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const { accessToken: employeeToken } = state.employee;
    const { accessToken: companyToken } = state.company;
    const { accessToken: adminToken } = state.admin;

    // Route detection: Check URL with or without leading slash
    // Employee routes start with 'employe' (not 'employees' which is company route)
    // Also include '/chat' routes as employee routes
    const url = config.url || '';
    // Check for admin routes - must be at the start of the path segment
    const isAdminRoute = /^\/?admin(\/|$)/.test(url) && !url.includes('/auth/admin') && !url.includes('auth/admin');
    // Check for employee routes - includes /employe and /chat routes
    const isEmployeeRoute = (/^\/?employe(\/|$)/.test(url) && !/^\/?employees(\/|$)/.test(url)) ||
                            /^\/?chat(\/|$)/.test(url);
    // Special case: routes that allow both company and employee users
    const isCreateProfileRoute = url.includes('create-profile');
    
    let token: string | undefined;
    if (isAdminRoute) {
      // For admin routes, ONLY use adminToken
      // Never fall back to companyToken to prevent role confusion
      // If no admin token exists, don't send any token (will result in 401)
      token = adminToken || undefined;
      if (!token) {
        console.warn("Admin route accessed without admin token:", config.url);
        // Don't send any token - let the request fail with 401
      }
    } else if (isEmployeeRoute) {
      // For employee routes, use employee token
      // Exception: create-profile route allows company users too
      // For create-profile, prefer company token (company users typically create employee profiles)
      // Only use employee token if company token is not available or invalid
      if (isCreateProfileRoute) {
        if (isTokenValid(companyToken)) {
          token = companyToken;
        } else if (isTokenValid(employeeToken)) {
          token = employeeToken;
        } else {
          token = companyToken || employeeToken; // Fallback to whatever exists (will fail with 401 if invalid)
        }
      } else {
        // For other employee routes, use employee token (must be valid)
        token = isTokenValid(employeeToken) ? employeeToken : undefined;
      }
    } else {
      // For company routes, ONLY use companyToken
      token = companyToken;
    }

    // Debug logging for token attachment
    if (url.includes('/company/employee/') && !token) {
      console.warn("Company employee route accessed without company token:", {
        url: config.url,
        hasCompanyToken: !!companyToken,
        hasEmployeeToken: !!employeeToken,
        hasAdminToken: !!adminToken
      });
    }

    // Only set Authorization header if we have a valid token
    // This prevents sending wrong tokens
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } else if (!token && url.includes('/company/') && !url.includes('/auth/')) {
      // Only warn for non-auth company routes that require tokens
      // Auth routes like /auth/company/login don't need tokens
      console.warn("Company route accessed without token - will result in 401:", config.url);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

appApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;

    const status = error?.response?.status;
    const errData = error?.response?.data || {};
    const errMessage = getErrorMessage(errData);

    if (
      status === 401 &&
      (errData?.error === "Invalid token" || errMessage === "Invalid token") &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Route detection: Get the URL from the request
      // originalRequest.url is relative to baseURL, so it should start with /
      const requestUrl = originalRequest.url || '';
      
      // Check current token state to determine which refresh endpoint to use
      const state = store.getState();
      const hasAdminToken = !!state.admin.accessToken;
      const hasCompanyToken = !!state.company.accessToken;
      
      // Check if URL contains route patterns (simple and reliable)
      // Admin routes: must be at the start of the path segment, not auth/admin
      const isAdminRoute = /\/?admin(\/|$)/.test(requestUrl) && 
                           !requestUrl.includes('/auth/admin') && !requestUrl.includes('auth/admin');
      // Employee routes: employe (but not employees which is company route) OR /chat routes
      const isEmployeeRoute = (/\/?employe(\/|$)/.test(requestUrl) && 
                              !/\/?employees(\/|$)/.test(requestUrl)) ||
                              /\/?chat(\/|$)/.test(requestUrl);
      
      // Determine which refresh endpoint to use
      // Priority: route detection > token state
      const hasEmployeeToken = !!state.employee.accessToken;
      
      let refreshEndpoint: string;
      let userType: 'company' | 'employee' | 'admin' = 'company';
      
      if (isEmployeeRoute && hasEmployeeToken) {
        // Employee route with employee token - use employee refresh
        refreshEndpoint = "/auth/employee/refresh";
        userType = 'employee';
      } else if (isAdminRoute) {
        // For admin routes, ONLY use admin refresh if admin token exists
        if (!hasAdminToken) {
          store.dispatch(adminLogout());
          console.error("Admin route accessed without admin token - redirecting to login");
          return Promise.reject(error);
        }
        refreshEndpoint = "/auth/admin/refresh";
        userType = 'admin';
      } else if (hasAdminToken && !hasCompanyToken && !hasEmployeeToken) {
        // Fallback: if only admin token exists, use admin refresh
        refreshEndpoint = "/auth/admin/refresh";
        userType = 'admin';
      } else {
        // Default to company refresh
        refreshEndpoint = "/auth/company/refresh";
        userType = 'company';
      }

      // Try to refresh token (all user types now support refresh)
      try {
        const res = await refreshApi.get(refreshEndpoint);
        
        // Backend returns: { data: accessToken } for employee, { success: true, message: "...", data: accessToken } for company/admin
        const responseData = res?.data;
        const newAccessToken = responseData?.data || responseData;

        if (!newAccessToken || typeof newAccessToken !== 'string') {
          console.error("Refresh response structure:", responseData);
          throw new Error("Refresh did not return a new access token");
        }
        
        // Update the correct slice based on user type
        if (userType === 'employee') {
          store.dispatch(setEmployeeAccessToken(newAccessToken));
        } else if (userType === 'admin') {
          store.dispatch(adminLogin(newAccessToken));
        } else {
          store.dispatch(companyLogin(newAccessToken));
        }

        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        } else {
          originalRequest.headers = { Authorization: `Bearer ${newAccessToken}` };
        }

        return appApi(originalRequest);
      } catch (err) {
        // Refresh failed - logout user
        if (userType === 'employee') {
          store.dispatch(employeeLogout());
        } else if (userType === 'admin') {
          store.dispatch(adminLogout());
        } else {
          store.dispatch(companyLogout());
        }
        console.error("Refresh token failed:", err);
        return Promise.reject(err);
      }
    }

    if (status === 403) {
      // 403 means forbidden - user doesn't have the right role or is blocked
      if (errData?.error === "Blocked" || errMessage === "Blocked") {
        errorPopup("You are blocked by admin");
      }
      // For role mismatch errors, don't show popup - component should handle it
      // Don't logout on 403 - just reject the promise
      return Promise.reject(error);
    }

    // Handle connection errors with helpful messages
    if (
      error.code === 'ECONNREFUSED' || 
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('ERR_CONNECTION_REFUSED') ||
      error.message?.includes('Network Error') ||
      (!error.response && error.request)
    ) {
      const errorMsg = `Cannot connect to server at ${BACKEND_BASE_URL}/api.\n\nPlease check:\n1. Backend server is running\n2. Backend URL is correct\n3. No firewall blocking the connection`;
      console.error('[Axios] Network Error:', {
        code: error.code,
        message: error.message,
        url: originalRequest?.url,
        baseURL: BACKEND_BASE_URL,
        fullURL: BACKEND_BASE_URL + '/api' + (originalRequest?.url || ''),
        request: error.request
      });
      errorPopup(errorMsg);
      return Promise.reject(error);
    }

    errorPopup(errMessage || "Some error occurred");
    return Promise.reject(error);
  }
);

export const axiosGetRequest = async (
  url: string,
  config?: AxiosRequestConfig
): Promise<IResponse> => {
  try {
    const res = await appApi.get(url, config);
    return res.data;
  } catch (err) {
    const apiError = err as IApiResponseError;
    errorPopup(getErrorMessage(apiError?.response?.data));
    throw err;
  }
};

export const axiosPostRequest = async (
  url: string,
  data: any,
  config?: AxiosRequestConfig<any>
): Promise<IResponse> => {
  try {
    const res = await appApi.post(url, data, config);
    return res.data;
  } catch (err) {
    const apiError = err as IApiResponseError;
    errorPopup(getErrorMessage(apiError?.response?.data));
    throw err;
  }
};

export const axiosPutRequest = async (
  url: string,
  data: any,
  config?: AxiosRequestConfig<any>
): Promise<IResponse> => {
  try {
    const res = await appApi.put(url, data, config);
    return res.data;
  } catch (err) {
    const apiError = err as IApiResponseError;
    errorPopup(getErrorMessage(apiError?.response?.data));
    throw err;
  }
};

export const axiosPatchRequest = async (
  url: string,
  data?: any,
  config?: AxiosRequestConfig<any>
): Promise<IResponse> => {
  try {
    const res = await appApi.patch(url, data, config);
    return res.data;
  } catch (err) {
    const apiError = err as IApiResponseError;
    errorPopup(getErrorMessage(apiError?.response?.data));
    throw err;
  }
};

export const axiosDeleteRequest = async (url: string): Promise<IResponse> => {
  try {
    const res = await appApi.delete(url);
    return res.data;
  } catch (err) {
    const apiError = err as IApiResponseError;
    errorPopup(getErrorMessage(apiError?.response?.data));
    throw err;
  }
};

export default appApi;

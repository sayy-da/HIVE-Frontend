import axios, { AxiosRequestConfig } from "axios";
import store from "../store";
import { IApiResponseError, IResponse } from "../types/responseType";
import { login as companyLogin, logout as companyLogout } from "../features/company/companySlice";
import { login as employeeLogin, logout as employeeLogout } from "../features/employee/employeeSlice";
import { BACKEND_BASE_URL, REFRESH_TOKEN_API } from "../constants";
import { errorPopup } from "../utils/popup";
import { refreshApi } from "./axiosRefresh"; 


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


    const isEmployeeRoute = config.url?.includes('/employe') || config.url?.includes('/employee');
    
    const token = isEmployeeRoute ? employeeToken : companyToken;

    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
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

      try {
        const res = await refreshApi.get(REFRESH_TOKEN_API);
        const newAccessToken = (res?.data as any)?.data as string;

        if (!newAccessToken) {
          throw new Error("Refresh did not return a new access token");
        }

        const isEmployeeRoute = originalRequest.url?.includes('/employe') || originalRequest.url?.includes('/employee');
        
        if (isEmployeeRoute) {
          store.dispatch(employeeLogin(newAccessToken));
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
        
        const isEmployeeRoute = originalRequest.url?.includes('/employe') || originalRequest.url?.includes('/employee');
        
        if (isEmployeeRoute) {
          store.dispatch(employeeLogout());
        } else {
          store.dispatch(companyLogout());
        }
        console.error("Refresh token failed:", err);
        return Promise.reject(err);
      }
    }

    if (status === 403 && (errData?.error === "Blocked" || errMessage === "Blocked")) {
      errorPopup("You are blocked by admin");
      const isEmployeeRoute = originalRequest?.url?.includes('/employe') || originalRequest?.url?.includes('/employee');
      
      if (isEmployeeRoute) {
        store.dispatch(employeeLogout());
      } else {
        store.dispatch(companyLogout());
      }
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

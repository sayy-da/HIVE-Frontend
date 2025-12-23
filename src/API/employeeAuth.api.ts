import { axiosPostRequest, axiosGetRequest } from "../config/axios";
import { successPopup } from "../utils/popup";
import store from "../store";
import { login as employeeLogin, setEmployeeData } from "../features/employee/employeeSlice";

export const checkEmployeeStatus = async (email: string, companyId: string) => {
  const res = await axiosPostRequest("/employe/checkStatus", { email, companyId });
  if (!res) throw new Error("No response from checkStatus API");
  const statusData = (res as any).data || res;
  return statusData as { status: string };
};


export const requestEmployeeLoginOTP = async (email: string, companyId: string) => {
  const res = await axiosPostRequest("/employe/login/request", { email, companyId });
  if (!res) throw new Error("No response from login request API");
  successPopup(res.message || "OTP sent successfully!");
  store.dispatch(setEmployeeData({ email, companyId }));
  return res;
};


export const verifyEmployeeLoginOTP = async (email: string, companyId: string, OTP: string): Promise<string | undefined> => {
  const res = await axiosPostRequest("/employe/login/verify", { email, companyId, OTP });
  if (!res) return;
  const accessToken = res.data as string;
  if (accessToken) {
    store.dispatch(employeeLogin(accessToken));
    successPopup(res.message || "Login successful");
  }
  return accessToken;
};

export const registerEmployee = async (email: string, companyId: string) => {
  const res = await axiosPostRequest("/employe/register", { email, companyId });
  if (!res) throw new Error("No response from register API");
  successPopup(res.message || "OTP sent successfully!");
  return res;
};

export const verifyEmployeeOTP = async (email: string, OTP: string) => {
  const res = await axiosPostRequest("/company/verifyOTP", { email, OTP });
  if (!res) throw new Error("No response from verifyOTP API");
  successPopup(res.message || "OTP verified successfully!");
  return res;
};

export const resendEmployeeOTP = async (email: string) => {
  const res = await axiosGetRequest(`/company/resendOTP/${email}`);
  if (!res) throw new Error("No response from resendOTP API");
  successPopup(res.message || "OTP resent successfully!");
  return res;
};

export const completeEmployeeRegister = async (params: {
  name: string;
  email: string;
  position: string;
  address: string;
  companyId: string;
}) => {
  const res = await axiosPostRequest("/employe/completeRegister", params);
  if (!res) throw new Error("No response from completeRegister API");
  successPopup(res.message || "Registration completed successfully!");
  return res;
};

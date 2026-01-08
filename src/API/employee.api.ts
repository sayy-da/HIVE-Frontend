import { axiosPostRequest, axiosGetRequest, axiosPutRequest } from "../config/axios";
import { Employee } from "./company.api";
import { successPopup } from "../utils/popup";
import store from "../store";
import { login as employeeLoginAction, setEmployeeData } from "../features/employee/employeeSlice";

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
    store.dispatch(employeeLoginAction(accessToken));
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

export const employeeLogin = async (email: string, companyId: string, password: string): Promise<string | undefined> => {
  const res = await axiosPostRequest("/auth/employee/login", { email, companyId, password });
  if (!res) return;
  const accessToken = res.data as string;
  if (accessToken) {
    store.dispatch(employeeLoginAction(accessToken));
    successPopup(res.message || "Login successful");
  }
  return accessToken;
};

export const logoutEmployee = async (): Promise<void> => {
  const res = await axiosPostRequest("/employe/logout", {});
  if (!res) {
    throw new Error("No response from logout API");
  }
};

export const forgotPasswordEmployee = async (email: string, companyId: string) => {
  const res = await axiosPostRequest("/auth/employee/forgot-password", { email, companyId });
  if (!res) throw new Error("No response from forgot password API");
  successPopup(res.message || "OTP sent to your email");
  return res;
};

export const resetPasswordEmployee = async (email: string, companyId: string, newPassword: string) => {
  const res = await axiosPostRequest("/auth/employee/reset-password", { email, companyId, newPassword });
  if (!res) throw new Error("No response from reset password API");
  successPopup(res.message || "Password reset successfully");
  return res;
};

export const updateEmployeeAvatar = async (characterTexture: string) => {
  const res = await axiosPutRequest("/employe/avatar", { characterTexture });
  if (!res) throw new Error("No response from update avatar API");
  successPopup(res.message || "Avatar updated successfully");
  // Update Redux state
  store.dispatch(setEmployeeData({ characterTexture }));
  return res;
};

export const getEmployeeProfile = async (): Promise<Employee> => {
  const res = await axiosGetRequest("/employe/profile");
  if (!res) throw new Error("No response from get profile API");
  
  // Backend returns { message: string, data: Employee }
  // axiosGetRequest returns res.data (response body), so res is { message, data }
  console.log('Profile API response:', res)
  
  // Handle both cases: res.data (if wrapped) or res itself (if direct)
  const employeeData = (res as any).data || res;
  
  if (!employeeData || typeof employeeData !== 'object') {
    console.error('Invalid profile response structure:', res)
    throw new Error("Invalid profile response structure")
  }
  
  return employeeData as Employee;
};

export const changeEmployeePassword = async (currentPassword: string, newPassword: string) => {
  const res = await axiosPutRequest("/employe/change-password", { currentPassword, newPassword });
  if (!res) throw new Error("No response from change password API");
  successPopup(res.message || "Password changed successfully");
  return res;
};

export const updateEmployeeProfile = async (address: string) => {
  const res = await axiosPutRequest("/employe/profile", { address });
  if (!res) throw new Error("No response from update profile API");
  successPopup(res.message || "Profile updated successfully");
  return res.data as Employee;
};
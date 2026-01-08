import axios from "axios";
import {
  axiosGetRequest,
  axiosPostRequest,
} from "../config/axios";
import {
  BACKEND_BASE_URL,
  REFRESH_TOKEN_API,
} from "../constants";
import { successPopup } from "../utils/popup";

type LoginResponse = string;

export const getRefresh = async () => {
  const res = await axios.get(`${BACKEND_BASE_URL}/api${REFRESH_TOKEN_API}`, {
    withCredentials: true,
  });
  return res.data.data;
};

export const registerCompany = async (email: string) => {
  const res = await axiosPostRequest("/auth/company/register", { email });
  if (!res) throw new Error("No response from register API");
  successPopup(res.message || "OTP sent");
  return res;
};

export const verifyOTP = async (email: string, OTP: string) => {
  const res = await axiosPostRequest("/auth/company/verifyOTP", {
    email,
    OTP,
  });
  if (!res) return;
  successPopup(res.message || "OTP verified");
};

export const resendOTP = async (email: string) => {
  const res = await axiosGetRequest(`auth/company/resendOTP/${email}`);
  if (!res) return;
  successPopup(res.message || "OTP Sent");
};

export const completeRegister = async (params: {
  email: string;
  name: string;
  address: string;
  count: number;
  password: string;
}) => {
  const res = await axiosPostRequest("/auth/company/register/complete", params);
  if (!res) return;
  successPopup(res.message || "User registered");
};

export const loginCompany = async (
  email: string,
  password: string
): Promise<LoginResponse | undefined> => {
  const res = await axiosPostRequest("/auth/company/login", { email, password });
  if (!res) return;
  successPopup(res.message || "Login successful");
  return res.data as LoginResponse;
};





export const loginWithGoogle = () => {
  window.location.href = `${BACKEND_BASE_URL}/api/auth/company/google`;
};




export const forgotPasswordCompany = async (email: string) => {
  const res = await axiosPostRequest("/auth/company/forgot-password", { email });
  if (!res) throw new Error("No response from forgot password API");
  successPopup(res.message || "OTP sent to your email");
  return res;
};

export const resetPasswordCompany = async (email: string, newPassword: string) => {
  const res = await axiosPostRequest("/auth/company/reset-password", { email, newPassword });
  if (!res) throw new Error("No response from reset password API");
  successPopup(res.message || "Password reset successfully");
  return res;
};



// admin login
export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  message: string;
  accessToken: string;
}

/**
 * Admin Login API
 * Returns access token for admin authentication
 */
export const adminLogin = async (email: string, password: string): Promise<string> => {
  const res = await axiosPostRequest("auth/admin/login", {
    email,
    password,
  });
  
  if (!res) {
    throw new Error("No response from admin login API");
  }
  
  // Backend returns: { success: true, message: "...", data: accessToken }
  const accessToken = res.data;
  
  if (!accessToken || typeof accessToken !== 'string') {
    console.error("Login response structure:", res);
    throw new Error("No access token received from admin login API");
  }
  
  return accessToken;
};
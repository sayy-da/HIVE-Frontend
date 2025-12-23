import axios from "axios";
import {
  axiosGetRequest,
  axiosPostRequest,
} from "../config/axios";
import {
  BACKEND_BASE_URL,
  COMPLETE_REGISTER_API,
  LOGIN_API,
  REGISTER_API,
  VERIFY_OTP_API,
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

export const loginCompany = async (
  email: string,
  password: string
): Promise<LoginResponse | undefined> => {
  const res = await axiosPostRequest(LOGIN_API, { email, password });
  if (!res) return;
  successPopup(res.message || "Login successful");
  return res.data as LoginResponse;
};

export const registerCompany = async (email: string) => {
  const res = await axiosPostRequest(REGISTER_API, { email });
  if (!res) throw new Error("No response from register API");
  successPopup(res.message || "OTP sent");
  return res;
};

export const verifyOTP = async (email: string, OTP: string) => {
  const res = await axiosPostRequest(VERIFY_OTP_API, {
    email,
    OTP,
  });
  if (!res) return;
  successPopup(res.message || "OTP verified");
};

export const completeRegister = async (params: {
  email: string;
  name: string;
  address: string;
  count: number;
  password: string;
}) => {
  const res = await axiosPostRequest(COMPLETE_REGISTER_API, params);
  if (!res) return;
  successPopup(res.message || "User registered");
};

export const resendOTP = async (email: string) => {
  const res = await axiosGetRequest(`/company/resendOTP/${email}`);
  if (!res) return;
  successPopup(res.message || "OTP Sent");
};

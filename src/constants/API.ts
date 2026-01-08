export const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3000'

export const LOGIN_API = "/company/login";
export const LOGOUT_API = "/company/logout";
export const REGISTER_API = "/company/register";
export const COMPLETE_REGISTER_API = "/company/register/complete";
export const VERIFY_OTP_API = "/company/verifyOTP";
export const REFRESH_TOKEN_API = "/company/refresh";
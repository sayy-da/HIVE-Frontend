import { axiosPostRequest, axiosGetRequest, axiosPatchRequest } from "../config/axios";
import { Company } from "./company.api";


/**
 * Admin Logout API
 * Revokes refresh token and clears authentication
 */
export const adminLogout = async (): Promise<void> => {
  const res = await axiosPostRequest("/admin/logout", {});
  if (!res) {
    throw new Error("No response from admin logout API");
  }
  // Backend returns: { success: true, message: "..." }
  // No data needed, just confirmation
};

export const getAllCompanies = async (): Promise<Company[]> => {
  const res = await axiosGetRequest("admin/companies");
  if (!res) throw new Error("No response from getAllCompanies API");
  return (res.data || res) as Company[];
};

/**
 * Admin Update Company API
 * Allows admin to update any company by ID
 */
export const updateCompanyByAdmin = async (companyId: string, companyData: Partial<Company>): Promise<Company> => {
  const res = await axiosPatchRequest(`admin/company/${companyId}`, companyData);
  if (!res) throw new Error("No response from updateCompanyByAdmin API");
  return ((res as any).data?.company || (res as any).company || res.data) as Company;
};


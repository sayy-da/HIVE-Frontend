import { axiosGetRequest, axiosPatchRequest, axiosPostRequest, axiosPutRequest } from "../config/axios";

export interface RequestedEmployee {
  _id: string;
  name: string;
  email: string;
  position: string;
  address: string;
  status: "pending" | "active" | "inactive";
  companyId: string;
  isEmailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
  position: string;
  address?: string;
  role: "admin" | "user";
  status: "pending" | "active" | "inactive";
  companyId: string;
  isEmailVerified: boolean;
  characterTexture?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getRequestedEmployees = async (): Promise<RequestedEmployee[]> => {
  const res = await axiosGetRequest("/company/requests");
  if (!res) throw new Error("No response from getRequestedEmployees API");
  return (res.data || res) as RequestedEmployee[];
};

export const getApprovedEmployees = async (): Promise<Employee[]> => {
  const res = await axiosGetRequest("/company/employees");
  if (!res) throw new Error("No response from getApprovedEmployees API");
  return (res.data || res) as Employee[];
};

export const getAllEmployees = async (): Promise<Employee[]> => {
  const res = await axiosGetRequest("/company/employees/all");
  if (!res) throw new Error("No response from getAllEmployees API");
  return (res.data || res) as Employee[];
};

export const acceptEmployee = async (email: string): Promise<void> => {
  const res = await axiosPatchRequest("/company/accept", { email });
  if (!res) throw new Error("No response from acceptEmployee API");
  return;
};

export const logoutCompany = async (): Promise<void> => {
  const res = await axiosPostRequest("/company/logout", {});
  if (!res) {
    throw new Error("No response from logout API");
  }
};

export interface Company {
  _id: string;
  name: string;
  email: string;
  address?: string;
  count: number;
  createdAt?: string;
  updatedAt?: string;
  website?: string;
  phone?: string;
  logo?: string;
  code?: number;
  isEmailVerified?: boolean;
  status?: "active" | "inactive";
}


export const updateCompany = async (_companyId: string, companyData: Partial<Company>): Promise<Company> => {
  // Note: companyId parameter is kept for type compatibility, but backend uses authenticated company ID from token
  const res = await axiosPatchRequest(`/company/update`, companyData);
  if (!res) throw new Error("No response from updateCompany API");
  return ((res as any).data?.company || (res as any).company || res.data) as Company;
};

export interface CreateEmployeeProfileData {
  name: string;
  email: string;
  position: string;
  role: "admin" | "user";
}

export const createEmployeeProfile = async (employeeData: CreateEmployeeProfileData, companyId: string): Promise<void> => {
  const res = await axiosPostRequest(`/employe/create-profile?companyId=${companyId}`, employeeData);
  if (!res) throw new Error("No response from createEmployeeProfile API");
  return;
};

export const toggleEmployeeStatus = async (employeeId: string): Promise<Employee> => {
  const res = await axiosPatchRequest(`/company/employee/${employeeId}/status`, {});
  if (!res) throw new Error("No response from toggleEmployeeStatus API");

  // axiosPatchRequest may already return the response body, which can be:
  // { message, employee } OR the employee object directly.
  const responseData = res as any;
  const employee =
    responseData.employee || // when body is { message, employee }
    responseData.data?.employee || // when axios response is passed through
    responseData.data || // when body is the employee
    responseData; // fallback

  if (!employee || !employee._id) {
    console.error("Invalid employee data in toggleEmployeeStatus response:", responseData);
    throw new Error("Invalid employee data received from server");
  }

  return employee as Employee;
};

export interface UpdateEmployeeData {
  name?: string;
  position?: string;
  role?: "admin" | "user";
}

export const updateEmployee = async (employeeId: string, employeeData: UpdateEmployeeData): Promise<Employee> => {
  const res = await axiosPatchRequest(`/company/employee/${employeeId}`, employeeData);
  if (!res) throw new Error("No response from updateEmployee API");
  // Backend returns: { message: string, employee: Employee }
  // axiosPatchRequest returns res.data which is the response body
  const responseData = res as any;
  const employee = responseData.employee || responseData.data?.employee || responseData.data;
  if (!employee || !employee._id) {
    console.error("Invalid employee data in response:", responseData);
    throw new Error("Invalid employee data received from server");
  }
  return employee as Employee;
};

// Get company profile
export const getCompanyProfile = async (): Promise<Company> => {
  const res = await axiosGetRequest("/company/company");
  if (!res) throw new Error("No response from getCompanyProfile API");
  // Backend returns company directly or wrapped in data
  return (res.data || res) as Company;
};

// Change company password
export const changeCompanyPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const res = await axiosPutRequest("/company/change-password", { currentPassword, newPassword });
  if (!res) throw new Error("No response from changeCompanyPassword API");
  return;
};


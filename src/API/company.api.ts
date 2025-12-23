import { axiosGetRequest, axiosPatchRequest } from "../config/axios";

export interface RequestedEmployee {
  _id: string;
  name: string;
  email: string;
  position: string;
  address: string;
  status: "requested" | "approved" | "rejected";
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
  status: "requested" | "approved" | "rejected";
  companyId: string;
  active: boolean;
  isEmailVerified: boolean;
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

export const acceptEmployee = async (email: string): Promise<void> => {
  const res = await axiosPatchRequest("/company/accept", { email });
  if (!res) throw new Error("No response from acceptEmployee API");
  return;
};


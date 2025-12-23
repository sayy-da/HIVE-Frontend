import { lazy } from "react";

import HomePage from "./pages/company/HomePage";
import LoginPage from "./pages/company/LoginPage";
import GetStartPage from "./pages/company/GetStartPage";
import CompanyRegister from "./pages/company/CompanyRegister";
import CompanyOtp from "./pages/company/CompanyOtp";
const CompanyDashboard = lazy(() => import("./pages/company/CompanyDashboard"));
const EmployeeLogin = lazy(() => import("./pages/employee/EmployeeLogin"));
const EmployeeOtp = lazy(() => import("./pages/employee/EmployeeOtp"));
const EmployeeRegister = lazy(() => import("./pages/employee/EmployeeRegister"));
const EmployeeWorkspace = lazy(() => import("./pages/Workspace/Office"));



type Route = {
  path: string;
  Component: React.ComponentType;
};

type Routes = Route[];

export const PublicRoutes: Routes = [
  {
    path: "",
    Component: HomePage,
  },
];

export const companyRoutes: Routes = [
  {
    path: "login",
    Component: LoginPage,
  },
  {
    path: "getStart",
    Component: GetStartPage,
  },
  {
    path: "register",
    Component: CompanyRegister,
  },
  {
    path: "otp",
    Component: CompanyOtp,
  },
  {
    path: "company",
    Component: CompanyDashboard,
  },
];

export const employeeRoutes: Routes = [
  {
    path: "employee/login",
    Component: EmployeeLogin,
  },
  {
    path: "employee/otp",
    Component: EmployeeOtp,
  },
  {
    path: "employee/register",
    Component: EmployeeRegister,
  },
  {
    path: "employee/workspace",
    Component: EmployeeWorkspace,
  },
];

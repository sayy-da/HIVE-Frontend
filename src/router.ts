import { lazy } from "react";

import HomePage from "./pages/company/HomePage";
import LoginPage from "./pages/company/LoginPage";
import GetStartPage from "./pages/company/GetStartPage";
import CompanyRegister from "./pages/company/CompanyRegister";
import CompanyOtp from "./pages/company/CompanyOtp";
import CompanyForgotPassword from "./pages/company/CompanyForgotPassword";
import CompanyResetPassword from "./pages/company/CompanyResetPassword";
import OAuthSuccess from "./pages/company/OAuthSuccess";
import ChatApp from "./pages/employee/ChatPage";
import TeamCollaboration from "./pages/employee/ChatPage";
const CompanyDashboard = lazy(() => import("./pages/company/CompanyDashboard"));
const CompanyProfile = lazy(() => import("./pages/company/CompanyProfile"));
const EmployeeLogin = lazy(() => import("./pages/employee/EmployeeLogin"));
const EmployeeOtp = lazy(() => import("./pages/employee/EmployeeOtp"));
const EmployeeRegister = lazy(() => import("./pages/employee/EmployeeRegister"));
const EmployeePasswordSetup = lazy(() => import("./pages/employee/EmployeePasswordSetup"));
const EmployeeForgotPassword = lazy(() => import("./pages/employee/EmployeeForgotPassword"));
const EmployeeResetPassword = lazy(() => import("./pages/employee/EmployeeResetPassword"));
const EmployeeWorkspace = lazy(() => import("./pages/Workspace/Office"));
const EmployeeChat = lazy(() => import("./pages/employee/ChatPage"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

type Route = {
  path: string;
  Component: React.ComponentType;
  isPublic?: boolean;
  isProtected?: boolean;
  userType?: 'company' | 'employee' | 'admin';
};

type Routes = Route[];

// Public routes (accessible to everyone, no auth required)
export const PublicRoutes: Routes = [
  {
    path: "",
    Component: HomePage,
  },
];

// Company routes
export const companyRoutes: Routes = [
  {
    path: "company/login",
    Component: LoginPage,
    isPublic: true,
    userType: 'company',
  },
  {
    path: "company/getStart",
    Component: GetStartPage,
    isPublic: true,
    userType: 'company',
  },
  {
    path: "company/register",
    Component: CompanyRegister,
    isPublic: true,
    userType: 'company',
  },
  {
    path: "company/otp",
    Component: CompanyOtp,
    isPublic: true,
    userType: 'company',
  },
  {
    path: "company/forgot-password",
    Component: CompanyForgotPassword,
    isPublic: true,
    userType: 'company',
  },
  {
    path: "company/verify-otp-reset",
    Component: CompanyResetPassword,
    isPublic: true,
    userType: 'company',
  },
  {
    path: "company/oauth-success",
    Component: OAuthSuccess,
    isPublic: true,
    userType: 'company',
  },
  {
    path: "company",
    Component: CompanyDashboard,
    isProtected: true,
    userType: 'company',
  },
  {
    path: "company/profile",
    Component: CompanyProfile,
    isProtected: true,
    userType: 'company',
  },
];

// Employee routes
export const employeeRoutes: Routes = [
  {
    path: "employee/login",
    Component: EmployeeLogin,
    isPublic: true,
    userType: 'employee',
  },
  {
    path: "employee/otp",
    Component: EmployeeOtp,
    isPublic: true,
    userType: 'employee',
  },
  {
    path: "employee/register",
    Component: EmployeeRegister,
    isPublic: true,
    userType: 'employee',
  },
  {
    path: "employee/setup-password",
    Component: EmployeePasswordSetup,
    isPublic: true,
    userType: 'employee',
  },
  {
    path: "employee/forgot-password",
    Component: EmployeeForgotPassword,
    isPublic: true,
    userType: 'employee',
  },
  {
    path: "employee/verify-otp-reset",
    Component: EmployeeResetPassword,
    isPublic: true,
    userType: 'employee',
  },
  {
    path: "employee/workspace",
    Component: EmployeeWorkspace,
    isProtected: true,
    userType: 'employee',
  },
  {
    path: "employee/chat",
    Component: EmployeeChat,
    isProtected: true,
    userType: 'employee',
  },
];

// Admin routes
export const adminRoutes: Routes = [
  {
    path: "admin/login",
    Component: AdminLogin,
    isPublic: true,
    userType: 'admin',
  },
  {
    path: "admin/dashboard",
    Component: AdminDashboard,
    isProtected: true,
    userType: 'admin',
  },
];

export const websocketRoutes: Routes = [
 {
    path: "chat",
    Component: ChatApp,
    isPublic: true,
    userType: 'employee',
  },
  {
    path: "call",
    Component: TeamCollaboration,
    isPublic: true,
    userType: 'employee',
  }
];

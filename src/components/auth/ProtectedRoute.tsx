import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { jwtDecode } from 'jwt-decode';
import { useMemo, useEffect, useState, useRef } from 'react';
import { refreshApi } from '../../config/axiosRefresh';
import { login as employeeLogin } from '../../features/employee/employeeSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userType: 'company' | 'employee' | 'admin';
  redirectTo?: string;
}

/**
 * ProtectedRoute component - redirects to login if user is not authenticated or token is invalid
 * Also validates that the token's role matches the required userType
 * @param children - The component to render if authenticated
 * @param userType - Type of user (company, employee, or admin)
 * @param redirectTo - Custom redirect path (defaults to login page for user type)
 */
export default function ProtectedRoute({ 
  children, 
  userType, 
  redirectTo 
}: ProtectedRouteProps) {
  const location = useLocation();
  const dispatch: AppDispatch = useDispatch();
  // Only select the specific accessToken values to prevent unnecessary re-renders
  const companyAccessToken = useSelector((state: RootState) => state.company.accessToken);
  const employeeAccessToken = useSelector((state: RootState) => state.employee.accessToken);
  const adminAccessToken = useSelector((state: RootState) => state.admin.accessToken);
  const employeeCompanyId = useSelector((state: RootState) => state.employee.companyId);
  
  // State for token refresh attempt
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasAttemptedRefresh = useRef(false);

  // Get token and default redirect based on userType
  const { token, defaultRedirect } = useMemo(() => {
    switch (userType) {
      case 'company':
        return { token: companyAccessToken, defaultRedirect: '/company/login' };
      case 'employee':
        return { token: employeeAccessToken, defaultRedirect: '/employee/login' };
      case 'admin':
        return { token: adminAccessToken, defaultRedirect: '/admin/login' };
      default:
        return { token: undefined, defaultRedirect: '/company/login' };
    }
  }, [userType, companyAccessToken, employeeAccessToken, adminAccessToken]);

  // Validate token synchronously using useMemo to prevent infinite loops
  const isValid = useMemo(() => {
    if (!token) {
      return false;
    }

    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      // Check if token is expired
      if (decoded.exp && decoded.exp < currentTime) {
        return false;
      }

      // Standardized token format: role is always UserRole ("admin" | "company" | "employee")
      const tokenRole: string = decoded.role || '';

      // Validate role matches userType
      // For employees, tokenRole should be "employee" (not "admin" or "user" which is employeeRole)
      return tokenRole === userType;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }, [token, userType]);

  // Memoize redirect path to prevent unnecessary recalculations
  const redirectPath = useMemo(() => {
    return redirectTo || defaultRedirect;
  }, [redirectTo, defaultRedirect]);

  // Get current pathname to check if we're already on the login page
  const currentPath = location.pathname;

  // For employee routes, attempt to refresh token if missing (on page reload)
  useEffect(() => {
    // Only attempt refresh for employee routes, if token is missing, and we haven't tried yet
    if (userType === 'employee' && !token && !isRefreshing && !hasAttemptedRefresh.current) {
      hasAttemptedRefresh.current = true;
      setIsRefreshing(true);

      const attemptRefresh = async () => {
        try {
          // Attempt to refresh using HTTP-only cookie
          const res = await refreshApi.get('/auth/employee/refresh');
          const responseData = res?.data;
          const newAccessToken = responseData?.data || responseData;

          if (newAccessToken && typeof newAccessToken === 'string') {
            // Successfully refreshed - update Redux state
            dispatch(employeeLogin(newAccessToken));
            console.log('[ProtectedRoute] Employee token refreshed successfully');
            
            // If companyId is missing from token, fetch it from profile
            const decoded: any = jwtDecode(newAccessToken);
            if (!decoded.companyId) {
              console.log('[ProtectedRoute] CompanyId missing from token, will be loaded from profile');
            }
          } else {
            throw new Error('Invalid refresh response');
          }
        } catch (error) {
          console.log('[ProtectedRoute] Employee token refresh failed:', error);
          // Refresh failed - will redirect to login below
        } finally {
          setIsRefreshing(false);
        }
      };

      attemptRefresh();
    }
  }, [userType, token, isRefreshing, dispatch]);

  // Show loading state while attempting to refresh employee token
  if (userType === 'employee' && !token && isRefreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only redirect if not valid and not already on the login page (prevents infinite loops)
  // For employees, also check if we've attempted refresh and it failed
  if ((!isValid || !token) && currentPath !== redirectPath) {
    // For employee routes, include companyId in redirect if available
    if (userType === 'employee' && employeeCompanyId) {
      return <Navigate to={`${redirectPath}?companyid=${employeeCompanyId}`} state={{ from: location.pathname }} replace />;
    }
    return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
  }

  // If token is valid, render protected content
  if (isValid && token) {
    return <>{children}</>;
  }

  // If invalid but already on login page, render children (login page)
  return <>{children}</>;
}


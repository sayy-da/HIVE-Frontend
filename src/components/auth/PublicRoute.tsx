import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useSearchParams } from 'react-router-dom';

interface PublicRouteProps {
  children: React.ReactNode;
  userType?: 'company' | 'employee' | 'admin';
  redirectTo?: string;
}

/**
 * PublicRoute component - redirects authenticated users away from public pages (like login)
 * Checks if user has ANY valid accessToken and redirects to their respective home page
 * @param children - The component to render if not authenticated
 * @param userType - Optional: specific user type for this route (for role-specific public pages)
 * @param redirectTo - Custom redirect path (optional)
 */
export default function PublicRoute({ 
  children, 
  userType, 
  redirectTo 
}: PublicRouteProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hasTokenParam = searchParams.has('token');
  const companyAccessToken = useSelector((state: RootState) => state.company.accessToken);
  const employeeAccessToken = useSelector((state: RootState) => state.employee.accessToken);
  const adminAccessToken = useSelector((state: RootState) => state.admin.accessToken);

  // Check for any valid accessToken and determine redirect path
  const { isAuthenticated, redirectPath } = useMemo(() => {
    // Check all tokens to find if user is authenticated
    const tokens = [
      { token: companyAccessToken, role: 'company', redirect: '/company' },
      { token: employeeAccessToken, role: 'employee', redirect: '/employee/workspace' },
      { token: adminAccessToken, role: 'admin', redirect: '/admin/dashboard' }
    ];

    // Find the first valid token
    for (const { token, role, redirect } of tokens) {
      if (!token) continue;

      try {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        // Check if token is expired
        if (decoded.exp && decoded.exp < currentTime) {
          continue; // Token expired, try next one
        }

        // Check if role matches
        const tokenRole: string = decoded.role || '';
        if (tokenRole === role) {
          // If userType is specified, only redirect if role matches
          if (userType && userType !== role) {
            continue; // Role doesn't match userType, try next token
          }

          return {
            isAuthenticated: true,
            redirectPath: redirectTo || redirect
          };
        }
      } catch (error) {
        // Token is invalid, try next one
        continue;
      }
    }

    // No valid token found
    return {
      isAuthenticated: false,
      redirectPath: redirectTo || '/'
    };
  }, [companyAccessToken, employeeAccessToken, adminAccessToken, userType, redirectTo]);

  // Get current pathname to prevent redirect loops
  const currentPath = location.pathname;

  // If the URL has a token param (e.g., invite/setup-password or OAuth callback),
  // let the page handle it without redirecting away.
  if (hasTokenParam) {
    return <>{children}</>;
  }

  // Allow forgot password and reset password pages even for authenticated users
  // Users should be able to reset their password even when logged in
  const allowedPaths = ['/company/forgot-password', '/company/verify-otp-reset', '/employee/forgot-password', '/employee/verify-otp-reset'];
  if (allowedPaths.includes(currentPath)) {
    return <>{children}</>;
  }

  // Only redirect if authenticated with valid token and not already on the redirect path
  if (isAuthenticated && currentPath !== redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  // Render children (public page) if not authenticated or already on redirect path
  return <>{children}</>;
}


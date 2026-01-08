import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { jwtDecode } from 'jwt-decode';
import { login } from "../../features/company/companySlice";
import { AppDispatch } from "../../store";

export default function OAuthSuccess() {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Only process once
    if (hasProcessed.current) return;

    const token = searchParams.get("token");

    if (!token) {
      // No token in URL, redirect to login
      console.error('[OAuthSuccess] No token received from OAuth callback');
      navigate('/company/login', { replace: true });
      return;
    }

    hasProcessed.current = true;

    try {
      // Decode and validate token
      const decoded: any = jwtDecode(token);
      
      if (decoded?.role !== 'company') {
        console.error('[OAuthSuccess] OAuth token role mismatch', decoded?.role);
        navigate('/company/login', { replace: true });
        return;
      }

      // Store token in Redux
      dispatch(login(token));
      
      // Redirect to company dashboard
      navigate('/company', { replace: true });
    } catch (err) {
      console.error('[OAuthSuccess] Failed to decode OAuth token', err);
      navigate('/company/login', { replace: true });
    }
  }, [searchParams, dispatch, navigate]);

  // Show loading state while processing
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}


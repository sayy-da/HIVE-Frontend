import { useState, useEffect, useMemo, useRef } from "react";
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import loginImage from "../../assets/login-image.png";
import { loginCompany, loginWithGoogle } from "../../API/auth.api";
import { login } from "../../features/company/companySlice";
import { AppDispatch } from "../../store";
import { errorPopup } from "../../utils/popup";

export default function LoginPage() {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Track if we've already handled OAuth to prevent double navigation
  const hasHandledOAuth = useRef(false);
  
  const token = useMemo(() => searchParams.get("token"), [searchParams]);
  
  const from = useMemo(() => {
    return location.state?.from?.pathname || "/company";
  }, [location.state?.from?.pathname]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Google OAuth callback token - ONLY ONCE
  useEffect(() => {
    if (token && !hasHandledOAuth.current) {
      hasHandledOAuth.current = true;
      
      try {
        const decoded: any = jwtDecode(token);
        if (decoded?.role !== 'company') {
          console.error('[LoginPage] OAuth token role mismatch', decoded?.role);
          navigate('/', { replace: true });
          return;
        }
        
        dispatch(login(token));
        navigate(from, { replace: true });
      } catch (err) {
        console.error('[LoginPage] Failed to decode OAuth token', err);
        navigate('/', { replace: true });
      }
    }
  }, [token, dispatch, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      errorPopup("Please enter email and password");
      return;
    }

    setIsLoading(true);
    
    try {
      const data = await loginCompany(email, password);
      if (!data) return;
      
      dispatch(login(data));
      
      // Navigate immediately after dispatch
      navigate(from, { replace: true });
    } catch (err: any) {
      const data = err?.response?.data;
      let msg = "Login failed. Please try again.";
      
      const parseMessagesFromString = (str: string) => {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) {
            const joined = parsed.map((e: any) => e?.message).filter(Boolean).join(", ");
            return joined || str;
          }
        } catch {
          // not JSON
        }
        return str;
      };

      if (Array.isArray(data)) {
        const joined = data.map((e: any) => e?.message).filter(Boolean).join(", ");
        msg = joined || msg;
      } else if (typeof data === "string") {
        msg = parseMessagesFromString(data);
      } else if (data?.message) {
        msg = data.message;
      }
      
      errorPopup(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={loginImage}
          alt="Login visual"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-left">
            <h1 className="text-4xl font-bold mb-2">HIVE</h1>
            <p className="text-gray-600">Fly into HIVE!</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-sm opacity-75 px-2"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          {/* Footer Links */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => navigate("/company/forgot-password")}
              className="text-sm hover:underline text-indigo-600"
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/company/getStart")}
              className="text-black font-medium hover:underline"
              disabled={isLoading}
            >
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
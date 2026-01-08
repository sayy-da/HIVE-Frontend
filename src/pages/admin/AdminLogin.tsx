import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import getStart from "../../assets/getstart.webp";
import { adminLogin } from "../../API/auth.api";
import { login as adminLoginAction } from "../../features/admin/adminSlice";
import { AppDispatch } from "../../store";
import { errorPopup } from "../../utils/popup";

function AdminLogin() {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Admin login - redirect to admin dashboard after successful login
  const defaultRedirect = "/admin/dashboard";
  const from = location.state?.from?.pathname || defaultRedirect;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
// console.log("AdminLogin rendered");
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      errorPopup("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const accessToken = await adminLogin(email, password);
      dispatch(adminLoginAction(accessToken));
      
      // Decode token to verify role and redirect
      try {
        const decoded: any = jwtDecode(accessToken);
        const tokenRole = decoded.role;
        
        // Verify token has admin role
        if (tokenRole !== 'admin') {
          console.error(`Invalid role: expected 'admin', got '${tokenRole}'`);
          errorPopup("Invalid credentials. Only admin can access this login.");
          return;
        }
        
        // Always redirect to admin dashboard
        navigate('/admin/dashboard', { replace: true });
      } catch (decodeError) {
        console.error("Error decoding token:", decodeError);
        // If decode fails, still try to redirect (token might be valid but decode failed)
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err: any) {
      const data = err?.response?.data;
      let msg = "Login failed. Please try again.";

      const raw = data?.error ?? data?.message ?? data;

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

      if (Array.isArray(raw)) {
        const joined = raw.map((e: any) => e?.message).filter(Boolean).join(", ");
        msg = joined || msg;
      } else if (typeof raw === "string") {
        msg = parseMessagesFromString(raw);
      } else if (raw?.message) {
        msg = raw.message;
      }

      errorPopup(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Section (illustration / welcome area) */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gray-100 p-10">
        <img
          src={getStart}
          alt="Hive Illustration"
          className="max-w-xs md:max-w-sm lg:max-w-md object-contain"
        />
      </div>

      {/* Right Section - Get Started Form */}
      <div className="flex flex-col justify-center items-start w-full lg:w-1/2 px-6 sm:px-12 relative ">
        {/* HIVE heading positioned top-left of the right panel */}
        <div className="absolute top-40 left-6 lg:left-13">
          <h1 className="text-4xl md:text-5xl font-serif italic text-gray-800 mb-2 text-center">
            HIVE
          </h1>
          <p className="bold text-sm text-gray-700 text-center mb-4">Admin Login</p>
        </div>

        {/* Form container */}
        <div className="w-full max-w-md mt-36 lg:mt-36">
          <form className="space-y-6" onSubmit={handleLogin} noValidate>
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={isLoading}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-sm opacity-75 px-2 disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full inline-flex items-center justify-center py-3 rounded-md bg-black text-white text-sm font-medium shadow-xl transform active:translate-y-[1px] transition disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>

            
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;

import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import Login_image from "../../assets/login-image.png"
import { employeeLogin } from '../../API/employee.api'
import { errorPopup } from '../../utils/popup'

function EmployeeLogin() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const employee = useSelector((state: RootState) => state.employee)
  const companyid = searchParams.get("companyid")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to workspace if already authenticated
  useEffect(() => {
    if (employee.accessToken) {
      const companyIdParam = companyid || employee.companyId;
      if (companyIdParam) {
        navigate(`/employee/workspace?companyid=${companyIdParam}`, { replace: true });
      } else {
        navigate("/employee/workspace", { replace: true });
      }
    }
  }, [employee.accessToken, navigate, companyid, employee.companyId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      errorPopup("Please enter your email and password");
      return;
    }

    if (!companyid) {
      errorPopup("Company ID is missing. Please use the correct link.");
      return;
    }

    setIsLoading(true);

    try {
      const accessToken = await employeeLogin(email, companyid, password);
      if (accessToken) {
        // Use replace: true to prevent back navigation to login page
        if (companyid) {
          navigate(`/employee/workspace?companyid=${companyid}`, { replace: true });
        } else {
          navigate("/employee/workspace", { replace: true });
        }
      }
    } catch (error: any) {
      // Error is already handled by axios interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Section (illustration / welcome area) */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gray-100 p-10">
        <img
          src={Login_image}
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
          <p className="bold text-sm text-gray-700 text-center mb-4">Fly into HIVE!</p>
        </div>

        {/* Form container */}
        <div className="w-full max-w-md mt-36 lg:mt-36">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
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
                  className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                  required
                  disabled={isLoading}
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
                  className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                  required
                  disabled={isLoading}
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

            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate(`/employee/forgot-password${companyid ? `?companyid=${companyid}` : ''}`)}
                className="text-sm text-indigo-600 hover:underline"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full inline-flex items-center justify-center py-3 rounded-md text-white text-sm font-medium shadow-xl transform transition ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-black active:translate-y-[1px]"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EmployeeLogin

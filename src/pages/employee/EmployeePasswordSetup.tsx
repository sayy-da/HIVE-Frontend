import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Login_image from "../../assets/login-image.png";
import { axiosPostRequest } from '../../config/axios';
import { errorPopup, successPopup } from '../../utils/popup';

function EmployeePasswordSetup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const employee = useSelector((state: RootState) => state.employee);
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect to workspace if already authenticated (password already set)
  useEffect(() => {
    if (employee.accessToken && !token) {
      const companyIdParam = employee.companyId;
      if (companyIdParam) {
        navigate(`/employee/workspace?companyid=${companyIdParam}`, { replace: true });
      } else {
        navigate("/employee/workspace", { replace: true });
      }
    }
  }, [employee.accessToken, navigate, employee.companyId, token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!token) {
      errorPopup("Invalid invite link. Please contact your administrator.");
      return;
    }

    if (!password || !confirmPassword) {
      errorPopup("Please enter both password fields");
      return;
    }

    if (password.length < 6) {
      errorPopup("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      errorPopup("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await axiosPostRequest("/auth/employee/setup-password", { token, password });
      successPopup("Password created successfully! Check your mail for further details.");
      
      // Show success message instead of redirecting
      setIsSuccess(true);
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

      {/* Right Section - Password Setup Form */}
      <div className="flex flex-col justify-center items-start w-full lg:w-1/2 px-6 sm:px-12 relative">
        {/* HIVE heading positioned top-left of the right panel */}
        <div className="absolute top-40 left-6 lg:left-13">
          <h1 className="text-4xl md:text-5xl font-serif italic text-gray-800 mb-2 text-center">
            HIVE
          </h1>
          <p className="bold text-sm text-gray-700 text-center mb-4">Set Your Password</p>
        </div>

        {/* Form container */}
        <div className="w-full max-w-md mt-36 lg:mt-36">
          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Created Successfully!</h2>
                <p className="text-gray-600 text-sm">
                  Your password has been set. Please check your email for further details and login instructions.
                </p>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm disabled:opacity-50"
                  required
                  minLength={6}
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
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm disabled:opacity-50"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  disabled={isLoading}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-sm opacity-75 px-2 disabled:opacity-50"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
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
                    Setting up...
                  </>
                ) : (
                  "Set Password"
                )}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeePasswordSetup;


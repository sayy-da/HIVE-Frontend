import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import getStart from "../../assets/getstart.webp";
import { registerCompany, loginWithGoogle } from "../../API/auth.api";
import { errorPopup } from "../../utils/popup";
import { login } from "../../features/company/companySlice";
import { AppDispatch, RootState } from "../../store";

const GetStartPage = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accessToken } = useSelector((state: RootState) => state.company);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New: Loading state

  // Redirect if already logged in (unless coming from Google OAuth)
  useEffect(() => {
    const token = searchParams.get("token");
    if (accessToken && !token) {
      // Already logged in and not from Google OAuth - redirect to dashboard
      navigate("/company", { replace: true });
    }
  }, [accessToken, navigate, searchParams]);

  // Handle Google OAuth callback token
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // Token received from Google OAuth callback
      dispatch(login(token));
      navigate("/company", { replace: true });
    }
  }, [searchParams, dispatch, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      errorPopup("Please enter your email");
      return;
    }

    setIsLoading(true); // Start loading

    try {
      await registerCompany(email);
      navigate("/company/otp", { state: { email } });
      setEmail(""); 
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Something went wrong. Please try again.";
      errorPopup(errorMessage);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="flex min-h-screen" >
      {/* Left Column: Illustration */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gray-100 p-10">
        <img
          src={getStart}
          alt="Hive Illustration"
          className="w-full max-w-lg md:max-w-xl lg:max-w-2xl object-contain"
        />
      </div>

      {/* Right Column: Form */}
      <div className=" flex flex-col justify-center items-start w-full lg:w-1/2 px-6 sm:px-12 relative">
        <div className="absolute top-8 left-6 lg:left-13">
          <h1 className="text-4xl md:text-5xl font-serif italic text-gray-800 mb-2">
            HIVE
          </h1>
          <p className="bold text-sm text-gray-700 mb-4">Get started with HIVE</p>
        </div>

        <div className="w-full max-w-md mt-40 lg:mt-36">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
                  required // HTML5 validation
                  disabled={isLoading} // Disable input while loading
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                // New: Disable button while loading
                disabled={isLoading} 
                className={`
                  w-full inline-flex items-center justify-center py-3 rounded-md text-white text-sm font-medium shadow-xl transition
                  ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black transform active:translate-y-[1px]'}
                `}
              >
                {/* New: Conditional button text/spinner */}
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </form>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={isLoading}
              className={`w-full inline-flex items-center justify-center gap-3 py-3 rounded-md border-2 border-gray-300 text-sm font-medium shadow-sm transform transition ${
                isLoading
                  ? "bg-gray-100 cursor-not-allowed"
                  : "bg-white hover:bg-gray-50 active:translate-y-[1px]"
              }`}
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
              Continue with Google
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/company/login")}
              className="text-black font-medium hover:underline"
              disabled={isLoading}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GetStartPage;
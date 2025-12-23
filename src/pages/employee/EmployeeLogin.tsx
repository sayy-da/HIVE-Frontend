import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Login_image from "../../assets/login-image.png"
import { checkEmployeeStatus, registerEmployee, requestEmployeeLoginOTP } from '../../API/employeeAuth.api'
import { errorPopup } from '../../utils/popup'
import { setEmployeeData } from '../../features/employee/employeeSlice'

function EmployeeLogin() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const companyid = searchParams.get("companyid")
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email) {
      errorPopup("Please enter your email");
      return;
    }

    if (!companyid) {
      errorPopup("Company ID is missing. Please use the correct link.");
      return;
    }

    setIsLoading(true);

    try {
      
      const statusResponse = await checkEmployeeStatus(email, companyid);
      const status = statusResponse.status;

      if (status === "not registered") {
        await registerEmployee(email, companyid);
        dispatch(setEmployeeData({ email, companyId: companyid || "" }));
        navigate(`/employee/otp?companyid=${companyid}`, { state: { email, companyid, mode: "register" } });
      } else if (status === "approved") {
        await requestEmployeeLoginOTP(email, companyid);
        dispatch(setEmployeeData({ email, companyId: companyid || "", status: "approved" }));
        navigate(`/employee/otp?companyid=${companyid}`, { state: { email, companyid, mode: "login" } });
      } else if (status === "requested") {
        errorPopup("Your registration is pending approval. Please contact your administrator.");
      } else if (status === "rejected") {
        errorPopup("Your registration has been rejected. Please contact your administrator.");
      } else {
        errorPopup("Unknown status. Please contact support.");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Something went wrong. Please try again.";
      errorPopup(errorMessage);
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

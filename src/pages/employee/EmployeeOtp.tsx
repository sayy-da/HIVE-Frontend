import React, { useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { verifyEmployeeOTP, resendEmployeeOTP, verifyEmployeeLoginOTP } from '../../API/employeeAuth.api'
import { errorPopup } from '../../utils/popup'

function EmployeeOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // Get email from location state and companyid from URL query params (preferred) or state
  const email = location.state?.email || "";
  const companyid = searchParams.get("companyid") || location.state?.companyid || "";
  const mode = location.state?.mode || "register"; // "register" | "login"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code) {
      errorPopup("Please enter the OTP code");
      return;
    }

    if (!email) {
      errorPopup("Email not found. Please start registration again.");
      navigate(`/employee/login?companyid=${companyid || ''}`);
      return;
    }

    if (!companyid) {
      errorPopup("Company ID not found. Please start registration again.");
      navigate("/employee/login");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        await verifyEmployeeLoginOTP(email, companyid, code);
        navigate(`/employee/workspace?companyid=${companyid}`);
      } else {
        await verifyEmployeeOTP(email, code);
        navigate(`/employee/register?companyid=${companyid}`, { state: { email, companyid } });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Invalid OTP. Please try again.";
      errorPopup(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      errorPopup("Email not found. Please start registration again.");
      navigate(`/employee/login?companyid=${companyid || ''}`);
      return;
    }

    setIsResending(true);

    try {
      await resendEmployeeOTP(email);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to resend OTP. Please try again.";
      errorPopup(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-4">
      <div className="w-full max-w-sm">
        <h2 className="text-center text-lg font-semibold mb-6">
          Enter The Confirmation Code
        </h2>
        {email && (
          <p className="text-center text-xs text-gray-500 mb-4">
            Code sent to: {email}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Confirmation Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border-b border-gray-300 focus:outline-none focus:border-black px-2 py-2 text-sm"
              disabled={isLoading}
              maxLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-black text-white py-3 rounded-md shadow-lg text-sm font-medium ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? "Verifying..." : "Submit"}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-3">
          Didn't receive Confirmation Code?{" "}
          <button
            onClick={handleResend}
            disabled={isResending}
            className={`text-blue-600 font-medium hover:underline ${
              isResending ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isResending ? "Sending..." : "Resend Now"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default EmployeeOtp

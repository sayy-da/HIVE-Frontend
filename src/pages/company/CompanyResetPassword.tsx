import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import loginImage from "../../assets/login-image.png";
import { verifyOTP, resetPasswordCompany, resendOTP } from "../../API/auth.api";
import { errorPopup } from "../../utils/popup";
import { Eye, EyeOff } from "lucide-react";

export default function CompanyResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [step, setStep] = useState<"otp" | "reset">("otp");

  useEffect(() => {
    if (!email) {
      errorPopup("Email is required");
      navigate("/company/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otp) {
      errorPopup("Please enter the OTP");
      return;
    }

    setIsLoading(true);
    try {
      await verifyOTP(email, otp);
      setStep("reset");
    } catch (err: any) {
      // Error is already handled by axios interceptor
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      errorPopup("Please enter both password fields");
      return;
    }

    if (newPassword.length < 6) {
      errorPopup("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      errorPopup("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordCompany(email, newPassword);
      navigate("/company/login", { replace: true });
    } catch (err: any) {
      // Error is already handled by axios interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gray-100 p-10">
        <img
          src={loginImage}
          alt="Hive Illustration"
          className="max-w-xs md:max-w-sm lg:max-w-md object-contain"
        />
      </div>

      <div className="flex flex-col justify-center items-start w-full lg:w-1/2 px-6 sm:px-12 relative">
        <div className="absolute top-40 left-6 lg:left-13">
          <h1 className="text-4xl md:text-5xl font-serif italic text-gray-800 mb-2 text-center">
            HIVE
          </h1>
        </div>

        <div className="w-full max-w-md mx-auto mt-32">
          {step === "otp" ? (
            <>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Verify OTP</h2>
              <p className="text-gray-600 mb-8">
                Enter the OTP sent to {email}
              </p>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    OTP Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter OTP"
                    required
                    disabled={isLoading}
                    maxLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Didn't receive the OTP?
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) return;
                    setIsResending(true);
                    try {
                      await resendOTP(email);
                    } catch (err: any) {
                      // Error is already handled by axios interceptor
                    } finally {
                      setIsResending(false);
                    }
                  }}
                  disabled={isResending || isLoading}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? "Resending..." : "Resend OTP"}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h2>
              <p className="text-gray-600 mb-8">
                Enter your new password
              </p>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
                      placeholder="Enter new password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
                      placeholder="Confirm new password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/company/login"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

